const express = require('express');
const router = express.Router();
const deckService = require('../services/deckService');

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
    res.json({ success: true, data: deck });
  } catch (error) {
    console.error('Error fetching deck:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/decks - Create a new deck
router.post('/', async (req, res) => {
  try {
    const { topic, audience, purpose, colorPalette, slides, totalCost } = req.body;
    
    if (!topic || !slides || !Array.isArray(slides)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Topic and slides array are required' 
      });
    }
    
    const deckId = await deckService.saveDeck({
      topic,
      audience,
      purpose,
      colorPalette,
      slides,
      totalCost
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

module.exports = router;
