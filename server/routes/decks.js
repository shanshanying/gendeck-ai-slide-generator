const express = require('express');
const router = express.Router();
const deckService = require('../services/deckService');
const deckHistoryService = require('../services/deckHistoryService');

// GET /api/decks - List all decks
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const decks = await deckService.getDecks(parseInt(limit), parseInt(offset));
    res.json({ success: true, data: decks });
  } catch (error) {
    console.error('Error fetching decks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/decks/search - Search decks
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    if (!q) {
      return res.status(400).json({ success: false, error: 'Query parameter required' });
    }
    const decks = await deckService.searchDecks(q, parseInt(limit));
    res.json({ success: true, data: decks });
  } catch (error) {
    console.error('Error searching decks:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/decks/:id - Get a single deck with slides
router.get('/:id', async (req, res) => {
  try {
    const deck = await deckService.getDeck(req.params.id);
    if (!deck) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    
    // Debug: Log first slide to check data
    if (deck.slides && deck.slides.length > 0) {
      console.log('Loading deck:', deck.topic, '-', deck.slides.length, 'slides');
      console.log('First slide html_content length:', (deck.slides[0].html_content || '').length);
      console.log('Full HTML available:', deck.full_html ? 'Yes (' + deck.full_html.length + ' chars)' : 'No');
    }
    
    res.json({ success: true, data: deck });
  } catch (error) {
    console.error('Error fetching deck:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/decks/:id/html - Get full deck HTML for download
router.get('/:id/html', async (req, res) => {
  try {
    const deck = await deckService.getDeck(req.params.id);
    if (!deck) {
      return res.status(404).json({ success: false, error: 'Deck not found' });
    }
    
    if (!deck.full_html) {
      return res.status(404).json({ success: false, error: 'Full HTML not available for this deck' });
    }
    
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="${deck.topic.replace(/\s+/g, '-').toLowerCase()}.html"`);
    res.send(deck.full_html);
  } catch (error) {
    console.error('Error fetching deck HTML:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/decks - Create a new deck
router.post('/', async (req, res) => {
  try {
    const { 
      topic, audience, purpose, colorPalette, slides, totalCost, 
      fullHtml, documentContent,
      outlineProvider, outlineModel, outlineBaseUrl,
      slidesProvider, slidesModel, slidesBaseUrl
    } = req.body;
    
    if (!topic || !slides || !Array.isArray(slides)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Topic and slides array are required' 
      });
    }
    
    // Debug: Log first slide to check data
    if (slides.length > 0) {
      console.log('Saving deck:', topic, '-', slides.length, 'slides');
      console.log('First slide html_content length:', (slides[0].html_content || slides[0].htmlContent || '').length);
      console.log('Full HTML length:', (fullHtml || '').length);
    }
    
    const deckId = await deckService.saveDeck({
      topic,
      audience,
      purpose,
      colorPalette,
      slides,
      totalCost,
      fullHtml,
      documentContent,
      outlineProvider,
      outlineModel,
      outlineBaseUrl,
      slidesProvider,
      slidesModel,
      slidesBaseUrl
    });
    
    res.status(201).json({ success: true, data: { id: deckId } });
  } catch (error) {
    console.error('Error creating deck:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/decks/:id - Update deck metadata
router.put('/:id', async (req, res) => {
  try {
    const updates = req.body;
    await deckService.updateDeck(req.params.id, updates);
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating deck:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/decks/:id - Delete a deck
router.delete('/:id', async (req, res) => {
  try {
    await deckService.deleteDeck(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting deck:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== DECK HISTORY ROUTES ====================

// GET /api/decks/:id/history - Get all versions of a deck
router.get('/:id/history', async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const versions = await deckHistoryService.getVersions(req.params.id, parseInt(limit));
    res.json({ success: true, data: versions });
  } catch (error) {
    console.error('Error fetching deck history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/decks/:id/history - Save a new version
router.post('/:id/history', async (req, res) => {
  try {
    const { topic, fullHtml, outline, colorPalette } = req.body;
    
    // Get next version number
    const latestVersion = await deckHistoryService.getLatestVersion(req.params.id);
    
    const version = await deckHistoryService.saveVersion(req.params.id, {
      topic,
      fullHtml,
      outline,
      colorPalette,
      version: latestVersion + 1
    });
    
    res.status(201).json({ success: true, data: version });
  } catch (error) {
    console.error('Error saving deck version:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/decks/history/:historyId - Get a specific version
router.get('/history/:historyId', async (req, res) => {
  try {
    const version = await deckHistoryService.getVersion(req.params.historyId);
    if (!version) {
      return res.status(404).json({ success: false, error: 'Version not found' });
    }
    res.json({ success: true, data: version });
  } catch (error) {
    console.error('Error fetching version:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
