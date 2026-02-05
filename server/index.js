const express = require('express');
const cors = require('cors');
require('dotenv').config();

const deckRoutes = require('./routes/decks');
const slideRoutes = require('./routes/slides');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Large limit for HTML content
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/decks', deckRoutes);
app.use('/api/slides', slideRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   GenDeck API Server                                   ║
║   Running on port ${PORT}                                ║
║                                                        ║
║   Endpoints:                                           ║
║   • GET  /api/health          - Health check           ║
║   • GET  /api/decks           - List decks             ║
║   • POST /api/decks           - Create deck            ║
║   • GET  /api/decks/:id       - Get deck               ║
║   • GET  /api/slides/:id/history - Slide history       ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});
