const { pool, withTransaction } = require('../db');

class SlideService {
  /**
   * Get current slide by deck_id and slide_index
   */
  async getSlide(deckId, slideIndex) {
    const result = await pool.query(
      `SELECT * FROM slides 
       WHERE deck_id = $1 AND slide_index = $2 AND is_current = true`,
      [deckId, slideIndex]
    );
    return result.rows[0] || null;
  }

  /**
   * Update a slide (triggers history save)
   */
  async updateSlide(slideId, updates) {
    const fields = [];
    const values = [];
    let paramIndex = 1;
    
    if (updates.title !== undefined) {
      fields.push(`title = $${paramIndex++}`);
      values.push(updates.title);
    }
    if (updates.contentPoints !== undefined) {
      fields.push(`content_points = $${paramIndex++}`);
      values.push(updates.contentPoints);
    }
    if (updates.htmlContent !== undefined) {
      fields.push(`html_content = $${paramIndex++}`);
      values.push(updates.htmlContent);
    }
    if (updates.notes !== undefined) {
      fields.push(`notes = $${paramIndex++}`);
      values.push(updates.notes);
    }
    if (updates.layoutSuggestion !== undefined) {
      fields.push(`layout_suggestion = $${paramIndex++}`);
      values.push(updates.layoutSuggestion);
    }
    
    if (fields.length === 0) return null;
    
    values.push(slideId);
    
    const result = await pool.query(
      `UPDATE slides SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );
    
    return result.rows[0];
  }

  /**
   * Get all history versions for a specific slide
   */
  async getSlideHistory(slideId, limit = 50) {
    const result = await pool.query(
      `SELECT 
        h.id, h.slide_id, h.slide_index, h.title, h.content_points,
        h.html_content, h.notes, h.layout_suggestion, h.version,
        h.saved_at, s.deck_id
       FROM slide_history h
       JOIN slides s ON h.slide_id = s.id
       WHERE h.slide_id = $1
       ORDER BY h.version DESC
       LIMIT $2`,
      [slideId, limit]
    );
    return result.rows;
  }

  /**
   * Get history for all slides in a deck
   */
  async getDeckSlideHistory(deckId, limitPerSlide = 10) {
    const result = await pool.query(
      `SELECT 
        h.id, h.slide_id, h.slide_index, h.title, 
        h.version, h.saved_at, LEFT(h.html_content, 200) as preview
       FROM slide_history h
       WHERE h.deck_id = $1
       ORDER BY h.slide_index ASC, h.version DESC`,
      [deckId]
    );
    
    // Group by slide_index
    const grouped = {};
    for (const row of result.rows) {
      if (!grouped[row.slide_index]) {
        grouped[row.slide_index] = [];
      }
      if (grouped[row.slide_index].length < limitPerSlide) {
        grouped[row.slide_index].push(row);
      }
    }
    
    return grouped;
  }

  /**
   * Restore a slide to a specific historical version
   */
  async restoreSlideVersion(slideId, historyId) {
    return withTransaction(async (client) => {
      // Get the historical version
      const historyResult = await client.query(
        `SELECT * FROM slide_history WHERE id = $1`,
        [historyId]
      );
      
      if (historyResult.rows.length === 0) {
        throw new Error('History version not found');
      }
      
      const history = historyResult.rows[0];
      
      // Update the current slide to match the historical version
      // This will trigger the history save (creating a new version)
      const result = await client.query(
        `UPDATE slides 
         SET title = $1, content_points = $2, html_content = $3, 
             notes = $4, layout_suggestion = $5
         WHERE id = $6
         RETURNING *`,
        [
          history.title,
          history.content_points,
          history.html_content,
          history.notes,
          history.layout_suggestion,
          slideId
        ]
      );
      
      return result.rows[0];
    });
  }

  /**
   * Get a specific historical version
   */
  async getHistoryVersion(historyId) {
    const result = await pool.query(
      `SELECT * FROM slide_history WHERE id = $1`,
      [historyId]
    );
    return result.rows[0] || null;
  }

  /**
   * Delete old history (cleanup)
   */
  async deleteOldHistory(daysToKeep = 30) {
    const result = await pool.query(
      `DELETE FROM slide_history 
       WHERE saved_at < NOW() - INTERVAL '${daysToKeep} days'`,
    );
    return result.rowCount;
  }

  /**
   * Save a single slide immediately (for auto-save)
   */
  async saveSingleSlide(deckId, slideIndex, slideData) {
    const { title, contentPoints, htmlContent, notes, layoutSuggestion } = slideData;
    
    // Check if slide exists
    const existing = await this.getSlide(deckId, slideIndex);
    
    if (existing) {
      // Update existing slide
      return this.updateSlide(existing.id, {
        title,
        contentPoints,
        htmlContent,
        notes,
        layoutSuggestion
      });
    } else {
      // Insert new slide
      const result = await pool.query(
        `INSERT INTO slides (
          deck_id, slide_index, title, content_points,
          html_content, notes, layout_suggestion
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *`,
        [deckId, slideIndex, title, contentPoints, htmlContent, notes || '', layoutSuggestion || 'Standard']
      );
      return result.rows[0];
    }
  }
}

module.exports = new SlideService();
