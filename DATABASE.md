# GenDeck Database Setup Guide

This guide explains how to set up the PostgreSQL database for GenDeck to enable persistent storage and slide history features.

## Overview

With the database backend, you can:
- **Save decks** to the database for long-term storage
- **Browse and reload** previous presentations
- **View slide history** - every change to a slide is versioned automatically
- **Restore** any previous version of a slide

## Prerequisites

- PostgreSQL 12+ installed
- Node.js 18+ installed

## Quick Start

### 1. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE gendeck;

# Exit
\q
```

### 2. Run Schema

```bash
cd server
psql -U postgres -d gendeck -f ../database/schema.sql
```

### 3. Configure Environment

```bash
cd server
cp .env.example .env
# Edit .env with your database credentials
```

### 4. Install Dependencies & Start Server

```bash
cd server
npm install
npm run dev
```

### 5. Configure Frontend

Edit `.env.local` in the project root:

```env
GEMINI_API_KEY=your_gemini_api_key_here
VITE_API_URL=http://localhost:3001/api
```

Restart the Vite dev server.

## Database Schema

### Tables

**decks** - Stores presentation metadata
- `id` - UUID primary key
- `topic` - Presentation title
- `audience`, `purpose` - Metadata
- `color_palette` - Theme colors
- `slide_count`, `total_cost` - Statistics
- `created_at`, `updated_at` - Timestamps

**slides** - Current version of each slide
- `id` - UUID primary key
- `deck_id` - Reference to deck
- `slide_index` - Position in presentation
- `title`, `content_points`, `html_content` - Content
- `notes`, `layout_suggestion` - Metadata
- `version` - Incremented on each change
- `is_current` - Always true for current version

**slide_history** - All historical versions
- Stores previous versions automatically via trigger
- Allows restoring any past version
- Tracks `saved_at` timestamp

## API Endpoints

### Decks
- `GET /api/decks` - List all decks
- `POST /api/decks` - Create new deck
- `GET /api/decks/:id` - Get deck with slides
- `PUT /api/decks/:id` - Update deck metadata
- `DELETE /api/decks/:id` - Delete deck
- `GET /api/decks/search?q=query` - Search decks

### Slides
- `GET /api/slides/:id/history` - Get slide history
- `GET /api/slides/history/:id` - Get specific version
- `POST /api/slides/:id/restore` - Restore to version
- `PUT /api/slides/:id` - Update slide
- `GET /api/slides/deck/:deckId/history` - Get all slide history

### Health
- `GET /api/health` - Health check

## Usage

### Saving a Deck

1. Generate or import a presentation
2. Click the **Save** button in the header
3. The deck is saved to the database

### Browsing Saved Decks

1. Click the **Browse** button in the header
2. Search or scroll through saved decks
3. Click a deck to load it
4. Use the delete button (trash icon) to remove decks

### Viewing Slide History

1. Select a slide in the sidebar
2. Click the **History** button in the header
3. Browse all previous versions in the left panel
4. Click a version to preview it
5. Click **Restore This Version** to roll back

### Automatic Version Tracking

Every time you regenerate a slide, the previous version is automatically saved to history. You can view and restore any past version.

## Environment Variables

### Frontend (.env.local)

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | (empty) |

When `VITE_API_URL` is not set, database features are hidden from the UI.

### Backend (server/.env)

| Variable | Description | Default |
|----------|-------------|---------|
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_NAME` | Database name | gendeck |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | (required) |
| `PORT` | API server port | 3001 |
| `NODE_ENV` | Environment | development |

## Production Deployment

### Database

Use a managed PostgreSQL service:
- AWS RDS
- Google Cloud SQL
- Azure Database
- DigitalOcean Managed Databases
- Supabase

### Backend

Deploy the `server/` directory to:
- Railway
- Render
- Fly.io
- Heroku
- AWS EC2 / Lambda

Remember to set environment variables in your deployment platform.

### Frontend

Build the frontend:
```bash
npm run build
```

Deploy the `dist/` folder to:
- Vercel
- Netlify
- GitHub Pages
- AWS S3 + CloudFront

## Troubleshooting

### Connection Refused
- Ensure PostgreSQL is running
- Check `DB_HOST` and `DB_PORT` in `.env`
- Verify firewall rules allow connections

### Authentication Failed
- Check `DB_USER` and `DB_PASSWORD`
- Verify user exists: `psql -U postgres -c "\du"`
- Reset password if needed

### CORS Errors
- Ensure `VITE_API_URL` matches the backend URL exactly
- Check backend is running on the correct port
- Verify `cors` middleware is enabled (default in dev)

### Database Not Found
- Create the database: `createdb gendeck`
- Run schema: `psql -d gendeck -f database/schema.sql`

## Security Notes

- Never commit `.env` files with real credentials
- Use strong passwords for database users
- Enable SSL for production database connections
- Consider adding authentication to the API
- Rate limit API endpoints in production
