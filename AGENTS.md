# GenDeck - AI Slide Generator

## Project Overview

GenDeck is an AI-powered HTML presentation deck generator that converts unstructured text documents into professionally designed, HTML/Tailwind CSS-based slide presentations. It uses large language models (LLMs) to generate structured outlines and individual slide HTML code through a two-phase generation process.

### Key Capabilities

- **Outline Generation**: Converts raw text into structured presentation outlines with titles, content points, and layout suggestions
- **Slide HTML Generation**: Creates individual slide HTML fragments using Tailwind CSS with a strict design system
- **Multi-Provider AI Support**: Works with Google Gemini, OpenAI, DeepSeek, Moonshot (Kimi), and Anthropic Claude
- **Visual Themes**: 40+ predefined color palettes across categories (Business, Government, Tech, Minimalist, Artistic, Tech Giants, Feminine Power)
- **Style Presets**: 10 audience-driven style presets (Corporate Formal, Technical, Startup, Marketing, etc.)
- **Export Options**: HTML deck (with built-in presentation viewer), Markdown outline, speaker notes, and PDF print support
- **Interactive Editor**: Review and edit outlines before generating slides, with layout presets and drag-drop reordering
- **Database Persistence**: Optional PostgreSQL backend for saving decks and slide version history
- **Internationalization**: Support for English and Chinese (UI and content generation)
- **Auto-Save**: Automatic persistence to browser localStorage (7-day retention)

## Technology Stack

| Category | Technology |
|----------|------------|
| Framework | React 19.2.4 |
| Language | TypeScript 5.8.2 |
| Build Tool | Vite 6.2.0 |
| Styling | Tailwind CSS (via CDN) |
| UI Icons | lucide-react |
| AI SDK | @google/genai |
| Backend | Node.js 18+ + Express + PostgreSQL |
| Utilities | uuid |

## Project Structure

```
├── index.html              # Entry HTML, loads Tailwind CDN + importmap
├── index.tsx               # React application entry point
├── App.tsx                 # Main application component (state management, export logic)
├── types.ts                # TypeScript type definitions
├── constants.ts            # AI providers, pricing, themes, translations, presets
├── vite.config.ts          # Vite configuration with env variable injection
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies and scripts
├── metadata.json           # Project metadata
├── .env.local              # Environment variables (GEMINI_API_KEY)
├── .gitignore              # Git ignore patterns
├── Dockerfile              # Frontend container image
├── README.md               # User-facing documentation
├── DATABASE.md             # Database setup guide
├── AGENTS.md               # This file
├── components/
│   ├── InputForm.tsx       # Initial configuration form (topic, audience, model settings)
│   ├── OutlineEditor.tsx   # Outline review/editor with theme selection
│   ├── Sidebar.tsx         # Slide thumbnail navigation
│   ├── SlidePreview.tsx    # Slide preview with zoom, code view, regeneration
│   ├── DeckBrowser.tsx     # Browse saved decks from database
│   ├── SlideHistory.tsx    # View slide version history
│   └── ProviderSelector.tsx # AI provider and model selection
├── services/
│   ├── geminiService.ts    # LLM API abstraction and prompt engineering
│   ├── importService.ts    # HTML import parsing
│   └── databaseService.ts  # Database API client with runtime config
├── styles/
│   ├── theme.ts            # Centralized theme configuration (dark only)
│   └── themeUtils.ts       # Theme utility functions
├── contexts/
│   └── ThemeContext.tsx    # React context for theme management
├── hooks/
│   └── useTheme.ts         # Theme hook
├── server/                 # Backend API
│   ├── Dockerfile          # Backend container image
│   ├── index.js            # Express server entry
│   ├── db.js               # PostgreSQL connection pool
│   ├── package.json        # Backend dependencies
│   ├── routes/
│   │   ├── decks.js        # Deck CRUD and history endpoints
│   │   └── slides.js       # Slide endpoints
│   └── services/
│       ├── deckService.js       # Deck business logic
│       ├── deckHistoryService.js # Version history logic
│       └── slideService.js      # Slide business logic
├── database/
│   └── schema.sql          # PostgreSQL schema (decks, slides, deck_history tables)
├── scripts/
│   └── setup-db.sh         # Automated database setup script
└── gendeck-chart/          # Helm chart for Kubernetes
    ├── Chart.yaml
    ├── values.yaml
    └── templates/          # K8s deployment manifests
```

