# GenDeck - AI Slide Generator

## Project Overview

GenDeck is an AI-powered HTML presentation deck generator that converts unstructured text documents into professionally designed, HTML/Tailwind CSS-based slide presentations. It uses large language models (LLMs) to generate structured outlines and individual slide HTML code through a two-phase generation process.

### Key Capabilities

- **Outline Generation**: Converts raw text into structured presentation outlines with titles, content points, and layout suggestions
- **Slide HTML Generation**: Creates individual slide HTML fragments using Tailwind CSS with a strict design system
- **Multi-Provider AI Support**: Works with Google Gemini, OpenAI, DeepSeek, Moonshot (Kimi), Anthropic Claude, and custom OpenAI-compatible APIs
- **Visual Themes**: 20+ predefined color palettes (Tech Giants, Professional, Minimalist, Creative themes)
- **Export Options**: HTML deck (with built-in presentation viewer), Markdown outline, speaker notes, and PDF print support
- **Interactive Editor**: Review and edit outlines before generating slides, with layout presets and drag-drop reordering
- **Database Persistence**: Optional PostgreSQL backend for saving decks and slide version history
- **Internationalization**: Support for English and Chinese (UI and content generation)

## Technology Stack

| Category | Technology |
|----------|------------|
| Framework | React 19.2.4 |
| Language | TypeScript 5.8.2 |
| Build Tool | Vite 6.2.0 |
| Styling | Tailwind CSS (via CDN) |
| UI Icons | lucide-react |
| AI SDK | @google/genai |
| Backend | Node.js + Express + PostgreSQL |
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
├── README.md               # Basic project documentation
├── components/
│   ├── InputForm.tsx       # Initial configuration form (topic, audience, model settings)
│   ├── OutlineEditor.tsx   # Outline review/editor with theme selection
│   ├── Sidebar.tsx         # Slide thumbnail navigation
│   ├── SlidePreview.tsx    # Slide preview with zoom, code view, regeneration
│   ├── DeckBrowser.tsx     # Browse saved decks from database
│   └── SlideHistory.tsx    # View slide version history
├── services/
│   ├── geminiService.ts    # LLM API abstraction and prompt engineering
│   ├── importService.ts    # HTML import parsing
│   └── databaseService.ts  # Database API client with runtime config
├── server/                 # Backend API
│   ├── Dockerfile          # Backend container image
│   ├── index.js            # Express server entry
│   ├── db.js               # PostgreSQL connection
│   ├── services/           # Business logic
│   └── routes/             # API endpoints
├── database/
│   └── schema.sql          # Database schema
└── gendeck-chart/          # Helm chart for Kubernetes
    ├── Chart.yaml
    ├── values.yaml
    └── templates/
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

# Start backend server
cd server && npm install && npm run dev
```

### Development Server

- **Port**: 3000
- **Host**: 0.0.0.0 (accessible from network)
- **Hot Reload**: Enabled via Vite

## Configuration

### Environment Variables

Create a `.env.local` file in the project root:

```bash
# Required for Google Gemini
GEMINI_API_KEY=your_gemini_api_key_here

# Optional - for local backend development
VITE_API_URL=http://localhost:3001/api
```

The Vite config injects this as `process.env.API_KEY` and `process.env.GEMINI_API_KEY` at build time.

### Runtime Configuration (Docker/Kubernetes)

The frontend uses **runtime configuration** via the `VITE_API_URL` environment variable:

1. At container startup, the `start.sh` script creates `/app/dist/config.json`
2. Frontend reads this file at runtime to get the backend API URL
3. This allows the same Docker image to work with different backend URLs

```bash
# Docker run with runtime API URL
docker run -e VITE_API_URL=http://backend:3001/api -p 3000:3000 gendeck-frontend
```

### TypeScript Path Aliases

The `@/` prefix maps to the project root:

```typescript
import { Something } from '@/types';
// Resolves to ./types.ts
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

The app uses a two-phase generation approach:

1. **Phase 1 (Outline)**: Generates structured JSON with titles, content points, and layout hints
2. **Phase 2 (Slides)**: Generates actual HTML fragments for each slide using the outline data

Each phase can use different AI providers/models (configured separately in settings).

