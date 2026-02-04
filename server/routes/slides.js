const express = require('express');
const router = express.Router();
const slideService = require('../services/slideService');

// GET /api/slides/:slideId/history - Get history for a slide
router.get('/:slideId/history', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const history = await slideService.getSlideHistory(
      req.params.slideId, 
      parseInt(limit)
    );
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Error fetching slide history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/slides/history/:historyId - Get a specific history version
router.get('/history/:historyId', async (req, res) => {
  try {
    const version = await slideService.getHistoryVersion(req.params.historyId);
    if (!version) {
      return res.status(404).json({ success: false, error: 'Version not found' });
    }
    res.json({ success: true, data: version });
  } catch (error) {
    console.error('Error fetching history version:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/slides/:slideId/restore - Restore to a historical version
router.post('/:slideId/restore', async (req, res) => {
  try {
    const { historyId } = req.body;
    if (!historyId) {
      return res.status(400).json({ 
        success: false, 
        error: 'historyId is required' 
      });
    }
    
    const restored = await slideService.restoreSlideVersion(
      req.params.slideId,
      historyId
    );
    
    res.json({ success: true, data: restored });
  } catch (error) {
    console.error('Error restoring slide:', error);
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

// GET /api/decks/:deckId/slides/history - Get all slide history for a deck
router.get('/deck/:deckId/history', async (req, res) => {
  try {
    const { limitPerSlide = 10 } = req.query;
    const history = await slideService.getDeckSlideHistory(
      req.params.deckId,
      parseInt(limitPerSlide)
    );
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Error fetching deck slide history:', error);
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
