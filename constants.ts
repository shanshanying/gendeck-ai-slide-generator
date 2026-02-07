
import { ApiProvider } from "./types";

export interface ModelPricing {
  id: string;
  name: string;
  inputPrice: number; // Per 1M tokens
  outputPrice: number; // Per 1M tokens
}

export const PROVIDERS: {
  id: ApiProvider;
  name: string;
  defaultBaseUrl?: string;
  placeholderKey?: string;
  models: ModelPricing[];
}[] = [
  {
    id: 'google',
    name: 'Google Gemini',
    placeholderKey: 'Enter your Gemini API Key',
    models: [
      // Gemini 3 Series (Latest)
      { id: 'gemini-3-pro-exp', name: 'Gemini 3 Pro (Exp)', inputPrice: 1.25, outputPrice: 5.0 },
      { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash (Preview)', inputPrice: 0.075, outputPrice: 0.30 },
      // Gemini 2.5 Series
      { id: 'gemini-2.5-pro-preview-03-25', name: 'Gemini 2.5 Pro (Preview)', inputPrice: 1.25, outputPrice: 10.0 },
      { id: 'gemini-2.5-flash-preview-04-17', name: 'Gemini 2.5 Flash (Preview)', inputPrice: 0.075, outputPrice: 0.30 },
      { id: 'gemini-2.5-flash-lite-preview', name: 'Gemini 2.5 Flash-Lite (Preview)', inputPrice: 0.0375, outputPrice: 0.15 },
    ]
  },
  {
    id: 'openai',
    name: 'OpenAI (ChatGPT)',
    defaultBaseUrl: 'https://api.openai.com/v1',
    placeholderKey: 'sk-...',
    models: [
      // GPT-5.x Chat Series (Latest)
      { id: 'gpt-5.2', name: 'GPT-5.2', inputPrice: 1.75, outputPrice: 14.0 },
      { id: 'gpt-5.1', name: 'GPT-5.1', inputPrice: 1.25, outputPrice: 10.0 },
      { id: 'gpt-5', name: 'GPT-5', inputPrice: 1.25, outputPrice: 10.0 },
      { id: 'gpt-5-mini', name: 'GPT-5 Mini', inputPrice: 0.25, outputPrice: 2.0 },
      { id: 'gpt-5-nano', name: 'GPT-5 Nano', inputPrice: 0.05, outputPrice: 0.40 },
      { id: 'gpt-5.2-chat-latest', name: 'GPT-5.2 Chat (Latest)', inputPrice: 1.75, outputPrice: 14.0 },
      { id: 'gpt-5.1-chat-latest', name: 'GPT-5.1 Chat (Latest)', inputPrice: 1.25, outputPrice: 10.0 },
      { id: 'gpt-5-chat-latest', name: 'GPT-5 Chat (Latest)', inputPrice: 1.25, outputPrice: 10.0 },

      // GPT-5 Codex Series
      { id: 'gpt-5.2-codex', name: 'GPT-5.2 Codex', inputPrice: 1.75, outputPrice: 14.0 },
      { id: 'gpt-5.1-codex-max', name: 'GPT-5.1 Codex Max', inputPrice: 1.25, outputPrice: 10.0 },
      { id: 'gpt-5.1-codex', name: 'GPT-5.1 Codex', inputPrice: 1.25, outputPrice: 10.0 },
      { id: 'gpt-5-codex', name: 'GPT-5 Codex', inputPrice: 1.25, outputPrice: 10.0 },

      // GPT-5 Pro Series
      { id: 'gpt-5.2-pro', name: 'GPT-5.2 Pro', inputPrice: 21.0, outputPrice: 168.0 },
      { id: 'gpt-5-pro', name: 'GPT-5 Pro', inputPrice: 15.0, outputPrice: 120.0 },
    ]
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    defaultBaseUrl: 'https://api.deepseek.com',
    placeholderKey: 'dsk-...',
    models: [
      { id: 'deepseek-chat', name: 'deepseek-chat', inputPrice: 0.14, outputPrice: 0.28 },
      { id: 'deepseek-reasoner', name: 'deepseek-reasoner', inputPrice: 0.55, outputPrice: 2.19 },
    ]
  },
  {
    id: 'moonshot',
    name: 'Moonshot (Kimi)',
    defaultBaseUrl: 'https://api.moonshot.ai/v1',
    placeholderKey: 'sk-...',
    models: [
      { id: 'kimi-k2-0905-preview', name: 'Kimi K2 (Latest)', inputPrice: 0.15, outputPrice: 0.60 },
      { id: 'kimi-k2-turbo-preview', name: 'Kimi K2 Turbo (Recommended)', inputPrice: 0.15, outputPrice: 1.15 },
    ]
  },
  {
    id: 'anthropic',
    name: 'Anthropic (Claude)',
    defaultBaseUrl: 'https://api.anthropic.com/v1',
    placeholderKey: 'sk-ant-...',
    models: [
      // Claude 4.5 Series (Latest)
      { id: 'claude-opus-4.5-20251101', name: 'Claude Opus 4.5', inputPrice: 5.0, outputPrice: 25.0 },
      { id: 'claude-sonnet-4.5-20251101', name: 'Claude Sonnet 4.5', inputPrice: 3.0, outputPrice: 15.0 },
      { id: 'claude-haiku-4.5-20251101', name: 'Claude Haiku 4.5', inputPrice: 1.0, outputPrice: 5.0 },
    ]
  },
];

// Format: [bg, surface, text, textMuted, accent, accent2, success, warning, error]
// 9-Color System optimized for presentation decks (dark mode optimized)
export const COLOR_THEMES = [
  // === CORPORATE CLASSICS ===
  { 
    id: 'executive', 
    label: 'Executive', 
    colors: ['#0a0a0a', '#141414', '#ffffff', '#888888', '#ffffff', '#a3a3a3', '#525252', '#a16207', '#7f1d1d'] 
  },
  { 
    id: 'midnight', 
    label: 'Midnight', 
    colors: ['#020617', '#0f172a', '#f8fafc', '#64748b', '#60a5fa', '#93c5fd', '#0369a1', '#854d0e', '#991b1b'] 
  },
  { 
    id: 'corporate-navy', 
    label: 'Corporate Navy', 
    colors: ['#0f172a', '#1e3a5f', '#f8fafc', '#94a3b8', '#3b82f6', '#60a5fa', '#166534', '#92400e', '#9f1239'] 
  },
  { 
    id: 'platinum', 
    label: 'Platinum', 
    colors: ['#fafafa', '#f3f4f6', '#111827', '#6b7280', '#374151', '#9ca3af', '#14532d', '#78350f', '#7f1d1d'] 
  },
  { 
    id: 'deep-slate', 
    label: 'Deep Slate', 
    colors: ['#0f172a', '#1e293b', '#f1f5f9', '#475569', '#64748b', '#94a3b8', '#065f46', '#78350f', '#7f1d1d'] 
  },
  { 
    id: 'business-green', 
    label: 'Business Green', 
    colors: ['#022c22', '#064e3b', '#ecfdf5', '#6ee7b7', '#10b981', '#34d399', '#047857', '#a16207', '#991b1b'] 
  },

  // === MINIMALIST TECH ===
  { 
    id: 'minimal-dark', 
    label: 'Minimal Dark', 
    colors: ['#0a0a0a', '#141414', '#fafafa', '#737373', '#3b82f6', '#60a5fa', '#1e3a5f', '#854d0e', '#7f1d1d'] 
  },
  { 
    id: 'space-gray', 
    label: 'Space Gray', 
    colors: ['#1c1c1e', '#2c2c2e', '#f5f5f7', '#8e8e93', '#0a84ff', '#5ac8fa', '#065f46', '#92400e', '#9f1239'] 
  },
  { 
    id: 'titanium', 
    label: 'Titanium', 
    colors: ['#f5f5f7', '#e8e8ed', '#1d1d1f', '#6e6e73', '#0071e3', '#5e5ce6', '#14532d', '#92400e', '#9f1239'] 
  },
  { 
    id: 'neon-edge', 
    label: 'Neon Edge', 
    colors: ['#09090b', '#18181b', '#fafafa', '#a1a1aa', '#06b6d4', '#22d3ee', '#0e7490', '#a16207', '#991b1b'] 
  },
  { 
    id: 'arctic', 
    label: 'Arctic', 
    colors: ['#f8fafc', '#f1f5f9', '#0f172a', '#475569', '#0ea5e9', '#38bdf8', '#0369a1', '#92400e', '#9f1239'] 
  },
  { 
    id: 'graphite', 
    label: 'Graphite', 
    colors: ['#18181b', '#27272a', '#fafafa', '#a1a1aa', '#a1a1aa', '#d4d4d8', '#3f6212', '#92400e', '#7f1d1d'] 
  },
  { 
    id: 'silicon', 
    label: 'Silicon', 
    colors: ['#fafaf9', '#f5f5f4', '#292524', '#78716c', '#78716c', '#a8a29e', '#3f6212', '#92400e', '#991b1b'] 
  },
  { 
    id: 'quantum', 
    label: 'Quantum', 
    colors: ['#0f0518', '#1a0b2e', '#faf5ff', '#a855f7', '#a855f7', '#c084fc', '#6b21a8', '#be1850', '#9f1239'] 
  },
  { 
    id: 'zenith', 
    label: 'Zenith', 
    colors: ['#ffffff', '#f0fdfa', '#134e4a', '#0d9488', '#14b8a6', '#2dd4bf', '#0f766e', '#a16207', '#9f1239'] 
  },
  { 
    id: 'prism', 
    label: 'Prism', 
    colors: ['#0f0f0f', '#1a1a1a', '#ffffff', '#a3a3a3', '#ec4899', '#8b5cf6', '#581c87', '#be1850', '#9f1239'] 
  },
  { 
    id: 'mono-blue', 
    label: 'Mono Blue', 
    colors: ['#0a0f1c', '#111827', '#f8fafc', '#6b7280', '#3b82f6', '#60a5fa', '#1e40af', '#92400e', '#9f1239'] 
  },
  { 
    id: 'mono-amber', 
    label: 'Mono Amber', 
    colors: ['#1c1917', '#292524', '#fafaf9', '#a8a29e', '#f59e0b', '#fbbf24', '#3f6212', '#92400e', '#991b1b'] 
  },

  // === MINIMALIST CLEAN ===
  { 
    id: 'ink', 
    label: 'True Ink', 
    colors: ['#0a0a0a', '#171717', '#fafafa', '#737373', '#ffffff', '#a3a3a3', '#3f6212', '#92400e', '#7f1d1d'] 
  },
  { 
    id: 'obsidian', 
    label: 'Obsidian', 
    colors: ['#000000', '#1c1c1e', '#ffffff', '#8e8e93', '#007aff', '#5ac8fa', '#065f46', '#92400e', '#9f1239'] 
  },
  { 
    id: 'carbon', 
    label: 'Carbon Fiber', 
    colors: ['#0c0c0c', '#1f1f1f', '#fafafa', '#6b7280', '#3b82f6', '#60a5fa', '#1e3a5f', '#92400e', '#7f1d1d'] 
  },

  // === TECH GIANTS ===
  { 
    id: 'google', 
    label: 'Google', 
    colors: ['#0d1117', '#161b22', '#ffffff', '#8b949e', '#4285f4', '#34a853', '#166534', '#92400e', '#b91c1c'] 
  },
  { 
    id: 'amazon', 
    label: 'Amazon', 
    colors: ['#0f1419', '#1a2332', '#ffffff', '#94a3b8', '#ff9900', '#00a8e1', '#065f46', '#92400e', '#7f1d1d'] 
  },
  { 
    id: 'alibaba', 
    label: 'Alibaba', 
    colors: ['#1a1a1a', '#2d2d2d', '#ffffff', '#a3a3a3', '#ff6a00', '#ff8f00', '#166534', '#92400e', '#7f1d1d'] 
  },
  { 
    id: 'huawei', 
    label: 'Huawei', 
    colors: ['#0a0a0a', '#1f1f1f', '#ffffff', '#a1a1aa', '#cf0a2c', '#ff4d6d', '#065f46', '#92400e', '#991b1b'] 
  },
  { 
    id: 'meta', 
    label: 'Meta', 
    colors: ['#0f1115', '#1c1e21', '#ffffff', '#8b949e', '#0668e1', '#0081fb', '#14532d', '#92400e', '#9f1239'] 
  },
  { 
    id: 'netflix', 
    label: 'Netflix', 
    colors: ['#000000', '#141414', '#ffffff', '#b3b3b3', '#e50914', '#ff4d4d', '#14532d', '#92400e', '#b91c1c'] 
  },
  { 
    id: 'tesla', 
    label: 'Tesla', 
    colors: ['#0a0a0a', '#171717', '#ffffff', '#888888', '#cc0000', '#e82127', '#14532d', '#92400e', '#7f1d1d'] 
  },
  { 
    id: 'apple', 
    label: 'Apple', 
    colors: ['#000000', '#1d1d1f', '#f5f5f7', '#86868b', '#0071e3', '#2997ff', '#14532d', '#92400e', '#9f1239'] 
  },
  { 
    id: 'microsoft', 
    label: 'Microsoft', 
    colors: ['#0d1117', '#161b22', '#ffffff', '#8b949e', '#0078d4', '#106ebe', '#14532d', '#92400e', '#991b1b'] 
  },
  { 
    id: 'tencent', 
    label: 'Tencent', 
    colors: ['#082f49', '#0c4a6e', '#f0f9ff', '#7dd3fc', '#38bdf8', '#7dd3fc', '#065f46', '#92400e', '#991b1b'] 
  },
  { 
    id: 'bytedance', 
    label: 'ByteDance', 
    colors: ['#0a0a0a', '#1a1a1a', '#ffffff', '#a1a1aa', '#00f2ea', '#ff0050', '#14532d', '#92400e', '#991b1b'] 
  },

  // === TECH GIANTS LIGHT ===
  { 
    id: 'google-light', 
    label: 'Google Light', 
    colors: ['#ffffff', '#f8f9fa', '#202124', '#5f6368', '#1557b0', '#0d5c26', '#14532d', '#92400e', '#991b1b'] 
  },
  { 
    id: 'amazon-light', 
    label: 'Amazon Light', 
    colors: ['#ffffff', '#f3f3f3', '#0f1111', '#565959', '#92400e', '#1557b0', '#14532d', '#92400e', '#7f1d1d'] 
  },
  { 
    id: 'alibaba-light', 
    label: 'Alibaba Light', 
    colors: ['#ffffff', '#f5f5f5', '#333333', '#666666', '#9a3412', '#92400e', '#14532d', '#92400e', '#7f1d1d'] 
  },
  { 
    id: 'huawei-light', 
    label: 'Huawei Light', 
    colors: ['#ffffff', '#f2f2f2', '#000000', '#666666', '#b91c1c', '#dc2626', '#14532d', '#92400e', '#7f1d1d'] 
  },
  { 
    id: 'meta-light', 
    label: 'Meta Light', 
    colors: ['#ffffff', '#f5f6f7', '#1c1e21', '#606770', '#1557b0', '#0066a1', '#14532d', '#92400e', '#9f1239'] 
  },
  { 
    id: 'netflix-light', 
    label: 'Netflix Light', 
    colors: ['#ffffff', '#f5f5f5', '#000000', '#757575', '#b91c1c', '#dc2626', '#14532d', '#92400e', '#9f1239'] 
  },
  { 
    id: 'tesla-light', 
    label: 'Tesla Light', 
    colors: ['#ffffff', '#f4f4f4', '#171a20', '#5c5e62', '#7f1d1d', '#b91c1c', '#14532d', '#92400e', '#7f1d1d'] 
  },
  { 
    id: 'apple-light', 
    label: 'Apple Light', 
    colors: ['#ffffff', '#f5f5f7', '#1d1d1f', '#6e6e73', '#0066a1', '#1557b0', '#14532d', '#92400e', '#9f1239'] 
  },
  { 
    id: 'microsoft-light', 
    label: 'Microsoft Light', 
    colors: ['#ffffff', '#f8f9fa', '#323130', '#605e5c', '#1557b0', '#1557b0', '#14532d', '#92400e', '#991b1b'] 
  },
  { 
    id: 'tencent-light', 
    label: 'Tencent Light', 
    colors: ['#ffffff', '#f0f9ff', '#0c4a6e', '#075985', '#1557b0', '#0e7490', '#065f46', '#92400e', '#991b1b'] 
  },
  { 
    id: 'bytedance-light', 
    label: 'ByteDance Light', 
    colors: ['#ffffff', '#f9fafb', '#111827', '#374151', '#0f766e', '#991b1b', '#14532d', '#92400e', '#991b1b'] 
  },

  // === LIGHT THEMES ===
  { 
    id: 'pure-white', 
    label: 'Pure White', 
    colors: ['#ffffff', '#f1f5f9', '#0f172a', '#475569', '#1e40af', '#581c87', '#14532d', '#92400e', '#991b1b'] 
  },
  { 
    id: 'soft-gray', 
    label: 'Soft Gray', 
    colors: ['#f8fafc', '#e2e8f0', '#1e293b', '#475569', '#1e40af', '#581c87', '#14532d', '#92400e', '#991b1b'] 
  },
  { 
    id: 'warm-paper', 
    label: 'Warm Paper', 
    colors: ['#fafaf9', '#e7e5e4', '#292524', '#57534e', '#9a3412', '#78350f', '#3f6212', '#92400e', '#7f1d1d'] 
  },
  { 
    id: 'cream', 
    label: 'Cream', 
    colors: ['#fefce8', '#fef9c3', '#422006', '#713f12', '#854d0e', '#a16207', '#3f6212', '#92400e', '#7f1d1d'] 
  },
  { 
    id: 'mint-light', 
    label: 'Mint Light', 
    colors: ['#f0fdf4', '#dcfce7', '#14532d', '#166534', '#15803d', '#166534', '#064e3b', '#92400e', '#991b1b'] 
  },
  { 
    id: 'sky-light', 
    label: 'Sky Light', 
    colors: ['#f0f9ff', '#e0f2fe', '#0c4a6e', '#075985', '#075985', '#0369a1', '#065f46', '#92400e', '#991b1b'] 
  },
  { 
    id: 'rose-light', 
    label: 'Rose Light', 
    colors: ['#fff1f2', '#ffe4e6', '#881337', '#9f1239', '#be123c', '#9f1239', '#14532d', '#9a3412', '#991b1b'] 
  },
  { 
    id: 'lavender-light', 
    label: 'Lavender Light', 
    colors: ['#faf5ff', '#f3e8ff', '#581c87', '#6b21a8', '#6d28d9', '#7c3aed', '#14532d', '#92400e', '#991b1b'] 
  },
];

export const AUDIENCE_PRESETS = {
  en: [
    "General Public",
    "Executives / C-Level",
    "Middle Management",
    "Technical Team / Engineers",
    "Product Managers",
    "Operations Team",
    "Marketing / Sales Team",
    "Investors / VCs / PE",
    "Board of Directors",
    "Government Officials",
    "SOE Leaders (State-Owned Enterprises)",
    "Private Entrepreneurs",
    "Cross-functional Teams",
    "B2B Clients / Partners",
    "End Consumers",
    "Students / Academic",
    "R&D Team",
    "HR / Talent Acquisition"
  ],
  zh: [
    "普通大众",
    "高管 / 决策层",
    "中层管理",
    "技术团队 / 工程师",
    "产品经理",
    "运营团队",
    "市场 / 销售团队",
    "投资人 / VC / PE",
    "董事会",
    "政府官员",
    "国企领导",
    "民营企业家",
    "跨部门团队",
    "B2B客户 / 合作伙伴",
    "终端消费者",
    "学生 / 学术界",
    "研发团队",
    "人力资源"
  ]
};

export const PRESENTATION_PURPOSES = {
  en: [
    "Report / Status Update",
    "Pitch / Sales",
    "Project Proposal",
    "Year-end Review / Summary",
    "Strategic Planning",
    "Product Launch",
    "Investment Roadshow",
    "IPO Presentation",
    "M&A / Restructuring",
    "Crisis Communication",
    "Policy Interpretation",
    "Performance Review",
    "Cost Optimization",
    "Digital Transformation",
    "Team Building / Motivation",
    "Review / Audit",
    "Educational / Training",
    "Keynote / Vision"
  ],
  zh: [
    "工作汇报 / 进度更新",
    "推介 / 销售",
    "项目立项 / 提案",
    "年终总结 / 述职",
    "战略规划",
    "产品发布 / 上线",
    "融资路演",
    "IPO路演",
    "并购重组",
    "危机公关",
    "政策解读",
    "绩效考核 / 述职",
    "降本增效",
    "数字化转型",
    "团建动员",
    "审查 / 审计",
    "教育 / 培训",
    "主题演讲 / 愿景"
  ]
};

export const SAMPLE_CONTENT = `
Gemini 1.5 Pro is a mid-size multimodal model optimized for scaling across a wide range of tasks.
It features a breakthrough experimental 1 million token context window.
This allows it to process vast amounts of information in a single stream, including hours of video or audio, and large codebases.
Gemini 1.5 Pro performs at a level comparable to Gemini 1.0 Ultra on many benchmarks but with less compute.
It uses a Mixture-of-Experts (MoE) architecture for efficiency.
`;

export const TRANSLATIONS = {
  en: {
    appTitle: "GenDeck",
    estCost: "Est. Cost",
    outlineEditor: "Outline Editor",
    generating: "Generating...",
    presentationReady: "Presentation Ready",
    generateNotes: "Generate Notes",
    regenerateNotes: "Regenerate Notes",
    preview: "Preview",
    downloadHtml: "Download HTML",
    otherFormats: "Other Formats",
    exportOutline: "Outline (Markdown)",
    exportNotes: "Speaker Notes (Txt)",
    exportPdf: "Print / Save as PDF",
    new: "New",
    confirmNew: "Are you sure? All progress will be lost.",

    // InputForm
    createNewDeck: "Create New Deck",
    modelSettings: "Model Settings",
    apiCredentials: "API Credentials",
    step1Outline: "Step 1: Outline Generation",
    step2Slides: "Step 2: Slide Code Generation",
    aiModel: "AI Model",
    provider: "Provider",
    model: "Model",
    topicLabel: "Topic / Title",
    topicPlaceholder: "e.g. Q3 Business Review",
    slideCountLabel: "Number of Slides",
    audienceLabel: "Target Audience",
    audiencePlaceholder: "Or type custom audience...",
    purposeLabel: "Presentation Goal",
    purposePlaceholder: "Or type custom goal...",
    sourceLabel: "Source Document",
    sourcePlaceholder: "Paste text or upload .txt/.md",
    pastePlaceholder: "Paste your document content here...",
    uploadFile: "Upload File",
    generateBtn: "Generate Outline",
    thinking: "Thinking...",
    googleApiKeyNote: "Managed via system environment",
    cancel: "Cancel",

    // Feeling Lucky Feature
    feelingLuckyTitle: "AI Auto Analysis",
    feelingLuckyDesc: "Let AI analyze your content and suggest the best audience & purpose",
    feelingLuckyBtn: "I'm Feeling Lucky",
    analyzing: "Analyzing...",
    analysisResult: "AI Analysis Result:",
    emptyContentError: "Please enter some content to analyze",
    analysisError: "Failed to analyze content. Please try again.",

    // OutlineEditor
    reviewStyle: "Review & Style",
    refineStructure: "Refine your structure, choose layouts, and pick a theme.",
    back: "Back",
    generateSlidesBtn: "Generate Slides",
    selectPalette: "Select Color Palette",
    customPalette: "Custom Palette:",
    colorPreview: "Preview",
    colorBg: "BG" ,
    colorSurface: "Surface",
    colorAccent: "Accent",
    colorText: "Text",
    coverPage: "Cover Page",
    endingPage: "Ending / Summary",
    slideTitlePlaceholder: "Slide Title",
    addNewSlide: "Add New Slide",
    subtitle: "Subtitle",
    subtitlePlaceholder: "Presentation subtitle or summary...",
    titleStyle: "Title Style",
    visualNotes: "Visual / Layout Notes",
    visualNotesPlaceholder: "Instructions for the AI designer...",
    closingMessage: "Closing Message",
    closingPlaceholder: "Thank you for your time...",
    endingStyle: "Ending Style",
    contentPoints: "Content Points",
    onePointPerLine: "One point per line",
    pointsPlaceholder: "• Point 1\n• Point 2\n• Point 3",
    layoutPreset: "Layout Preset",
    themeSelectionHint: "Theme Selection",
    themeSelectionHintDesc: "You can change the color theme in Deck Preview after generating slides",
    paletteHint: "Click any theme to instantly preview on your slide",
    livePreview: "Preview",
    bg: "BG",
    surface: "SUR",
    text: "TXT",
    muted: "MUT",
    accent: "ACC",
    accent2: "ALT",
    success: "OK",
    warning: "WARN",
    error: "ERR",

    // Sidebar
    slidesHeader: "Slides",
    noSlides: "No slides yet. Configure and generate to start.",

    // SlidePreview
    noSlideSelected: "No Slide Selected",
    selectSlidePrompt: "Select a slide from the sidebar to preview, regenerate, or edit.",
    updating: "Updating...",
    zoomOut: "Zoom Out",
    zoomIn: "Zoom In",
    fitToScreen: "Fit to Screen",
    regenerate: "Regenerate",
    code: "Code",
    previewView: "Preview",
    theme: "Theme",
    close: "Close",
    instructions: "Instructions for regeneration",
    instructionPlaceholder: "e.g., Change layout to compare two items...",
    apply: "Apply",
    overwriteConfirm: "Overwrite current slide design?",
    yesRegenerate: "Yes, Regenerate",
    constraints: "Active System Constraints",
    regeneratingSlide: "Regenerating Slide...",
    generatingDesign: "Generating Slide Design...",
    waitingGeneration: "Waiting for generation...",
    checkSidebar: "Check the sidebar or click Regenerate",
    speakerNotes: "Speaker Notes",
    noNotes: "No notes available. Use the \"Generate Notes\" button in the Outline view or Export menu.",
    pause: "Pause",
    resume: "Resume",
  },
  zh: {
    appTitle: "GenDeck",
    estCost: "预估成本",
    outlineEditor: "大纲编辑器",
    generating: "生成中...",
    presentationReady: "演示文稿就绪",
    generateNotes: "生成讲稿",
    regenerateNotes: "重新生成讲稿",
    preview: "预览",
    downloadHtml: "下载 HTML",
    otherFormats: "其他格式",
    exportOutline: "导出大纲 (Markdown)",
    exportNotes: "导出讲稿 (Txt)",
    exportPdf: "打印 / 另存为 PDF",
    new: "新建",
    confirmNew: "确定要重新开始吗？所有进度将丢失。",

    // InputForm
    createNewDeck: "创建新演示文稿",
    modelSettings: "模型设置",
    apiCredentials: "API 凭证",
    step1Outline: "第一步：生成大纲",
    step2Slides: "第二步：生成幻灯片代码",
    aiModel: "AI 模型",
    provider: "提供商",
    model: "模型",
    topicLabel: "主题 / 标题",
    topicPlaceholder: "例如：第三季度业务回顾",
    slideCountLabel: "幻灯片数量",
    audienceLabel: "目标受众",
    audiencePlaceholder: "或输入自定义受众...",
    purposeLabel: "演示目标",
    purposePlaceholder: "或输入自定义目标...",
    sourceLabel: "源文档",
    sourcePlaceholder: "粘贴文本或上传 .txt/.md",
    pastePlaceholder: "在此粘贴文档内容...",
    uploadFile: "上传文件",
    generateBtn: "生成大纲",
    thinking: "思考中...",
    googleApiKeyNote: "通过系统环境变量管理",
    cancel: "取消",

    // Feeling Lucky Feature
    feelingLuckyTitle: "AI 智能分析",
    feelingLuckyDesc: "让AI分析您的内容，自动推荐最佳受众和目标",
    feelingLuckyBtn: "试试手气",
    analyzing: "分析中...",
    analysisResult: "AI 分析结果：",
    emptyContentError: "请输入内容以进行分析",
    analysisError: "分析失败，请重试",

    // OutlineEditor
    reviewStyle: "审查与样式",
    refineStructure: "优化结构，选择布局，挑选主题。",
    back: "返回",
    generateSlidesBtn: "生成幻灯片",
    selectPalette: "选择配色方案",
    customPalette: "自定义配色:",
    colorPreview: "预览",
    colorBg: "背景",
    colorSurface: "表面",
    colorAccent: "强调",
    colorText: "文本",
    coverPage: "封面页",
    endingPage: "结束页 / 总结",
    slideTitlePlaceholder: "幻灯片标题",
    addNewSlide: "添加新幻灯片",
    subtitle: "副标题",
    subtitlePlaceholder: "演示文稿副标题或摘要...",
    titleStyle: "标题样式",
    visualNotes: "视觉 / 布局备注",
    visualNotesPlaceholder: "给 AI 设计师的指令...",
    closingMessage: "结束语",
    closingPlaceholder: "感谢您的聆听...",
    endingStyle: "结束页样式",
    contentPoints: "内容要点",
    onePointPerLine: "每行一个要点",
    pointsPlaceholder: "• 要点 1\n• 要点 2\n• 要点 3",
    layoutPreset: "布局预设",
    themeSelectionHint: "主题选择",
    themeSelectionHintDesc: "生成幻灯片后，您可以在预览页面更改颜色主题",
    paletteHint: "点击任意主题即可在幻灯片上实时预览",
    livePreview: "预览",
    bg: "BG",
    surface: "SUR",
    text: "TXT",
    muted: "MUT",
    accent: "ACC",
    accent2: "ALT",
    success: "OK",
    warning: "WARN",
    error: "ERR",

    // Sidebar
    slidesHeader: "幻灯片",
    noSlides: "暂无幻灯片。请配置并生成以开始。",

    // SlidePreview
    noSlideSelected: "未选择幻灯片",
    selectSlidePrompt: "从侧边栏选择一张幻灯片以预览、重新生成或编辑。",
    updating: "更新中...",
    zoomOut: "缩小",
    zoomIn: "放大",
    fitToScreen: "适应屏幕",
    regenerate: "重新生成",
    code: "代码",
    previewView: "预览",
    theme: "主题",
    close: "关闭",
    instructions: "重新生成指令",
    instructionPlaceholder: "例如：更改布局以对比两个项目...",
    apply: "应用",
    overwriteConfirm: "覆盖当前幻灯片设计？",
    yesRegenerate: "是的，重新生成",
    constraints: "当前系统约束",
    regeneratingSlide: "正在重新生成幻灯片...",
    generatingDesign: "正在生成幻灯片设计...",
    waitingGeneration: "等待生成...",
    checkSidebar: "检查侧边栏或点击重新生成",
    speakerNotes: "演讲者备注",
    noNotes: "暂无备注。请在大纲视图或导出菜单中使用“生成讲稿”按钮。",
    pause: "暂停",
    resume: "继续",
  }
};