## Build and Development Commands

```bash
# Install dependencies
npm install

# Start development server (runs on port 3000)
npm run dev

# Build for production (outputs to dist/)
npm run build

# Preview production build
npm run preview

# Start backend server (requires cd server && npm install first)
npm run server
npm run server:dev       # With nodemon auto-reload

# Database setup
npm run setup-db         # Run setup script
./scripts/setup-db.sh -H <host> -P <password>  # With custom params
./scripts/setup-db.sh -U "postgresql://user:pass@host/db"  # With URL
```

### Backend Commands (in server/ directory)

```bash
cd server
npm install
npm start                # Production mode
npm run dev              # Development with nodemon
npm run test-db          # Test database connection
```

## Configuration

### Environment Variables

**Frontend (.env.local - Local Development)**

```bash
# Required for Google Gemini
GEMINI_API_KEY=your_gemini_api_key_here

# Optional - for local backend development
VITE_API_URL=http://localhost:3001/api
```

**Frontend (Docker/Kubernetes Runtime)**

```bash
VITE_API_URL=http://backend:3001/api  # Runtime API URL
```

The frontend uses **runtime configuration** via `config.json` created at container startup by `start.sh`.

**Backend (server/.env)**

```bash
# Option 1: Connection URL (recommended for cloud)
DATABASE_URL=postgresql://user:password@host:port/database

# Option 2: Individual parameters
DB_HOST=localhost
DB_PORT=5432
DB_NAME=gendeck
DB_USER=gendeck_app
DB_PASSWORD=your_secure_password
PORT=3001
```

## Architecture Overview

### State Management Flow

1. **InputForm** → User configures topic, audience, purpose, slide count, and AI model settings
2. **App** → Calls `generateOutline()` to create initial slide structure
3. **OutlineEditor** → User reviews/edits outline and selects color theme
4. **App** → Sequentially calls `generateSlideHtml()` for each slide (queued processing with pause/resume support)
5. **Sidebar + SlidePreview** → User can navigate, preview, and regenerate individual slides
6. **Export** → Generates standalone HTML file with embedded presentation viewer

### Slide Generation Process

The app uses a **two-phase generation approach**:

1. **Phase 1 (Outline)**: Generates structured JSON with titles, content points, and layout hints
2. **Phase 2 (Slides)**: Generates actual HTML fragments for each slide using the outline data

Both phases use the same AI provider/model (configured in settings).

### AI Provider Abstraction

The `callLLM()` function in `geminiService.ts` provides a unified interface for:

- **Google Gemini**: Native SDK with JSON schema support
- **OpenAI/DeepSeek/Moonshot**: OpenAI-compatible REST API
- **Anthropic Claude**: Native REST API with special headers for browser access

### Design System Constraints

Slides are generated with strict constraints (enforced via prompts):

- **Dimensions**: Exactly 1920x1080px
- **Units**: Absolute pixels only (no rem/vh/vw)
- **Overflow**: Hidden (content must fit)
- **Images**: Inline SVGs only (no external bitmaps)
- **Backgrounds**: Solid colors using CSS variables only (no gradients)
- **Print Support**: `print-color-adjust: exact` for PDF export

### CSS Variables (18-Color Standard Deck System)

**Background** (4): `--c-bg`, `--c-bg-soft`, `--c-bg-glass`, `--c-bg-invert`

**Text** (4): `--c-text`, `--c-text-muted`, `--c-text-faint`, `--c-text-invert`

**Structure** (3): `--c-border`, `--c-border-strong`, `--c-divider`

**Accent** (3): `--c-primary`, `--c-secondary`, `--c-accent`

**Semantic** (4): `--c-success`, `--c-warning`, `--c-danger`, `--c-info`

## Data Types

### Core Types (types.ts)

```typescript
// Generation workflow states
enum GenerationStatus {
  IDLE, GENERATING_OUTLINE, REVIEWING_OUTLINE,
  GENERATING_SLIDES, COMPLETE, ERROR
}

// Single slide data structure
interface SlideData {
  id: string;
  title: string;
  contentPoints: string[];
  htmlContent: string | null;
  notes?: string;
  layoutSuggestion?: string;
  isRegenerating: boolean;
  cost?: number;
}

// AI provider configuration
interface ApiSettings {
  apiKeys: Partial<Record<ApiProvider, string>>;
  model: ModelSelection;  // Single model for both outline and slides
}

type ApiProvider = 'google' | 'openai' | 'deepseek' | 'anthropic' | 'moonshot';

type Language = 'en' | 'zh';
```

