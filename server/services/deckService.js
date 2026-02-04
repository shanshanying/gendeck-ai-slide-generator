const { pool, withTransaction } = require('../db');

class DeckService {
  /**
   * Save a complete deck with all slides
   */
  async saveDeck(deckData) {
    const { 
      topic, audience, purpose, colorPalette, slides, totalCost = 0, 
      fullHtml = null, documentContent = null,
      outlineProvider = null, outlineModel = null, outlineBaseUrl = null,
      slidesProvider = null, slidesModel = null, slidesBaseUrl = null
    } = deckData;
    
    return withTransaction(async (client) => {
      // Insert or update deck
      const deckResult = await client.query(
        `INSERT INTO decks (
          topic, audience, purpose, color_palette, slide_count, total_cost, 
          full_html, document_content, 
          outline_provider, outline_model, outline_base_url,
          slides_provider, slides_model, slides_base_url
        )
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
         RETURNING id`,
        [
          topic, audience, purpose, colorPalette, slides.length, totalCost, 
          fullHtml, documentContent,
          outlineProvider, outlineModel, outlineBaseUrl,
          slidesProvider, slidesModel, slidesBaseUrl
        ]
      );
      
      const deckId = deckResult.rows[0].id;
      
      // Insert slides
      for (let i = 0; i < slides.length; i++) {
        const slide = slides[i];
        await client.query(
          `INSERT INTO slides (
            deck_id, slide_index, title, content_points, 
            html_content, notes, layout_suggestion
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [
            deckId,
            i,
            slide.title,
            slide.content_points || slide.contentPoints || [],
            slide.html_content || slide.htmlContent,
            slide.notes || '',
            slide.layout_suggestion || slide.layoutSuggestion || 'Standard'
          ]
        );
      }
      
      return deckId;
    });
  }

  /**
   * Get all decks (paginated)
   */
  async getDecks(limit = 50, offset = 0) {
    const result = await pool.query(
      `SELECT id, topic, audience, purpose, slide_count, total_cost, created_at, updated_at
       FROM decks
       ORDER BY updated_at DESC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  /**
   * Get a single deck with all current slides
   */
  async getDeck(deckId) {
    const deckResult = await pool.query(
      `SELECT * FROM decks WHERE id = $1`,
      [deckId]
    );
    
    if (deckResult.rows.length === 0) {
      return null;
    }
    
    const deck = deckResult.rows[0];
    
    const slidesResult = await pool.query(
      `SELECT * FROM slides 
       WHERE deck_id = $1 AND is_current = true
       ORDER BY slide_index ASC`,
      [deckId]
    );
    
    return {
      ...deck,
      slides: slidesResult.rows
    };
  }

  /**
   * Update a deck's metadata
   */
  async updateDeck(deckId, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    if (updates.topic !== undefined) {
      fields.push(`topic = $${paramIndex++}`);
      values.push(updates.topic);
    }
    if (updates.audience !== undefined) {
      fields.push(`audience = $${paramIndex++}`);
      values.push(updates.audience);
    }
    if (updates.purpose !== undefined) {
      fields.push(`purpose = $${paramIndex++}`);
      values.push(updates.purpose);
    }
    if (updates.colorPalette !== undefined) {
      fields.push(`color_palette = $${paramIndex++}`);
      values.push(updates.colorPalette);
    }
    if (updates.slideCount !== undefined) {
      fields.push(`slide_count = $${paramIndex++}`);
      values.push(updates.slideCount);
    }
    if (updates.totalCost !== undefined) {
      fields.push(`total_cost = $${paramIndex++}`);
      values.push(updates.totalCost);
    }
    
    if (fields.length === 0) return;
    
    values.push(deckId);
    
    await pool.query(
      `UPDATE decks SET ${fields.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
  }

  /**
   * Delete a deck
   */
  async deleteDeck(deckId) {
    await pool.query('DELETE FROM decks WHERE id = $1', [deckId]);
  }

  /**
   * Search decks by topic
   */
  async searchDecks(query, limit = 20) {
    const result = await pool.query(
      `SELECT id, topic, audience, slide_count, created_at
       FROM decks
       WHERE topic ILIKE $1
       ORDER BY updated_at DESC
       LIMIT $2`,
      [`%${query}%`, limit]
    );
    return result.rows;
  }
}

module.exports = new DeckService();
