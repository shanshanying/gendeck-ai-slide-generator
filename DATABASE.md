# GenDeck Database Setup Guide

This guide explains how to set up the PostgreSQL database for GenDeck to enable persistent storage and slide history features.

## Overview

With the database backend, you can:
- **Save decks** to the database for long-term storage
- **Browse and reload** previous presentations
- **View slide history** - every change to a slide is versioned automatically
- **Restore** any previous version of a slide

## Prerequisites

- PostgreSQL 12+ (local or cloud-hosted)
- Node.js 18+ installed

## Quick Start

### 1. Get Your PostgreSQL Connection

You can use:
- **Local PostgreSQL** (installed on your machine)
- **Docker PostgreSQL** (container)
- **Cloud PostgreSQL** (Supabase, Railway, Render, Neon, AWS RDS, etc.)

### 2. Create Database

**For local/self-hosted PostgreSQL:**

```bash
# Connect to PostgreSQL (replace with your admin user)
psql -h <host> -U <admin_user> -p <port>

# Create database
CREATE DATABASE gendeck;

# Create dedicated user (recommended)
CREATE USER gendeck_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE gendeck TO gendeck_user;

# Exit
\q
```

**For cloud PostgreSQL:**
- Use the provider's dashboard or CLI to create a database
- Note down the connection details (host, port, database, user, password)

### 3. Run Schema

```bash
# Option 1: Using connection string
psql "postgresql://user:password@host:port/database" -f database/schema.sql

# Option 2: Using individual parameters
psql -h <host> -U <user> -d <database> -p <port> -f database/schema.sql

# Example for local:
psql -h localhost -U gendeck_user -d gendeck -f database/schema.sql

# Example for Supabase:
psql "postgresql://postgres:password@db.xxx.supabase.co:5432/postgres" -f database/schema.sql
```

### 4. Configure Backend Environment

```bash
cd server
cp .env.example .env
# Edit .env with your database credentials
```

**Option A: Individual Parameters (Local/Dev)**
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gendeck
DB_USER=gendeck_user
DB_PASSWORD=your_secure_password
PORT=3001
NODE_ENV=development
```

**Option B: Connection URL (Cloud/Production)**
```env
DATABASE_URL=postgresql://user:password@host:port/database
PORT=3001
NODE_ENV=production
```

### 5. Test Connection

```bash
cd server
npm install
npm run test-db
```

### 6. Start Server

```bash
npm run dev
```

### 7. Configure Frontend

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

## Cloud Provider Examples

### Supabase

1. Create project at [supabase.com](https://supabase.com)
2. Go to Settings → Database
3. Copy the connection string (Session or Transaction pooler)
4. Use in `.env`:

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxx.supabase.co:5432/postgres
```

### Railway

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

Railway automatically provides this variable.

### Render

1. Create PostgreSQL instance
2. Copy "External Database URL"
3. Use in `.env`:

```env
DATABASE_URL=postgresql://user:pass@dpg-xxx.render.com:5432/dbname
```

### Neon

```env
DATABASE_URL=postgresql://user:pass@ep-xxx.us-east-1.aws.neon.tech/dbname?sslmode=require
```

### AWS RDS

```env
DB_HOST=your-db.xxx.us-east-1.rds.amazonaws.com
DB_PORT=5432
DB_NAME=gendeck
DB_USER=admin
DB_PASSWORD=your_password
DB_SSL=true
```

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
| `DATABASE_URL` | Full PostgreSQL connection string | - |
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_NAME` | Database name | gendeck |
| `DB_USER` | Database user | - |
| `DB_PASSWORD` | Database password | - |
| `PORT` | API server port | 3001 |
| `NODE_ENV` | Environment | development |
| `DB_SSL` | Enable SSL (for production) | false |

**Note:** `DATABASE_URL` takes precedence over individual parameters if both are provided.

## Production Deployment

### Database

Use a managed PostgreSQL service:
- AWS RDS
- Google Cloud SQL
- Azure Database
- DigitalOcean Managed Databases
- Supabase
- Railway
- Render
- Neon

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

## Docker PostgreSQL (Local Development)

```bash
# Run PostgreSQL in Docker
docker run -d \
  --name gendeck-db \
  -e POSTGRES_USER=gendeck \
  -e POSTGRES_PASSWORD=gendeck_pass \
  -e POSTGRES_DB=gendeck \
  -p 5432:5432 \
  postgres:15

# Run schema
docker exec -i gendeck-db psql -U gendeck -d gendeck < database/schema.sql

# Configure .env
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=gendeck
# DB_USER=gendeck
# DB_PASSWORD=gendeck_pass
```

## Troubleshooting

### Connection Refused
- Ensure PostgreSQL is running
- Check `DB_HOST` and `DB_PORT` in `.env`
- Verify firewall rules allow connections
- For cloud DBs, ensure your IP is in allowlist

### Authentication Failed
- Check `DB_USER` and `DB_PASSWORD`
- Verify user exists and has correct password
- For cloud DBs, reset password in dashboard if needed

### SSL/TLS Errors
- Set `DB_SSL=true` for cloud databases
- Or add `?sslmode=require` to connection URL
- For self-signed certs, may need to set `rejectUnauthorized: false`

### CORS Errors
- Ensure `VITE_API_URL` matches the backend URL exactly
- Check backend is running on the correct port
- Verify `cors` middleware is enabled (default in dev)

### Database Not Found
- Create the database using provider dashboard or `createdb` command
- Run schema: `psql <connection> -f database/schema.sql`

## Security Notes

- Never commit `.env` files with real credentials
- Use strong passwords for database users
- Enable SSL for production database connections
- Consider adding authentication to the API
- Rate limit API endpoints in production
- Use separate database users for app and schema management
