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
| Deployment | Docker, Kubernetes, Helm |

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or yarn)
- PostgreSQL 12+ (optional, for backend database features)

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

# Backend API URL (optional - enables database features when developing locally)
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

### Quick Setup (Automated)

Use the provided setup script to quickly create database, user, and schema:

```bash
# Option 1: Setup with local PostgreSQL
./scripts/setup-db.sh

# Option 2: Setup with specific host and password
./scripts/setup-db.sh -H mydb.example.com -P mypassword123

# Option 3: Setup using connection URL
./scripts/setup-db.sh -U "postgresql://user:pass@host:5432/dbname"
```

The script will output connection details and environment variables for your `.env` file.

### Manual Setup

If you prefer manual setup:

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
```

**Option 2: Connection URL (Cloud/Production)**
```env
# server/.env
DATABASE_URL=postgresql://user:password@host:port/database
PORT=3001
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

### Build Docker Images

```bash
# Build frontend image
docker build -t gendeck-frontend:latest .

# Build backend image
docker build -t gendeck-backend:latest ./server
```

### Run with Docker

The frontend image uses runtime configuration via the `VITE_API_URL` environment variable. This is set at runtime, not build time.

```bash
# Run backend
docker run -p 3001:3001 \
  -e DB_HOST=your-db-host \
  -e DB_PASSWORD=your-password \
  gendeck-backend:latest

# Run frontend (with backend URL)
docker run -p 3000:3000 \
  -e VITE_API_URL=http://localhost:3001/api \
  gendeck-frontend:latest
```

Open `http://localhost:3000`.

### Gemini API key and Docker

- **Option A (recommended)**: use non-Google providers configured in the UI (stored in localStorage)
- **Option B**: set `GEMINI_API_KEY` in `.env.local` **before** building the image, then rebuild

```bash
cp .env.local.example .env.local
# edit .env.local to set GEMINI_API_KEY
docker build -t gendeck-frontend:latest .
```

## Kubernetes Deployment (Helm)

A production-ready Helm chart is provided for deploying GenDeck on Kubernetes.

### Minimal Deployment (Frontend Only)

Deploy just the frontend without backend or PostgreSQL. All data persists in browser storage.

```bash
# Build and load frontend image only
docker build -t gendeck-frontend:latest .
minikube image load gendeck-frontend:latest

# Deploy frontend only (no backend, no database)
helm upgrade --install gendeck ./gendeck-chart \
  --set backend.enabled=false \
  --set service.frontend.type=NodePort

# Access the application
minikube service gendeck-frontend --url
```

**Note:** When backend is disabled, database features (save to database, browse decks, slide history) are not available. All work is auto-saved to browser storage.

### Full Deployment (with Backend)

### Prerequisites

- Kubernetes 1.24+
- Helm 3.12+
- PostgreSQL (for backend database features)

### Build and Load Images

```bash
# Build images
docker build -t gendeck-frontend:latest .
docker build -t gendeck-backend:latest ./server

# For minikube - load images
minikube image load gendeck-frontend:latest
minikube image load gendeck-backend:latest
```

### Configuration

**Key Configuration Values:**

| Parameter | Description | Default |
|-----------|-------------|---------|
| `backend.enabled` | Deploy backend and database | `true` |
| `backend.apiUrl` | Backend API URL for frontend | `http://localhost:3001/api` |
| `database.host` | PostgreSQL host | `""` |
| `database.password` | PostgreSQL password | `""` |
| `database.url` | Full PostgreSQL connection URL | "" |
| `apiKeys.gemini` | Google Gemini API key | "" |

### Deployment Examples

**Local Testing (with port-forward):**

```bash
# Setup PostgreSQL first
./scripts/setup-db.sh --docker

# Deploy with in-cluster backend URL
helm upgrade --install gendeck ./gendeck-chart \
  --set backend.apiUrl=http://localhost:3001/api \
  --set database.password=your-password \
  --set database.host=host.docker.internal

# Port forward both services
kubectl port-forward svc/gendeck-frontend 3000:3000 &
kubectl port-forward svc/gendeck-backend 3001:3001 &

# Access http://localhost:3000
```

**Production (with external domain):**

```bash
helm upgrade --install gendeck ./gendeck-chart \
  --set backend.apiUrl=https://api.example.com/api \
  --set database.url="postgresql://user:pass@host:5432/gendeck" \
  --set apiKeys.gemini=your-gemini-key
```

**With NodePort (no ingress needed):**

```bash
helm upgrade --install gendeck ./gendeck-chart \
  --set backend.apiUrl=http://$(minikube ip):30001/api \
  --set database.password=your-password \
  --set service.frontend.type=NodePort \
  --set service.backend.type=NodePort
```

### Accessing the Application

```bash
# Port-forward (local testing)
kubectl port-forward svc/gendeck-frontend 3000:3000

# Or get NodePort URL
minikube service gendeck-frontend --url

# Or for LoadBalancer
kubectl get svc gendeck-frontend
```

### Helm Chart Features

| Feature | Description |
|---------|-------------|
| **Separate Deployments** | Frontend and backend are separate for independent scaling |
| **Runtime API URL** | Frontend backend URL is configured at runtime via env var |
| **Horizontal Autoscaling** | HPA for frontend and backend |
| **Private Registry** | Support for private Docker registries |
| **API Keys as Secrets** | Secure storage of AI provider API keys |

See `gendeck-chart/values.yaml` for all configuration options.

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
│   └── databaseService.ts  # Database API client (runtime config)
├── server/                 # Backend API (optional)
│   ├── index.js            # Express server entry
│   ├── db.js               # PostgreSQL connection
│   ├── services/           # Business logic
│   └── routes/             # API endpoints
├── database/
│   └── schema.sql          # Database schema
├── gendeck-chart/          # Helm chart for Kubernetes
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
└── scripts/
    └── setup-db.sh         # Database setup script
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

### Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run server` | Start backend server |
| `npm run server:dev` | Start backend with nodemon |
| `npm run setup-db` | Run database schema |

### Database Setup

| Command | Description |
|---------|-------------|
| `npm run setup-db` | Setup local PostgreSQL |
| `npm run setup-db:docker` | Setup with Docker PostgreSQL |
| `./scripts/setup-db.sh -U "postgresql://..."` | Setup with connection URL |
| `./scripts/setup-db.sh --force` | Force recreate database |

### Helm / Kubernetes

| Command | Description |
|---------|-------------|
| `helm install gendeck ./gendeck-chart` | Install GenDeck to Kubernetes |
| `helm upgrade gendeck ./gendeck-chart` | Upgrade deployment |
| `helm uninstall gendeck` | Remove deployment |
| `helm lint ./gendeck-chart` | Validate chart |
| `helm template ./gendeck-chart` | Render templates |

## Environment Variables

### Frontend (.env.local - Development Only)

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | Yes* | Google Gemini API key |
| `VITE_API_URL` | No | Backend API URL (local dev only) |

\* Required only if using Google Gemini. Other providers configured in UI.

### Frontend (Docker/Kubernetes Runtime)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API URL (e.g., `http://localhost:3001/api`) |

### Backend (server/.env or env vars)

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
