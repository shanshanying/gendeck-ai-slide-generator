# GenDeck (Frontend-Only)

GenDeck is an AI-powered HTML slide deck generator built with React + Vite.
It turns unstructured text into a slide outline, then renders each slide as HTML and exports a standalone HTML deck.

## Tech Stack

- React 19
- TypeScript 5
- Vite 6
- Tailwind CSS (CDN in generated/exported deck)

## Features

- Guided workflow: Input -> Outline -> Render HTML -> Download HTML
- Quick/Advanced input modes
- Theme/palette system with safe defaults, badges, and deck-aware recommendations
- Slide-by-slide regeneration with quick improvement actions
- Export formats: HTML deck, Markdown outline, speaker notes
- Local project save/open (`.gendeck.json`)
- Local autosave recovery
- Pre-export QA checks

## Getting Started

```bash
npm install
npm run dev
```

Default dev server is Vite's default (`http://localhost:5173` unless configured otherwise).

## Build

```bash
npm run build
npm run preview
```

## Project Structure

```text
.
├── App.tsx
├── index.tsx
├── types.ts
├── constants.ts
├── components/
│   ├── InputForm.tsx
│   ├── OutlineEditor.tsx
│   ├── Sidebar.tsx
│   └── SlidePreview.tsx
├── services/
│   ├── geminiService.ts
│   └── importService.ts
└── styles/
```

## Notes

- This is a frontend-only app.
- No backend/database is required.
- API keys are managed client-side via model settings.
- Source document input is plain edit mode (no markdown preview mode).
- HTML import is intentionally removed from the input flow to keep deck creation focused.
