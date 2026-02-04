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

## Technology Stack

| Category | Technology |
|----------|------------|
| Framework | React 19.2.4 |
| Language | TypeScript 5.8.2 |
| Build Tool | Vite 6.2.0 |
| Styling | Tailwind CSS (via CDN) |
| UI Icons | lucide-react |
| AI SDK | @google/genai |

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or yarn)

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
```

> **Note:** Non-Google providers (OpenAI, DeepSeek, Anthropic, Moonshot) are configured in the app UI and stored in your browser’s localStorage.
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
│   └── SlidePreview.tsx    # Slide preview component
└── services/
    └── geminiService.ts    # LLM API abstraction
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

1. Enter topic, audience, purpose, and slide count
2. Pick models for outline generation and slide generation
3. Review/edit the outline, reorder slides, choose a theme
4. Generate slides (one by one; can pause/resume; can regenerate per-slide)
5. Export as HTML / outline / notes / PDF (print)

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

## Contributing

PRs welcome.
