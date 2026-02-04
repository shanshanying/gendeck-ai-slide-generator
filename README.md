<div align="center">
<img width="1200" height="475" alt="GenDeck Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# GenDeck - AI Slide Generator

GenDeck is an AI-powered HTML presentation deck generator that turns unstructured text into a professionally designed slide deck (HTML + Tailwind CSS).

## Features

GenDeck uses a two-phase workflow (outline → slide HTML) with a strict slide design system.

- **Outline generation**: turns raw text into a structured outline (titles, key points, layout hints)
- **Slide HTML generation**: generates per-slide HTML using Tailwind CSS (CDN) and layout presets
- **Multi-provider AI**: Google Gemini, OpenAI, DeepSeek, Moonshot (Kimi), Anthropic Claude
- **Themes**: 20+ predefined color palettes
- **Exports**: standalone HTML deck (viewer included), Markdown outline, speaker notes, and Print / Save as PDF
- **Editing**: refine outline, reorder slides, pick themes, pause/resume generation, regenerate individual slides
- **Import HTML**: Upload and edit previously generated HTML decks
- **Auto-save**: Automatically persists work to browser storage (survives page refresh)
- **Database persistence** (optional): Save decks to PostgreSQL with full version history

## Technology Stack

| Category | Technology |
|----------|------------|
| Framework | React 19.2.4 |
| Language | TypeScript 5.8.2 |
| Build Tool | Vite 6.2.0 |
| Styling | Tailwind CSS (via CDN) |
| UI Icons | lucide-react |
| AI SDK | @google/genai |
| Backend (optional) | Node.js + Express + PostgreSQL |

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or yarn)
- PostgreSQL 12+ (optional, for database features)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd gendeck-ai-slide-generator
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

```bash
cp .env.local.example .env.local
# Edit .env.local and set GEMINI_API_KEY
```

### Configuration

`.env.local`:

```bash
# Google Gemini API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Backend API URL (optional - enables database features)
VITE_API_URL=http://localhost:3001/api
```

> **Note:** Non-Google providers (OpenAI, DeepSeek, Anthropic, Moonshot) are configured in the app UI and stored in your browser's localStorage.
>
> Google Gemini is wired via build-time env injection (`vite.config.ts` defines `process.env.GEMINI_API_KEY`), so `GEMINI_API_KEY` must be present when you run `npm run dev` or `npm run build`.

### Development

```bash
npm run dev
```

Open `http://localhost:3000`.

### Build / Preview

```bash
npm run build
npm run preview
```

## Database Setup (Optional)

Enable PostgreSQL database to persist decks and track slide history. Works with local PostgreSQL, Docker, or any cloud-hosted PostgreSQL (Supabase, Railway, Render, Neon, AWS RDS, etc.).

### Quick Setup

```bash
# 1. Create database (adjust host/user as needed)
psql -h <host> -U <admin_user> -c "CREATE DATABASE gendeck;"

# 2. Run schema (use your connection details)
cd server
psql -h <host> -U <user> -d gendeck -f ../database/schema.sql
# Or with connection URL:
# psql "postgresql://user:pass@host:port/database" -f ../database/schema.sql

# 3. Configure backend
cp .env.example .env
# Edit .env with your database credentials

# 4. Install and start server
npm install
npm run dev
```

### Configuration Options

**Option 1: Individual Parameters (Local/Dev)**
```env
# server/.env
DB_HOST=localhost          # Or your DB host
DB_PORT=5432              # Or your DB port
DB_NAME=gendeck
DB_USER=your_db_user      # NOT necessarily 'postgres'
DB_PASSWORD=your_password
PORT=3001
NODE_ENV=development
```

**Option 2: Connection URL (Cloud/Production)**
```env
# server/.env
DATABASE_URL=postgresql://user:password@host:port/database
PORT=3001
NODE_ENV=production
```

**Examples:**
```env
# Supabase
DATABASE_URL=postgresql://postgres:xxx@db.xxx.supabase.co:5432/postgres

# Railway (auto-provided)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Render
DATABASE_URL=postgresql://user:pass@dpg-xxx.render.com:5432/dbname

# Docker
DATABASE_URL=postgresql://gendeck:gendeck_pass@localhost:5432/gendeck
```

### Supported Cloud Providers

- **Supabase**: Copy connection string from Settings → Database
- **Railway**: Use provided `DATABASE_URL`
- **Render**: Use External Connection string
- **Neon**: Copy from Connection Details

See [DATABASE.md](DATABASE.md) for complete setup guide.

## Docker

### Build Docker Image

```bash
docker build -t gendeck .
```

### Run with Docker

```bash
docker run -p 8080:80 gendeck
```

