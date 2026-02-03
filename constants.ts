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
    placeholderKey: 'Managed by Env (process.env.API_KEY)',
    models: [
      { id: 'gemini-3-flash-preview', name: 'Gemini 3.0 Flash', inputPrice: 0.1, outputPrice: 0.4 },
      { id: 'gemini-3-pro-preview', name: 'Gemini 3.0 Pro', inputPrice: 1.25, outputPrice: 5.0 },
      { id: 'gemini-2.5-flash-latest', name: 'Gemini 2.5 Flash', inputPrice: 0.075, outputPrice: 0.3 },
    ]
  },
  { 
    id: 'openai', 
    name: 'OpenAI (ChatGPT)', 
    defaultBaseUrl: 'https://api.openai.com/v1', 
    placeholderKey: 'sk-...',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o', inputPrice: 2.5, outputPrice: 10.0 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', inputPrice: 0.15, outputPrice: 0.6 },
    ]
  },
  { 
    id: 'deepseek', 
    name: 'DeepSeek', 
    defaultBaseUrl: 'https://api.deepseek.com', 
    placeholderKey: 'dsk-...',
    models: [
      { id: 'deepseek-chat', name: 'DeepSeek V3', inputPrice: 0.14, outputPrice: 0.28 },
      { id: 'deepseek-reasoner', name: 'DeepSeek R1', inputPrice: 0.55, outputPrice: 2.19 },
    ]
  },
  { 
    id: 'moonshot', 
    name: 'Moonshot (Kimi)', 
    defaultBaseUrl: 'https://api.moonshot.ai/v1', 
    placeholderKey: 'sk-...',
    models: [
      { id: 'kimi-k2-0905-preview', name: 'Kimi K2 (0905 Preview)', inputPrice: 0.012, outputPrice: 0.012 },
      { id: 'kimi-k2-turbo-preview', name: 'Kimi K2 Turbo', inputPrice: 0.008, outputPrice: 0.008 },
    ]
  },
  { 
    id: 'anthropic', 
    name: 'Anthropic (Claude)', 
    defaultBaseUrl: 'https://api.anthropic.com/v1', 
    placeholderKey: 'sk-ant-...',
    models: [
      { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet', inputPrice: 3.0, outputPrice: 15.0 },
      { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku', inputPrice: 0.25, outputPrice: 1.25 },
    ]
  },
  { 
    id: 'custom', 
    name: 'Custom (OpenAI Compatible)', 
    defaultBaseUrl: 'http://localhost:11434/v1', 
    placeholderKey: 'Bearer token...',
    models: [
      { id: 'llama3', name: 'Llama 3 (Local)', inputPrice: 0, outputPrice: 0 },
    ]
  },
];

// Format: [DarkBG, DarkSurface, Accent, LightBG/DarkText]
export const COLOR_THEMES = [
  // --- TECH GIANTS ---
  { id: 'google', label: 'Google', colors: ['#202124', '#303134', '#4285F4', '#ffffff'] }, // Material
  { id: 'meta', label: 'Meta', colors: ['#1c1e21', '#242526', '#0668E1', '#f0f2f5'] }, // Facebook Blue
  { id: 'apple', label: 'Apple', colors: ['#000000', '#1c1c1e', '#2997ff', '#f5f5f7'] }, // Cupertino
  { id: 'microsoft', label: 'Microsoft', colors: ['#171717', '#2b2b2b', '#0078D4', '#ffffff'] }, // Metro Blue
  { id: 'amazon', label: 'Amazon', colors: ['#232F3E', '#374151', '#FF9900', '#ffffff'] }, // Squid Ink & Smile
  { id: 'netflix', label: 'Netflix', colors: ['#000000', '#141414', '#E50914', '#ffffff'] }, // Red/Black
  { id: 'alibaba', label: 'Alibaba', colors: ['#1f1f1f', '#2d2d2d', '#FF6A00', '#ffffff'] }, // Orange
  { id: 'huawei', label: 'Huawei', colors: ['#1a1a1a', '#2a2a2a', '#C7000B', '#ffffff'] }, // Red
  { id: 'tencent', label: 'Tencent', colors: ['#000000', '#18181b', '#0052D9', '#ffffff'] }, // Tech Blue

  // --- PROFESSIONAL / BUSINESS ---
  { id: 'executive', label: 'Executive', colors: ['#0f172a', '#1e293b', '#d4af37', '#f8fafc'] }, // Navy & Gold
  { id: 'finance', label: 'Wall St', colors: ['#022c22', '#064e3b', '#34d399', '#ecfdf5'] }, // Dark Green
  { id: 'consulting', label: 'McKinsey', colors: ['#111827', '#374151', '#60a5fa', '#f3f4f6'] }, // Slate & Blue
  { id: 'legal', label: 'Legal Firm', colors: ['#2a2a2a', '#404040', '#9ca3af', '#f5f5f5'] }, // Grey & White

  // --- MINIMALIST / MODERN ---
  { id: 'stark', label: 'Stark Mono', colors: ['#ffffff', '#f3f4f6', '#000000', '#000000'] }, // Light mode default
  { id: 'swiss', label: 'Swiss Style', colors: ['#f5f5f5', '#e5e5e5', '#dc2626', '#171717'] }, // Red accent
  { id: 'ink', label: 'E-Ink', colors: ['#ffffff', '#f4f4f5', '#18181b', '#18181b'] }, // High contrast
  { id: 'ceramic', label: 'Ceramic', colors: ['#fafaf9', '#e7e5e4', '#57534e', '#292524'] }, // Warm Stone

  // --- CREATIVE ---
  { id: 'neon', label: 'Cyber Punk', colors: ['#09090b', '#18181b', '#d946ef', '#ffffff'] },
  { id: 'matrix', label: 'Hacker', colors: ['#000000', '#111111', '#22c55e', '#e4e4e7'] },
  { id: 'sunset', label: 'Sunset', colors: ['#4a044e', '#701a75', '#f472b6', '#fff1f2'] },
  { id: 'galaxy', label: 'Galaxy', colors: ['#2e1065', '#4c1d95', '#a855f7', '#ffffff'] },
];

export const AUDIENCE_PRESETS = {
  en: [
    "General Public",
    "Executives / Management",
    "Technical Team / Engineers",
    "Investors / VCs",
    "Students / Academic",
    "Potential Customers"
  ],
  zh: [
    "普通大众",
    "高管 / 管理层",
    "技术团队 / 工程师",
    "投资者 / 风险投资",
    "学生 / 学术界",
    "潜在客户"
  ]
};

export const PRESENTATION_PURPOSES = {
  en: [
    "Report / Update",
    "Pitch / Sales",
    "Review / Audit",
    "Educational / Training",
    "Keynote / Vision"
  ],
  zh: [
    "报告 / 更新",
    "推介 / 销售",
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
    
    // InputForm
    createNewDeck: "Create New Deck",
    modelSettings: "Model Settings",
    apiCredentials: "API Credentials",
    step1Outline: "Step 1: Outline Generation",
    step2Slides: "Step 2: Slide Code Generation",
    provider: "Provider",
    model: "Model",
    topicLabel: "Topic / Title",
    topicPlaceholder: "e.g. Q3 Business Review",
    slideCountLabel: "Number of Slides",
    audienceLabel: "Target Audience",
    audiencePlaceholder: "Or type custom audience...",
    purposeLabel: "Presentation Goal",
    sourceLabel: "Source Document",
    sourcePlaceholder: "Paste text or upload .txt/.md",
    pastePlaceholder: "Paste your document content here...",
    uploadFile: "Upload File",
    generateBtn: "Generate Outline",
    thinking: "Thinking...",
    googleApiKeyNote: "Managed via system environment",
    
    // OutlineEditor
    reviewStyle: "Review & Style",
    refineStructure: "Refine your structure, choose layouts, and pick a theme.",
    back: "Back",
    generateSlidesBtn: "Generate Slides",
    selectPalette: "Select Color Palette",
    customPalette: "Custom Palette:",
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
    instructions: "Instructions for regeneration",
    instructionPlaceholder: "e.g., Change layout to compare two items...",
    apply: "Apply",
    cancel: "Cancel",
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
    
    // InputForm
    createNewDeck: "创建新演示文稿",
    modelSettings: "模型设置",
    apiCredentials: "API 凭证",
    step1Outline: "第一步：生成大纲",
    step2Slides: "第二步：生成幻灯片代码",
    provider: "提供商",
    model: "模型",
    topicLabel: "主题 / 标题",
    topicPlaceholder: "例如：第三季度业务回顾",
    slideCountLabel: "幻灯片数量",
    audienceLabel: "目标受众",
    audiencePlaceholder: "或输入自定义受众...",
    purposeLabel: "演示目标",
    sourceLabel: "源文档",
    sourcePlaceholder: "粘贴文本或上传 .txt/.md",
    pastePlaceholder: "在此粘贴文档内容...",
    uploadFile: "上传文件",
    generateBtn: "生成大纲",
    thinking: "思考中...",
    googleApiKeyNote: "通过系统环境变量管理",
    
    // OutlineEditor
    reviewStyle: "审查与样式",
    refineStructure: "优化结构，选择布局，挑选主题。",
    back: "返回",
    generateSlidesBtn: "生成幻灯片",
    selectPalette: "选择配色方案",
    customPalette: "自定义配色:",
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
    instructions: "重新生成指令",
    instructionPlaceholder: "例如：更改布局以对比两个项目...",
    apply: "应用",
    cancel: "取消",
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