## Database Service

The `databaseService.ts` module provides:

- **Runtime Config**: Reads `/config.json` at startup to get `VITE_API_URL`
- **API Client**: Methods for decks, slides, and history operations
- **Health Check**: `checkBackendAvailable()` to verify backend connectivity

```typescript
// Check if backend is available
const available = await checkBackendAvailable();

// API operations
const decks = await deckApi.list();
const deck = await deckApi.create({ topic, slides, ... });
const versions = await deckApi.getVersions(deckId);
```

## Code Style Guidelines

### File Organization

- **Components**: One React component per file, default export
- **Types**: Shared types in `types.ts`, component-specific types inline
- **Constants**: All constants (themes, providers, presets) in `constants.ts`
- **Services**: AI logic isolated in `services/` directory

### Naming Conventions

- Components: PascalCase (e.g., `SlidePreview.tsx`)
- Functions: camelCase (e.g., `generateSlideHtml`)
- Types/Interfaces: PascalCase (e.g., `SlideData`)
- Constants: UPPER_SNAKE_CASE for true constants

### React Patterns

- Functional components with hooks
- `useState` for local state, `useEffect` for side effects
- `useCallback` for memoized callbacks passed to children
- Props interfaces defined inline with `interface PropsName`

### Styling Conventions

- Tailwind CSS utility classes
- Dark theme as default (bg-gray-900, text-white)
- Semantic color usage (purple for primary actions, green for success)
- Responsive prefixes (md:, lg:) for adaptive layouts

## Local Storage Persistence

User preferences are automatically saved to localStorage with keys prefixed by `gendeck_`:

- `gendeck_topic`, `gendeck_audience`, `gendeck_purpose`
- `gendeck_count`, `gendeck_content`
- `gendeck_api_keys`
- `gendeck_lang` (language preference)
- `gendeck_autosave` (full state snapshot, 7-day expiry)

## Export Formats

### HTML Deck
Standalone HTML file with:
- Built-in keyboard navigation (arrow keys, space, page up/down, Home, End)
- Theme toggle (dark/light mode)
- Fullscreen support
- Progress bar
- Print-ready CSS for PDF conversion
- Auto-scaling to fit viewport

### Markdown Outline
Structure format:
```markdown
## Slide Title
**Layout:** LayoutType

- Point 1
- Point 2

---
```

### Speaker Notes
Plain text format with slide numbers.

### PDF Export
Injected auto-print script opens browser print dialog with optimized CSS for 1920x1080 page size.

## Layout Presets

The following layout presets are available for slides:

| Preset | Description | Use Case |
|--------|-------------|----------|
| Cover | Central focus, big typography | First slide |
| Ending | Thank you / Call to action | Last slide |
| Standard | Title + bullet points | General content |
| Compare | Split screen (Left/Right) | Pros/cons, before/after |
| Grid | 2x2 or 3x2 cards | Features, pillars |
| Timeline | Horizontal flow | Roadmaps, history |
| Data | Big numbers, metrics | Statistics focus |
| Quote | Centered statement | Key messages |

## Supported AI Models

### Google Gemini
- gemini-3-pro-exp
- gemini-3-flash-preview
- gemini-2.5-pro-preview-03-25
- gemini-2.5-flash-preview-04-17
- gemini-2.5-flash-lite-preview

### OpenAI
- gpt-5.2, gpt-5.1, gpt-5, gpt-5-mini, gpt-5-nano
- gpt-5.2-chat-latest, gpt-5.1-chat-latest
- gpt-5.2-codex, gpt-5.1-codex-max, gpt-5.1-codex
- gpt-5.2-pro, gpt-5-pro

### DeepSeek
- deepseek-chat (V3)
- deepseek-reasoner (R1)

### Moonshot (Kimi)
- kimi-k2-0905-preview
- kimi-k2-turbo-preview

### Anthropic Claude
- claude-opus-4.5-20251101
- claude-sonnet-4.5-20251101
- claude-haiku-4.5-20251101