Open `http://localhost:8080`.

### Gemini API key and Docker

This image is a static build served by nginx. The Gemini key is embedded at build time by Vite, so setting `-e GEMINI_API_KEY=...` on `docker run` will **not** affect the already-built frontend.

- **Option A (recommended)**: use non-Google providers configured in the UI (stored in localStorage)
- **Option B**: set `GEMINI_API_KEY` in `.env.local` **before** building the image, then rebuild

```bash
cp .env.local.example .env.local
# edit .env.local to set GEMINI_API_KEY
docker build -t gendeck .
```

## Project Structure

```
├── index.html              # Entry HTML, loads Tailwind CDN + importmap
├── index.tsx               # React application entry point
├── App.tsx                 # Main application component
├── types.ts                # TypeScript type definitions
├── constants.ts            # AI providers, pricing, themes, presets
├── vite.config.ts          # Vite configuration
├── components/
│   ├── InputForm.tsx       # Initial configuration form
│   ├── OutlineEditor.tsx   # Outline review/editor
│   ├── Sidebar.tsx         # Slide thumbnail navigation
│   ├── SlidePreview.tsx    # Slide preview component
│   ├── DeckBrowser.tsx     # Browse saved decks (database)
│   └── SlideHistory.tsx    # View slide version history
├── services/
│   ├── geminiService.ts    # LLM API abstraction
│   ├── importService.ts    # HTML import parsing
│   └── databaseService.ts  # Database API client
├── server/                 # Backend API (optional)
│   ├── index.js            # Express server entry
│   ├── db.js               # PostgreSQL connection
│   ├── services/           # Business logic
│   └── routes/             # API endpoints
└── database/
    └── schema.sql          # Database schema
```

## AI Provider Configuration

| Provider | Configuration |
|----------|---------------|
| **Google Gemini** | Set `GEMINI_API_KEY` in `.env.local` |
| **OpenAI** | Configure API key in UI settings |
| **DeepSeek** | Configure API key in UI settings |
| **Anthropic Claude** | Configure API key in UI settings |
| **Moonshot (Kimi)** | Configure API key in UI settings |

### API Key Setup

1. **Google Gemini**: [Google AI Studio](https://aistudio.google.com/)
2. **OpenAI**: [OpenAI Platform](https://platform.openai.com/)
3. **Anthropic**: [Anthropic Console](https://console.anthropic.com/)
4. **DeepSeek**: [DeepSeek Platform](https://platform.deepseek.com/)
5. **Moonshot**: [Moonshot Console](https://platform.moonshot.cn/)

## Usage

### Creating a New Deck

1. Enter topic, audience, purpose, and slide count
2. Pick models for outline generation and slide generation
3. Review/edit the outline, reorder slides, choose a theme
4. Generate slides (one by one; can pause/resume; can regenerate per-slide)
5. Export as HTML / outline / notes / PDF (print)

### Importing HTML

Upload previously generated HTML decks to edit or regenerate:

1. Click **Import HTML** button in the source document area
2. Select a previously exported GenDeck HTML file
3. The deck loads with all slides ready for editing

### Auto-Save

Work is automatically saved to browser storage and survives:
- Page refresh
- Browser restart
- Computer restart

Data persists for 7 days or until you create a new deck.

### Database Features (if configured)

#### Save to Database
- Click **Save** button to persist deck to PostgreSQL
- Each slide is versioned automatically on every change

#### Browse Saved Decks
- Click **Browse** to view all saved presentations
- Search by topic
- Load or delete decks

#### Slide History
- Click **History** on any slide to view all previous versions
- Preview any version
- Restore to any previous version

## Export Formats

### HTML Deck

Standalone HTML file with:

- built-in keyboard navigation (arrow keys, space, PageUp/PageDown, Home/End)
- fullscreen support
- progress indicator
- print-ready CSS for PDF conversion

### Markdown Outline

Structured markdown format for documentation.

### Speaker Notes

Plain text format with slide numbers.

## Scripts Reference

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run server` | Start backend server |
| `npm run server:dev` | Start backend with nodemon |
| `npm run setup-db` | Run database schema |

## Environment Variables

### Frontend (.env.local)

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes* | Google Gemini API key |
| `VITE_API_URL` | No | Backend API URL (enables database features) |

\* Required only if using Google Gemini. Other providers configured in UI.

### Backend (server/.env)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Full PostgreSQL connection string |
| `DB_HOST` | Database host (if not using URL) |
| `DB_PORT` | Database port (default: 5432) |
| `DB_NAME` | Database name |
| `DB_USER` | Database user |
| `DB_PASSWORD` | Database password |
| `PORT` | API server port (default: 3001) |

## Contributing

PRs welcome.