### AI Provider Abstraction

The `callLLM()` function in `geminiService.ts` provides a unified interface for:

- **Google Gemini**: Native SDK with JSON schema support
- **OpenAI/DeepSeek/Moonshot/Custom**: OpenAI-compatible REST API
- **Anthropic Claude**: Native REST API with special headers for browser access

### Design System Constraints

Slides are generated with strict constraints (enforced via prompts):

- **Dimensions**: Exactly 1920x1080px
- **Units**: Absolute pixels only (no rem/vh/vw)
- **Overflow**: Hidden (content must fit)
- **Images**: Inline SVGs only (no external bitmaps)
- **Backgrounds**: Solid colors using CSS variables only (no gradients)
- **Print Support**: `print-color-adjust: exact` for PDF export

CSS Variables used:
- `--c-bg`: Main background
- `--c-surface`: Card/surface background
- `--c-text`: Primary text
- `--c-text-muted`: Secondary text
- `--c-accent`: Brand/highlight color

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
  outline: ModelSelection;
  slides: ModelSelection;
}

type ApiProvider = 'google' | 'openai' | 'deepseek' | 'anthropic' | 'moonshot' | 'custom';

type Language = 'en' | 'zh';
```

## Database Service

The `databaseService.ts` module provides:

- **Runtime Config**: Reads `/config.json` at startup to get `VITE_API_URL`
- **API Client**: Methods for decks, slides, and history operations
- **Health Check**: `checkBackendAvailable()` to verify backend connectivity

```typescript
// API Base URL is determined at runtime
const API_BASE_URL = await loadRuntimeConfig();

// Check if backend is available
const available = await checkBackendAvailable();

// API operations
const decks = await deckApi.list();
const slide = await slideApi.save(deckId, index, slideData);
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
- `gendeck_p_outline`, `gendeck_m_outline` (outline provider/model)
- `gendeck_p_slide`, `gendeck_m_slide` (slide provider/model)

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

## Security Considerations

- API keys for non-Google providers are stored in localStorage (user's browser)
- Google API key can be injected via environment variable for shared deployments
- Content is rendered using `dangerouslySetInnerHTML` - the AI-generated HTML is trusted
- Anthropic API requires special `anthropic-dangerous-direct-browser-access` header for browser usage

## Development Notes

- No testing framework is currently configured
- No linting/formatting tools are configured (consider adding ESLint/Prettier)
- The project uses ES modules (`"type": "module"` in package.json)
- Importmap in index.html enables CDN-based dependencies during development
- Tailwind CSS is loaded via CDN (not bundled)
- Backend API URL is configured at runtime via `config.json` (not build time)

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
- gemini-3-flash-preview
- gemini-3-pro-preview
- gemini-2.5-flash-latest

### OpenAI
- gpt-4o
- gpt-4o-mini

### DeepSeek
- deepseek-chat (V3)
- deepseek-reasoner (R1)

### Moonshot (Kimi)
- kimi-k2-0905-preview
- kimi-k2-turbo-preview

### Anthropic Claude
- claude-3-5-sonnet-20240620
- claude-3-haiku-20240307

### Custom
- Any OpenAI-compatible API (e.g., Ollama local models)

## Kubernetes Deployment

### Docker Images

Two separate images are built:

1. **Frontend**: `gendeck-frontend:latest`
   - Serves static files with `serve`
   - Runtime config via `VITE_API_URL` env var
   - Port 3000

2. **Backend**: `gendeck-frontend:latest`
   - Express API server
   - Connects to PostgreSQL
   - Port 3001

### Helm Chart Structure

```
gendeck-chart/
├── Chart.yaml
├── values.yaml
└── templates/
    ├── _helpers.tpl           # Template helpers
    ├── frontend-deployment.yaml
    ├── backend-deployment.yaml
    ├── frontend-service.yaml
    ├── backend-service.yaml
    ├── frontend-hpa.yaml      # Horizontal Pod Autoscaler
    ├── backend-hpa.yaml
    ├── configmap.yaml         # Backend config
    ├── secret.yaml            # DB password, API keys
    ├── serviceaccount.yaml
    └── tests/
        └── test-connection.yaml
```

### Key Helm Values

```yaml
frontend:
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
