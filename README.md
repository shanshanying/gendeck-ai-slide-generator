<div align="center">
<img width="1200" height="475" alt="GenDeck Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# GenDeck - AI Slide Generator

GenDeck is an AI-powered HTML presentation deck generator that converts unstructured text documents into professionally designed, HTML/Tailwind CSS-based slide presentations.

## ✨ Features

- **📝 Outline Generation** - Converts raw text into structured presentation outlines with titles, content points, and layout suggestions
- **🎨 Slide HTML Generation** - Creates individual slide HTML fragments using Tailwind CSS with a strict design system
- **🤖 Multi-Provider AI Support** - Works with Google Gemini, OpenAI, DeepSeek, Moonshot (Kimi), Anthropic Claude, and custom OpenAI-compatible APIs
- **🎭 Visual Themes** - 17+ predefined color palettes (Tech Giants, Professional, Minimalist, Creative themes)
- **📤 Export Options** - HTML deck (with built-in presentation viewer), Markdown outline, speaker notes
- **🔧 Interactive Editor** - Review and edit outlines before generating slides, with layout presets and drag-drop reordering

## 🛠️ Technology Stack

| Category | Technology |
|----------|------------|
| Framework | React 19.2.4 |
| Language | TypeScript 5.8.2 |
| Build Tool | Vite 6.2.0 |
| Styling | Tailwind CSS (via CDN) |
| UI Icons | lucide-react |
| AI SDK | @google/genai |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

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
   # Edit .env.local and add your API keys
   ```

### Configuration

Create a `.env.local` file in the project root:

```bash
# Google Gemini API Key (required for default setup)
GEMINI_API_KEY=your_gemini_api_key_here
```

> **Note:** You can also configure other AI providers (OpenAI, DeepSeek, Anthropic, Moonshot) directly in the app's settings UI. These keys are stored in your browser's localStorage.

### Development

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

Preview the production build:

```bash
npm run preview
```

## 🐳 Docker

### Build Docker Image

```bash
docker build -t gendeck .
```

### Run with Docker

```bash
docker run -p 8080:80 gendeck
```

The app will be available at `http://localhost:8080`

### Docker with Environment Variables

```bash
docker run -p 8080:80 -e GEMINI_API_KEY=your_api_key_here gendeck
```

## 📁 Project Structure

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

## 🔑 AI Provider Configuration

GenDeck supports multiple AI providers:

| Provider | Configuration |
|----------|---------------|
| **Google Gemini** | Set `GEMINI_API_KEY` in `.env.local` or via UI |
| **OpenAI** | Configure API key in UI settings |
| **DeepSeek** | Configure API key in UI settings |
| **Anthropic Claude** | Configure API key in UI settings |
| **Moonshot (Kimi)** | Configure API key in UI settings |
| **Custom** | Configure custom endpoint and API key in UI |

### API Key Setup

1. **Google Gemini**: Get your API key from [Google AI Studio](https://aistudio.google.com/)
2. **OpenAI**: Get your API key from [OpenAI Platform](https://platform.openai.com/)
3. **Anthropic**: Get your API key from [Anthropic Console](https://console.anthropic.com/)
4. **DeepSeek**: Get your API key from [DeepSeek Platform](https://platform.deepseek.com/)
5. **Moonshot**: Get your API key from [Moonshot Console](https://platform.moonshot.cn/)

## 📖 Usage

1. **Input Configuration**: Enter your topic, audience, purpose, and desired slide count
2. **Select AI Model**: Choose different models for outline generation and slide generation
3. **Review Outline**: Edit the AI-generated outline, reorder slides, and select a color theme
4. **Generate Slides**: The app will generate HTML slides one by one
5. **Export**: Download your presentation as a standalone HTML file with built-in navigation

## 🎨 Themes

GenDeck includes 17+ predefined color themes:

- **Tech Giants**: Google, Microsoft, Amazon, Meta, Apple
- **Professional**: McKinsey, Goldman Sachs, IBM
- **Minimalist**: White, Dark, Warm Minimal
- **Creative**: Figma, Notion, Spotify, Netflix

## 📄 Export Formats

### HTML Deck
Standalone HTML file with:
- Built-in keyboard navigation (arrow keys, space, page up/down)
- Theme toggle (dark/light mode)
- Fullscreen support
- Progress bar
- Print-ready CSS for PDF conversion

### Markdown Outline
Structured markdown format for documentation.

### Speaker Notes
Plain text format with slide numbers.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[MIT License](LICENSE)

## 🔗 Links

- View in AI Studio: https://ai.studio/apps/drive/1kpDTjUW3VclmTn7FnfcSZBEtNHQYwxgt
