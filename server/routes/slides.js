const express = require('express');
const router = express.Router();
const slideService = require('../services/slideService');
const deckHistoryService = require('../services/deckHistoryService');

// GET /api/slides/:slideId/history - Get history for a slide (now returns deck history)
router.get('/:slideId/history', async (req, res) => {
  try {
    // Get the slide to find its deck
    const slideResult = await slideService.getSlideById(req.params.slideId);
    if (!slideResult) {
      return res.status(404).json({ success: false, error: 'Slide not found' });
    }
    
    // Return deck-level history instead
    const { limit = 50 } = req.query;
    const history = await deckHistoryService.getVersions(slideResult.deck_id, parseInt(limit));
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/slides/history/:historyId - Get a specific history version
router.get('/history/:historyId', async (req, res) => {
  try {
    const version = await deckHistoryService.getVersion(req.params.historyId);
    if (!version) {
      return res.status(404).json({ success: false, error: 'Version not found' });
    }
    res.json({ success: true, data: version });
  } catch (error) {
    console.error('Error fetching history version:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/slides/:slideId/restore - Restore to a historical version (loads deck version)
router.post('/:slideId/restore', async (req, res) => {
  try {
    const { historyId } = req.body;
    if (!historyId) {
      return res.status(400).json({ 
        success: false, 
        error: 'historyId is required' 
      });
    }
    
    // Get the deck version
    const version = await deckHistoryService.getVersion(historyId);
    if (!version) {
      return res.status(404).json({ success: false, error: 'Version not found' });
    }
    
    res.json({ success: true, data: version });
  } catch (error) {
    console.error('Error restoring version:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/slides/:slideId - Update a slide
router.put('/:slideId', async (req, res) => {
  try {
    const updates = req.body;
    const slide = await slideService.updateSlide(req.params.slideId, updates);
    res.json({ success: true, data: slide });
  } catch (error) {
    console.error('Error updating slide:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/decks/:deckId/slides/history - Get deck history
router.get('/deck/:deckId/history', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const history = await deckHistoryService.getVersions(
      req.params.deckId,
      parseInt(limit)
    );
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Error fetching deck history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/decks/:deckId/slides/:slideIndex/save - Save a single slide
router.post('/deck/:deckId/slide/:slideIndex', async (req, res) => {
  try {
    const slide = await slideService.saveSingleSlide(
      req.params.deckId,
      parseInt(req.params.slideIndex),
      req.body
    );
    res.json({ success: true, data: slide });
  } catch (error) {
    console.error('Error saving slide:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
