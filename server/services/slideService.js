const { pool, withTransaction } = require('../db');

class SlideService {
  /**
   * Get slide by id
   */
  async getSlideById(slideId) {
    const result = await pool.query(
      `SELECT * FROM slides WHERE id = $1`,
      [slideId]
    );
    return result.rows[0] || null;
  }

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
   * Update a slide
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