## Kubernetes Deployment

### Docker Images

Two separate images are built:

1. **Frontend**: `gendeck-frontend:latest`
   - Serves static files with `serve`
   - Runtime config via `VITE_API_URL` env var
   - Port 3000

2. **Backend**: `gendeck-backend:latest`
   - Express API server
   - Connects to PostgreSQL
   - Port 3001

### Helm Chart Structure

```
gendeck-chart/
├── Chart.yaml
├── values.yaml
└── templates/
    ├── _helpers.tpl              # Template helpers
    ├── frontend-deployment.yaml  # Frontend deployment
    ├── backend-deployment.yaml   # Backend deployment
    ├── frontend-service.yaml     # Frontend service
    ├── backend-service.yaml      # Backend service
    ├── frontend-hpa.yaml         # Horizontal Pod Autoscaler
    ├── backend-hpa.yaml
    ├── configmap.yaml            # Backend config
    ├── secret.yaml               # DB password, API keys
    ├── serviceaccount.yaml
    └── tests/
        └── test-connection.yaml
```

### Key Helm Values

```yaml
backend:
  enabled: true        # Set to false to deploy frontend only
  apiUrl: "http://localhost:3001/api"  # Backend URL for frontend

database:
  host: "your-postgres-host"
  port: 5432
  name: gendeck
  user: gendeck_app
  password: "required"
  url: ""  # Or use full URL instead of individual params

service:
  frontend:
    type: ClusterIP  # or NodePort, LoadBalancer
    port: 3000
  backend:
    type: ClusterIP
    port: 3001
```

## Security Considerations

- API keys for non-Google providers are stored in localStorage (user's browser)
- Google API key can be injected via environment variable for shared deployments
- Content is rendered using `dangerouslySetInnerHTML` - the AI-generated HTML is trusted
- Anthropic API requires special `anthropic-dangerous-direct-browser-access` header for browser usage
- Database credentials should never be committed to git
- Use SSL for production database connections

## Development Notes

- No testing framework is currently configured
- No linting/formatting tools are configured (consider adding ESLint/Prettier)
- The project uses ES modules (`"type": "module"` in package.json)
- Importmap in index.html enables CDN-based dependencies during development
- Tailwind CSS is loaded via CDN (not bundled)
- Backend API URL is configured at runtime via `config.json` (not build time)

## API Endpoints

### Decks
- `GET /api/decks` - List all decks
- `POST /api/decks` - Create new deck
- `GET /api/decks/:id` - Get deck with slides
- `PUT /api/decks/:id` - Update deck metadata
- `DELETE /api/decks/:id` - Delete deck
- `GET /api/decks/search?q=query` - Search decks
- `GET /api/decks/:id/html` - Download full HTML

### Deck History
- `GET /api/decks/:id/history` - Get all versions
- `POST /api/decks/:id/history` - Save new version
- `GET /api/decks/history/:id` - Get specific version

### Health
- `GET /api/health` - Health check

## Database Schema

### Tables

**decks**: Stores presentation metadata
- `id` (UUID PK), `topic`, `audience`, `purpose`
- `color_palette`, `slide_count`, `total_cost`
- `full_html`, `document_content`
- `outline_provider`, `outline_model`, `outline_base_url`
- `slides_provider`, `slides_model`, `slides_base_url`
- `created_at`, `updated_at`

**slides**: Current version of each slide
- `id` (UUID PK), `deck_id` (FK)
- `slide_index`, `title`, `content_points` (array)
- `html_content`, `notes`, `layout_suggestion`
- `version`, `is_current`, `created_at`, `updated_at`

**deck_history**: All historical versions of full decks
- `id` (UUID PK), `deck_id` (FK)
- `topic`, `full_html`, `outline` (JSONB)
- `color_palette`, `version`, `saved_at`

### Indexes
- `idx_slides_deck_id` on slides(deck_id)
- `idx_slides_slide_index` on slides(slide_index)
- `idx_slides_current` on slides(deck_id, slide_index, is_current) WHERE is_current = true
- `idx_deck_history_deck_id` on deck_history(deck_id)
- `idx_decks_created_at` on decks(created_at DESC)

### Triggers
- `update_decks_updated_at` - Auto-updates updated_at timestamp
- `update_slides_updated_at` - Auto-updates updated_at timestamp
