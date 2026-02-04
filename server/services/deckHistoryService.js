const { pool, withTransaction } = require('../db');

class DeckHistoryService {
  /**
   * Save a new version of the full deck
   */
  async saveVersion(deckId, versionData) {
    const { topic, fullHtml, outline, colorPalette, version = 1 } = versionData;
    
    const result = await pool.query(
      `INSERT INTO deck_history (deck_id, topic, full_html, outline, color_palette, version)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [deckId, topic, fullHtml, JSON.stringify(outline), colorPalette, version]
    );
    
    return result.rows[0];
  }

  /**
   * Get all versions for a deck
   */
  async getVersions(deckId, limit = 50) {
    const result = await pool.query(
      `SELECT id, deck_id, topic, color_palette, version, saved_at
       FROM deck_history 
       WHERE deck_id = $1
       ORDER BY version DESC
       LIMIT $2`,
      [deckId, limit]
    );
    return result.rows;
  }

  /**
   * Get a specific version
   */
  async getVersion(historyId) {
    const result = await pool.query(
      `SELECT * FROM deck_history WHERE id = $1`,
      [historyId]
    );
    return result.rows[0] || null;
  }

  /**
   * Get the latest version number for a deck
   */
  async getLatestVersion(deckId) {
    const result = await pool.query(
      `SELECT MAX(version) as max_version FROM deck_history WHERE deck_id = $1`,
      [deckId]
    );
    return result.rows[0]?.max_version || 0;
  }

  /**
   * Delete old history (cleanup)
   */
  async deleteOldHistory(deckId, keepVersions = 10) {
    const result = await pool.query(
      `DELETE FROM deck_history 
       WHERE deck_id = $1 
       AND id NOT IN (
         SELECT id FROM deck_history 
         WHERE deck_id = $1 
         ORDER BY version DESC 
         LIMIT $2
       )`,
      [deckId, keepVersions]
    );
    return result.rowCount;
  }
}

module.exports = new DeckHistoryService();
