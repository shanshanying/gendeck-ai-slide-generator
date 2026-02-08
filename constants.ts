
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
    colors: ['#0D1117', '#161B22', '#FFFFFF', '#8B949E', '#FF7A1A', '#40A9FF', '#10B981', '#F59E0B', '#EF4444'] 
  },
  { 
    id: 'huawei', 
    label: 'Huawei', 
    colors: ['#FFFFFF', '#F5F7FA', '#000000', '#666666', '#FA6400', '#E60012', '#10B981', '#F59E0B', '#EF4444'] 
  },
  { 
    id: 'huawei-dark', 
    label: 'Huawei Dark', 
    colors: ['#0D1117', '#161B22', '#FFFFFF', '#8B949E', '#FF7A1A', '#FF4D4F', '#34D399', '#FBBF24', '#F87171'] 
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
    colors: ['#FFFFFF', '#F5F7FA', '#1A1A1A', '#666666', '#FF6701', '#007ACC', '#10B981', '#F59E0B', '#EF4444'] 
  },
  { 
    id: 'huawei-light', 
    label: 'Huawei Light', 
    colors: ['#FFFFFF', '#F5F7FA', '#000000', '#666666', '#FA6400', '#E60012', '#10B981', '#F59E0B', '#EF4444'] 
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

// ============================================
// STYLE PRESETS - Reusable style configurations
// Users can manually select/override these
// ============================================

export interface StylePreset {
  id: string;
  label: { en: string; zh: string };
  description: { en: string; zh: string };
  // Recommended color theme IDs (in order of preference)
  recommendedThemes: string[];
  // Typography style guidance
  typography: {
    fontFamily: string;
    fontCharacteristics: string;
    titleCase: 'sentence' | 'title' | 'uppercase' | 'lowercase';
  };
  // Layout preferences
  layoutPreferences: {
    primary: string[];
    avoid: string[];
  };
  // Content style guidance
  contentStyle: {
    tone: string;
    formality: 'formal' | 'semi-formal' | 'casual';
    bulletStyle: 'fragments' | 'sentences' | 'mixed';
    emphasis: string[];
  };
  // Visual density
  visualDensity: 'minimal' | 'balanced' | 'dense';
  // Use of data/charts
  dataVisualization: 'heavy' | 'moderate' | 'minimal';
}

export const STYLE_PRESETS: StylePreset[] = [
  // === CORPORATE FORMAL ===
  {
    id: 'corporate-formal',
    label: { en: 'Corporate Formal', zh: '企业正式' },
    description: { 
      en: 'Authoritative, data-driven, minimalist. Best for executives and board presentations.',
      zh: '权威、数据驱动、极简。适合高管和董事会演示。'
    },
    recommendedThemes: ['executive', 'midnight', 'corporate-navy', 'platinum', 'obsidian', 'carbon'],
    typography: {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontCharacteristics: 'Clean, bold, confident. Large impactful titles (56-72px). Generous letter-spacing on headers.',
      titleCase: 'title',
    },
    layoutPreferences: {
      primary: ['Data', 'Center', 'Standard', 'Compare'],
      avoid: ['Grid', 'Timeline'],
    },
    contentStyle: {
      tone: 'Authoritative, decisive, outcome-focused',
      formality: 'formal',
      bulletStyle: 'fragments',
      emphasis: ['ROI', 'business impact', 'strategic value', 'risk mitigation'],
    },
    visualDensity: 'minimal',
    dataVisualization: 'heavy',
  },
  // === CORPORATE TRUST ===
  {
    id: 'corporate-trust',
    label: { en: 'Corporate Trust', zh: '企业稳健' },
    description: { 
      en: 'Professional, trustworthy, conservative. Ideal for investors and financial presentations.',
      zh: '专业、可信赖、保守。适合投资者和金融演示。'
    },
    recommendedThemes: ['executive', 'platinum', 'titanium', 'midnight', 'silicon', 'warm-paper'],
    typography: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontCharacteristics: 'Professional, trustworthy. Mix of serif for gravitas and sans-serif for clarity. Conservative sizing.',
      titleCase: 'title',
    },
    layoutPreferences: {
      primary: ['Data', 'Compare', 'Standard', 'Grid'],
      avoid: ['Cover', 'Quote'],
    },
    contentStyle: {
      tone: 'Evidence-based, conservative, growth-oriented',
      formality: 'formal',
      bulletStyle: 'fragments',
      emphasis: ['market size', 'traction', 'team strength', 'unit economics', 'exit strategy'],
    },
    visualDensity: 'balanced',
    dataVisualization: 'heavy',
  },
  // === GOVERNMENT / OFFICIAL ===
  {
    id: 'government-official',
    label: { en: 'Government / Official', zh: '政府/官方' },
    description: { 
      en: 'Traditional, authoritative, policy-focused. Suitable for government and SOE presentations.',
      zh: '传统、权威、政策导向。适合政府和国企演示。'
    },
    recommendedThemes: ['corporate-navy', 'deep-slate', 'warm-paper', 'pure-white', 'soft-gray', 'business-green'],
    typography: {
      fontFamily: '"Noto Serif", "Noto Serif SC", Georgia, serif',
      fontCharacteristics: 'Traditional, authoritative serif fonts. Conservative, understated elegance. Stable and trustworthy appearance.',
      titleCase: 'title',
    },
    layoutPreferences: {
      primary: ['Standard', 'Timeline', 'Grid'],
      avoid: ['Neon', 'Comic', 'Pop'],
    },
    contentStyle: {
      tone: 'Formal, policy-oriented, consensus-building, respectful',
      formality: 'formal',
      bulletStyle: 'sentences',
      emphasis: ['compliance', 'public interest', 'sustainability', 'stakeholder alignment', 'stability', 'social responsibility'],
    },
    visualDensity: 'balanced',
    dataVisualization: 'moderate',
  },
  // === TECHNICAL / ENGINEERING ===
  {
    id: 'technical',
    label: { en: 'Technical / Engineering', zh: '技术/工程' },
    description: { 
      en: 'Precise, detailed, architecture-focused. Perfect for engineering and technical teams.',
      zh: '精确、详细、架构导向。适合工程和技术团队。'
    },
    recommendedThemes: ['minimal-dark', 'space-gray', 'neon-edge', 'arctic', 'graphite', 'quantum'],
    typography: {
      fontFamily: '"SF Mono", Monaco, "Cascadia Code", monospace',
      fontCharacteristics: 'Monospace or technical sans-serif. Precise, clean. Code snippets use monospace.',
      titleCase: 'sentence',
    },
    layoutPreferences: {
      primary: ['Standard', 'Compare', 'Grid', 'Timeline', 'Image-Heavy'],
      avoid: ['Center'],
    },
    contentStyle: {
      tone: 'Precise, detailed, architecture-focused',
      formality: 'semi-formal',
      bulletStyle: 'mixed',
      emphasis: ['architecture', 'implementation', 'performance', 'scalability', 'technical details'],
    },
    visualDensity: 'dense',
    dataVisualization: 'moderate',
  },
  // === ENTREPRENEUR / STARTUP ===
  {
    id: 'entrepreneur',
    label: { en: 'Entrepreneur / Startup', zh: '创业者/初创' },
    description: { 
      en: 'Bold, energetic, opportunity-focused. Great for entrepreneurs and growth-stage companies.',
      zh: '大胆、活力、机会导向。适合创业者和成长期公司。'
    },
    recommendedThemes: ['alibaba', 'bytedance', 'huawei', 'tesla', 'meta', 'amazon', 'netflix'],
    typography: {
      fontFamily: 'system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
      fontCharacteristics: 'Bold, energetic, modern. Strong contrasts. Business-impact focused.',
      titleCase: 'title',
    },
    layoutPreferences: {
      primary: ['Data', 'Compare', 'Grid', 'Timeline'],
      avoid: ['Quote'],
    },
    contentStyle: {
      tone: 'Action-oriented, opportunity-focused, pragmatic',
      formality: 'semi-formal',
      bulletStyle: 'fragments',
      emphasis: ['growth opportunity', 'competitive advantage', 'speed to market', 'ROI'],
    },
    visualDensity: 'balanced',
    dataVisualization: 'heavy',
  },
  // === PRODUCT / UX ===
  {
    id: 'product-ux',
    label: { en: 'Product / UX', zh: '产品/UX' },
    description: { 
      en: 'Clean, modern, user-centric. Ideal for product managers and UX presentations.',
      zh: '简洁、现代、用户导向。适合产品经理和UX演示。'
    },
    recommendedThemes: ['apple', 'meta', 'google', 'minimal-dark', 'zenith', 'prism', 'arctic'],
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      fontCharacteristics: 'Clean, modern, user-friendly. Balanced hierarchy.',
      titleCase: 'sentence',
    },
    layoutPreferences: {
      primary: ['Standard', 'Compare', 'Grid', 'Timeline', 'Image-Heavy'],
      avoid: ['Center'],
    },
    contentStyle: {
      tone: 'User-centric, data-informed, iterative',
      formality: 'semi-formal',
      bulletStyle: 'fragments',
      emphasis: ['user value', 'metrics', 'iteration', 'market fit', 'feature impact'],
    },
    visualDensity: 'balanced',
    dataVisualization: 'moderate',
  },
  // === MARKETING / SALES ===
  {
    id: 'marketing-sales',
    label: { en: 'Marketing / Sales', zh: '营销/销售' },
    description: { 
      en: 'Persuasive, benefit-driven, attention-grabbing. Best for marketing and sales teams.',
      zh: '有说服力、利益导向、吸引眼球。适合营销和销售团队。'
    },
    recommendedThemes: ['bytedance', 'netflix', 'prism', 'neon-edge', 'alibaba', 'tencent'],
    typography: {
      fontFamily: '"Impact", "Arial Black", sans-serif',
      fontCharacteristics: 'Bold, attention-grabbing, high energy. Strong contrasts and vibrant accents.',
      titleCase: 'title',
    },
    layoutPreferences: {
      primary: ['Grid', 'Data', 'Compare', 'Standard'],
      avoid: ['Timeline'],
    },
    contentStyle: {
      tone: 'Persuasive, benefit-driven, energetic',
      formality: 'casual',
      bulletStyle: 'fragments',
      emphasis: ['benefits', 'differentiation', 'customer success', 'market opportunity'],
    },
    visualDensity: 'balanced',
    dataVisualization: 'heavy',
  },
  // === CONSUMER / B2C ===
  {
    id: 'consumer',
    label: { en: 'Consumer / B2C', zh: '消费者/B2C' },
    description: { 
      en: 'Friendly, approachable, benefit-focused. Perfect for consumer-facing presentations.',
      zh: '友好、亲和、利益导向。适合面向消费者的演示。'
    },
    recommendedThemes: ['apple-light', 'google-light', 'cream', 'mint-light', 'rose-light', 'sky-light'],
    typography: {
      fontFamily: '-apple-system, "PingFang SC", "Microsoft YaHei", sans-serif',
      fontCharacteristics: 'Friendly, approachable, warm. Generous spacing. Easy to read.',
      titleCase: 'sentence',
    },
    layoutPreferences: {
      primary: ['Grid', 'Image-Heavy', 'Standard', 'Center'],
      avoid: ['Data', 'Timeline'],
    },
    contentStyle: {
      tone: 'Simple, benefit-focused, emotional',
      formality: 'casual',
      bulletStyle: 'fragments',
      emphasis: ['benefits', 'ease of use', 'emotional appeal', 'value proposition'],
    },
    visualDensity: 'minimal',
    dataVisualization: 'minimal',
  },
  // === EDUCATION / ACADEMIC ===
  {
    id: 'education',
    label: { en: 'Education / Academic', zh: '教育/学术' },
    description: { 
      en: 'Scholarly, clear, foundational. Suitable for educational and academic presentations.',
      zh: '学术、清晰、基础导向。适合教育和学术演示。'
    },
    recommendedThemes: ['arctic', 'lavender-light', 'pure-white', 'soft-gray', 'warm-paper'],
    typography: {
      fontFamily: 'Georgia, "Times New Roman", serif',
      fontCharacteristics: 'Scholarly, readable serif. Clear hierarchy for learning.',
      titleCase: 'title',
    },
    layoutPreferences: {
      primary: ['Standard', 'Timeline', 'Grid', 'Quote'],
      avoid: ['Data'],
    },
    contentStyle: {
      tone: 'Educational, clear, foundational',
      formality: 'semi-formal',
      bulletStyle: 'sentences',
      emphasis: ['key concepts', 'examples', 'foundations', 'applications'],
    },
    visualDensity: 'balanced',
    dataVisualization: 'moderate',
  },
  // === GENERAL / UNIVERSAL ===
  {
    id: 'general',
    label: { en: 'General / Universal', zh: '通用/普适' },
    description: { 
      en: 'Balanced, accessible, versatile. Works for broad audiences and general purposes.',
      zh: '平衡、易懂、通用。适合广泛受众和一般目的。'
    },
    recommendedThemes: ['pure-white', 'soft-gray', 'cream', 'mint-light', 'sky-light', 'titanium'],
    typography: {
      fontFamily: 'system-ui, -apple-system, sans-serif',
      fontCharacteristics: 'Clear, accessible, highly readable. Avoid jargon.',
      titleCase: 'sentence',
    },
    layoutPreferences: {
      primary: ['Standard', 'Grid', 'Center', 'Image-Heavy'],
      avoid: ['Data', 'Compare'],
    },
    contentStyle: {
      tone: 'Accessible, engaging, jargon-free',
      formality: 'casual',
      bulletStyle: 'fragments',
      emphasis: ['clarity', 'relatability', 'practical value'],
    },
    visualDensity: 'minimal',
    dataVisualization: 'minimal',
  },
];

// ============================================
// AUDIENCE CATEGORIES & PROFILES
// Organizes audiences by category with default style presets
// ============================================

export interface AudienceCategory {
  id: string;
  label: { en: string; zh: string };
  description: { en: string; zh: string };
  defaultStylePreset: string; // References STYLE_PRESETS id
  audiences: {
    id: string;
    label: { en: string; zh: string };
  }[];
}

export const AUDIENCE_CATEGORIES: AudienceCategory[] = [
  {
    id: 'corporate',
    label: { en: 'Corporate Leadership', zh: '企业管理层' },
    description: { 
      en: 'Executives, board members, and senior leadership',
      zh: '高管、董事会成员和高级领导层'
    },
    defaultStylePreset: 'corporate-formal',
    audiences: [
      { id: 'c-level', label: { en: 'C-Level / Executives', zh: 'C级高管 / 决策层' } },
      { id: 'board', label: { en: 'Board of Directors', zh: '董事会' } },
      { id: 'middle-mgmt', label: { en: 'Middle Management', zh: '中层管理' } },
      { id: 'cross-functional', label: { en: 'Cross-functional Teams', zh: '跨部门团队' } },
    ],
  },
  {
    id: 'investors',
    label: { en: 'Investors & Finance', zh: '投资者与金融' },
    description: { 
      en: 'Investors, VCs, PE firms, and financial stakeholders',
      zh: '投资者、风投、私募基金和金融利益相关者'
    },
    defaultStylePreset: 'corporate-trust',
    audiences: [
      { id: 'vc-pe', label: { en: 'VC / PE Investors', zh: '风投 / 私募基金' } },
      { id: 'angel', label: { en: 'Angel Investors', zh: '天使投资人' } },
      { id: 'institutional', label: { en: 'Institutional Investors', zh: '机构投资者' } },
      { id: 'ipo-analysts', label: { en: 'IPO Analysts', zh: 'IPO分析师' } },
    ],
  },
  {
    id: 'government',
    label: { en: 'Government & Public Sector', zh: '政府与公共部门' },
    description: { 
      en: 'Government officials, SOE leaders, and public sector',
      zh: '政府官员、国企领导和公共部门'
    },
    defaultStylePreset: 'government-official',
    audiences: [
      { id: 'officials', label: { en: 'Government Officials', zh: '政府官员' } },
      { id: 'soe-leaders', label: { en: 'SOE Leaders', zh: '国企领导' } },
      { id: 'policy-makers', label: { en: 'Policy Makers', zh: '政策制定者' } },
      { id: 'regulators', label: { en: 'Regulators', zh: '监管机构' } },
    ],
  },
  {
    id: 'technical',
    label: { en: 'Technical & Engineering', zh: '技术与工程' },
    description: { 
      en: 'Engineers, developers, architects, and technical teams',
      zh: '工程师、开发者、架构师和技术团队'
    },
    defaultStylePreset: 'technical',
    audiences: [
      { id: 'engineers', label: { en: 'Engineers / Developers', zh: '工程师 / 开发者' } },
      { id: 'architects', label: { en: 'System Architects', zh: '系统架构师' } },
      { id: 'rd-team', label: { en: 'R&D Team', zh: '研发团队' } },
      { id: 'devops', label: { en: 'DevOps / SRE', zh: '运维 / SRE' } },
    ],
  },
  {
    id: 'business',
    label: { en: 'Business & Entrepreneurship', zh: '商业与创业' },
    description: { 
      en: 'Entrepreneurs, business owners, and commercial teams',
      zh: '企业家、企业主和商业团队'
    },
    defaultStylePreset: 'entrepreneur',
    audiences: [
      { id: 'founders', label: { en: 'Founders / Entrepreneurs', zh: '创始人 / 企业家' } },
      { id: 'sme-owners', label: { en: 'SME Owners', zh: '中小企业主' } },
      { id: 'b2b-clients', label: { en: 'B2B Clients / Partners', zh: 'B2B客户 / 合作伙伴' } },
      { id: 'franchise', label: { en: 'Franchise Partners', zh: '加盟商' } },
    ],
  },
  {
    id: 'product',
    label: { en: 'Product & Design', zh: '产品与设计' },
    description: { 
      en: 'Product managers, designers, and UX professionals',
      zh: '产品经理、设计师和UX专业人士'
    },
    defaultStylePreset: 'product-ux',
    audiences: [
      { id: 'product-managers', label: { en: 'Product Managers', zh: '产品经理' } },
      { id: 'ux-designers', label: { en: 'UX / UI Designers', zh: 'UX / UI设计师' } },
      { id: 'design-team', label: { en: 'Design Team', zh: '设计团队' } },
    ],
  },
  {
    id: 'marketing',
    label: { en: 'Marketing & Sales', zh: '市场与销售' },
    description: { 
      en: 'Marketing, sales, and growth teams',
      zh: '市场、销售和增长团队'
    },
    defaultStylePreset: 'marketing-sales',
    audiences: [
      { id: 'marketing-team', label: { en: 'Marketing Team', zh: '市场团队' } },
      { id: 'sales-team', label: { en: 'Sales Team', zh: '销售团队' } },
      { id: 'growth-team', label: { en: 'Growth Team', zh: '增长团队' } },
      { id: 'brand-team', label: { en: 'Brand Team', zh: '品牌团队' } },
    ],
  },
  {
    id: 'operations',
    label: { en: 'Operations & Support', zh: '运营与支持' },
    description: { 
      en: 'Operations, HR, and support functions',
      zh: '运营、人力资源和支持职能'
    },
    defaultStylePreset: 'general',
    audiences: [
      { id: 'operations', label: { en: 'Operations Team', zh: '运营团队' } },
      { id: 'hr', label: { en: 'HR / Talent', zh: '人力资源' } },
      { id: 'customer-success', label: { en: 'Customer Success', zh: '客户成功' } },
      { id: 'support', label: { en: 'Support Team', zh: '支持团队' } },
    ],
  },
  {
    id: 'consumer',
    label: { en: 'Consumer & Public', zh: '消费者与公众' },
    description: { 
      en: 'End consumers and general public audiences',
      zh: '终端消费者和大众受众'
    },
    defaultStylePreset: 'consumer',
    audiences: [
      { id: 'end-consumers', label: { en: 'End Consumers', zh: '终端消费者' } },
      { id: 'general-public', label: { en: 'General Public', zh: '普通大众' } },
      { id: 'community', label: { en: 'Community / Users', zh: '社区 / 用户' } },
    ],
  },
  {
    id: 'education',
    label: { en: 'Education & Research', zh: '教育与研究' },
    description: { 
      en: 'Students, educators, researchers, and academics',
      zh: '学生、教育工作者、研究人员和学者'
    },
    defaultStylePreset: 'education',
    audiences: [
      { id: 'students', label: { en: 'Students', zh: '学生' } },
      { id: 'academics', label: { en: 'Academics / Researchers', zh: '学者 / 研究员' } },
      { id: 'educators', label: { en: 'Educators / Trainers', zh: '教育工作者 / 培训师' } },
    ],
  },
];

// ============================================
// LEGACY SUPPORT - Keep for backward compatibility
// ============================================

// Legacy interface - now uses StylePreset internally
export interface AudienceStyleProfile extends StylePreset {
  // Extended from StylePreset for backward compatibility
}

// Legacy function - maps audience string to appropriate style preset
export const findAudienceProfile = (audience: string): StylePreset | undefined => {
  const normalized = audience.toLowerCase();
  
  // Find matching category and audience
  for (const category of AUDIENCE_CATEGORIES) {
    for (const aud of category.audiences) {
      const audLabelEn = aud.label.en.toLowerCase();
      const audLabelZh = aud.label.zh.toLowerCase();
      
      if (normalized.includes(aud.id.toLowerCase()) ||
          normalized.includes(audLabelEn) ||
          normalized.includes(audLabelZh) ||
          audLabelEn.includes(normalized) ||
          audLabelZh.includes(normalized)) {
        return STYLE_PRESETS.find(p => p.id === category.defaultStylePreset);
      }
    }
    
    // Check category label match
    if (normalized.includes(category.label.en.toLowerCase()) ||
        normalized.includes(category.label.zh.toLowerCase())) {
      return STYLE_PRESETS.find(p => p.id === category.defaultStylePreset);
    }
  }
  
  // Fallback to keyword matching
  if (normalized.includes('executive') || normalized.includes('c-level') || normalized.includes('ceo') || normalized.includes('cto') || normalized.includes('cfo') || normalized.includes('board')) 
    return STYLE_PRESETS.find(p => p.id === 'corporate-formal');
  if (normalized.includes('investor') || normalized.includes('vc') || normalized.includes('pe'))
    return STYLE_PRESETS.find(p => p.id === 'corporate-trust');
  if (normalized.includes('engineer') || normalized.includes('technical') || normalized.includes('developer') || normalized.includes('tech') || normalized.includes('架构'))
    return STYLE_PRESETS.find(p => p.id === 'technical');
  if (normalized.includes('government') || normalized.includes('official') || normalized.includes('政府') || normalized.includes('官员'))
    return STYLE_PRESETS.find(p => p.id === 'government-official');
  if (normalized.includes('soe') || normalized.includes('国企') || normalized.includes('state-owned'))
    return STYLE_PRESETS.find(p => p.id === 'government-official');
  if (normalized.includes('entrepreneur') || normalized.includes('founder') || normalized.includes('business owner') || normalized.includes('企业家') || normalized.includes('创业'))
    return STYLE_PRESETS.find(p => p.id === 'entrepreneur');
  if (normalized.includes('product') || normalized.includes('pm ') || normalized.includes('产品'))
    return STYLE_PRESETS.find(p => p.id === 'product-ux');
  if (normalized.includes('market') || normalized.includes('sales') || normalized.includes('营销') || normalized.includes('销售'))
    return STYLE_PRESETS.find(p => p.id === 'marketing-sales');
  if (normalized.includes('consumer') || normalized.includes('customer') || normalized.includes('用户') || normalized.includes('消费者'))
    return STYLE_PRESETS.find(p => p.id === 'consumer');
  if (normalized.includes('student') || normalized.includes('academic') || normalized.includes('education') || normalized.includes('学生') || normalized.includes('学术'))
    return STYLE_PRESETS.find(p => p.id === 'education');
  
  return STYLE_PRESETS.find(p => p.id === 'general');
};

// Helper to get style preset by ID
export const getStylePreset = (presetId: string): StylePreset | undefined => {
  return STYLE_PRESETS.find(p => p.id === presetId);
};

// Legacy export for backward compatibility - maps to STYLE_PRESETS
export const AUDIENCE_PROFILES = STYLE_PRESETS;

// ============================================
// PURPOSE CATEGORIES - Hierarchical purpose selection
// ============================================

export interface PurposeCategory {
  id: string;
  label: { en: string; zh: string };
  description: { en: string; zh: string };
  purposes: {
    id: string;
    label: { en: string; zh: string };
    styleAdjustment?: Partial<StylePreset>; // Override certain style aspects
  }[];
}

export const PURPOSE_CATEGORIES: PurposeCategory[] = [
  {
    id: 'business-growth',
    label: { en: 'Business Growth', zh: '业务增长' },
    description: { en: 'Presentations focused on business development and growth', zh: '专注于业务发展和增长的演示' },
    purposes: [
      { id: 'investment-pitch', label: { en: 'Investment Pitch', zh: '融资路演' } },
      { id: 'sales-pitch', label: { en: 'Sales / Client Pitch', zh: '销售/客户推介' } },
      { id: 'partnership', label: { en: 'Partnership Proposal', zh: '合作提案' } },
      { id: 'market-expansion', label: { en: 'Market Expansion', zh: '市场拓展' } },
    ],
  },
  {
    id: 'product-innovation',
    label: { en: 'Product & Innovation', zh: '产品与创新' },
    description: { en: 'Product launches, updates, and innovation showcases', zh: '产品发布、更新和创新展示' },
    purposes: [
      { id: 'product-launch', label: { en: 'Product Launch', zh: '产品发布' } },
      { id: 'product-update', label: { en: 'Product Update / Iteration', zh: '产品更新/迭代' } },
      { id: 'tech-demo', label: { en: 'Technical Demonstration', zh: '技术演示' } },
      { id: 'innovation-showcase', label: { en: 'Innovation Showcase', zh: '创新展示' } },
    ],
  },
  {
    id: 'reporting-review',
    label: { en: 'Reporting & Review', zh: '汇报与审查' },
    description: { en: 'Status updates, reviews, and performance reports', zh: '状态更新、审查和绩效报告' },
    purposes: [
      { id: 'status-report', label: { en: 'Status / Progress Report', zh: '进度汇报' } },
      { id: 'performance-review', label: { en: 'Performance Review', zh: '绩效审查' } },
      { id: 'year-end-summary', label: { en: 'Year-end Summary', zh: '年终总结' } },
      { id: 'audit-report', label: { en: 'Audit / Compliance Report', zh: '审计/合规报告' } },
    ],
  },
  {
    id: 'strategy-planning',
    label: { en: 'Strategy & Planning', zh: '战略与规划' },
    description: { en: 'Strategic planning, roadmaps, and vision presentations', zh: '战略规划、路线图和愿景演示' },
    purposes: [
      { id: 'strategic-planning', label: { en: 'Strategic Planning', zh: '战略规划' } },
      { id: 'roadmap', label: { en: 'Roadmap Presentation', zh: '路线图演示' } },
      { id: 'vision-keynote', label: { en: 'Vision / Keynote', zh: '愿景/主题演讲' } },
      { id: 'transformation', label: { en: 'Transformation Initiative', zh: '转型倡议' } },
    ],
  },
  {
    id: 'education-training',
    label: { en: 'Education & Training', zh: '教育与培训' },
    description: { en: 'Training sessions, workshops, and educational content', zh: '培训课程、研讨会和教育内容' },
    purposes: [
      { id: 'training', label: { en: 'Training Session', zh: '培训课程' } },
      { id: 'workshop', label: { en: 'Workshop / Seminar', zh: '工作坊/研讨会' } },
      { id: 'knowledge-sharing', label: { en: 'Knowledge Sharing', zh: '知识分享' } },
      { id: 'onboarding', label: { en: 'Onboarding / Orientation', zh: '入职/导向培训' } },
    ],
  },
  {
    id: 'communication',
    label: { en: 'Communication & Engagement', zh: '沟通与互动' },
    description: { en: 'Internal communications, announcements, and team building', zh: '内部沟通、公告和团队建设' },
    purposes: [
      { id: 'announcement', label: { en: 'Announcement / News', zh: '公告/新闻' } },
      { id: 'team-building', label: { en: 'Team Building / Motivation', zh: '团队建设/激励' } },
      { id: 'change-management', label: { en: 'Change Management', zh: '变革管理' } },
      { id: 'crisis-communication', label: { en: 'Crisis Communication', zh: '危机沟通' } },
    ],
  },
];

// Purpose-driven layout recommendations
export interface PurposeLayoutGuide {
  purpose: string;
  layouts: string[];
  contentFocus: string;
}

export const PURPOSE_LAYOUT_GUIDES: PurposeLayoutGuide[] = [
  { purpose: 'pitch', layouts: ['Data', 'Compare', 'Grid', 'Standard'], contentFocus: 'Value proposition, differentiation, traction' },
  { purpose: 'report', layouts: ['Data', 'Timeline', 'Standard', 'Grid'], contentFocus: 'Key metrics, status, trends' },
  { purpose: 'proposal', layouts: ['Compare', 'Timeline', 'Standard', 'Grid'], contentFocus: 'Problem, solution, plan, ROI' },
  { purpose: 'review', layouts: ['Timeline', 'Data', 'Standard'], contentFocus: 'Achievements, metrics, learnings' },
  { purpose: 'training', layouts: ['Grid', 'Standard', 'Image-Heavy', 'Quote'], contentFocus: 'Concepts, examples, exercises' },
  { purpose: 'roadshow', layouts: ['Data', 'Compare', 'Center', 'Standard'], contentFocus: 'Vision, opportunity, team, traction' },
  { purpose: 'launch', layouts: ['Grid', 'Image-Heavy', 'Data', 'Standard'], contentFocus: 'Features, benefits, demo, availability' },
];

// ============================================
// STYLE RESOLUTION - Audience + Purpose determine style
// ============================================

export interface StyleRecommendation {
  presetId: string;
  reason: { en: string; zh: string };
}

// Matrix: Audience Category + Purpose Category -> Style Preset
const AUDIENCE_PURPOSE_STYLE_MATRIX: Record<string, Record<string, StyleRecommendation>> = {
  // Corporate Leadership
  'corporate': {
    'business-growth': { presetId: 'corporate-formal', reason: { en: 'Executive authority for growth initiatives', zh: '高管权威风格，适合增长倡议' } },
    'product-innovation': { presetId: 'product-ux', reason: { en: 'Product-focused executive presentation', zh: '产品导向的高管演示' } },
    'reporting-review': { presetId: 'corporate-formal', reason: { en: 'Formal reporting to leadership', zh: '向领导层的正式汇报' } },
    'strategy-planning': { presetId: 'corporate-formal', reason: { en: 'Strategic vision with authority', zh: '权威性的战略愿景' } },
    'education-training': { presetId: 'education', reason: { en: 'Leadership development content', zh: '领导力发展内容' } },
    'communication': { presetId: 'corporate-trust', reason: { en: 'Trust-building internal communication', zh: '建立信任的内部沟通' } },
  },
  // Investors & Finance
  'investors': {
    'business-growth': { presetId: 'corporate-trust', reason: { en: 'Trust-focused investor presentation', zh: '以信任为核心的投资者演示' } },
    'product-innovation': { presetId: 'corporate-trust', reason: { en: 'Product potential with financial rigor', zh: '产品潜力与财务严谨性' } },
    'reporting-review': { presetId: 'corporate-trust', reason: { en: 'Financial reporting with credibility', zh: '具有可信度的财务报告' } },
    'strategy-planning': { presetId: 'corporate-trust', reason: { en: 'Long-term value proposition', zh: '长期价值主张' } },
    'education-training': { presetId: 'education', reason: { en: 'Investor education materials', zh: '投资者教育材料' } },
    'communication': { presetId: 'corporate-trust', reason: { en: 'Transparent stakeholder communication', zh: '透明的利益相关者沟通' } },
  },
  // Government & Public Sector
  'government': {
    'business-growth': { presetId: 'government-official', reason: { en: 'Official procurement or partnership', zh: '官方采购或合作' } },
    'product-innovation': { presetId: 'government-official', reason: { en: 'Public sector innovation showcase', zh: '公共部门创新展示' } },
    'reporting-review': { presetId: 'government-official', reason: { en: 'Official reporting to authorities', zh: '向当局的官方报告' } },
    'strategy-planning': { presetId: 'government-official', reason: { en: 'Policy-aligned strategic planning', zh: '政策对齐的战略规划' } },
    'education-training': { presetId: 'education', reason: { en: 'Government training programs', zh: '政府培训项目' } },
    'communication': { presetId: 'government-official', reason: { en: 'Official announcements and updates', zh: '官方公告和更新' } },
  },
  // Technical & Engineering
  'technical': {
    'business-growth': { presetId: 'technical', reason: { en: 'Technical solution for business growth', zh: '业务增长的技术解决方案' } },
    'product-innovation': { presetId: 'technical', reason: { en: 'Technical innovation deep-dive', zh: '技术创新深度解析' } },
    'reporting-review': { presetId: 'technical', reason: { en: 'Technical status and metrics review', zh: '技术状态和指标审查' } },
    'strategy-planning': { presetId: 'technical', reason: { en: 'Technical architecture and roadmap', zh: '技术架构和路线图' } },
    'education-training': { presetId: 'technical', reason: { en: 'Technical skills training', zh: '技术技能培训' } },
    'communication': { presetId: 'technical', reason: { en: 'Technical team updates', zh: '技术团队更新' } },
  },
  // Business & Entrepreneurship
  'business': {
    'business-growth': { presetId: 'entrepreneur', reason: { en: 'Entrepreneurial growth mindset', zh: '创业增长思维' } },
    'product-innovation': { presetId: 'entrepreneur', reason: { en: 'Innovation with business agility', zh: '具有商业敏捷性的创新' } },
    'reporting-review': { presetId: 'corporate-trust', reason: { en: 'Business performance review', zh: '业务绩效审查' } },
    'strategy-planning': { presetId: 'entrepreneur', reason: { en: 'Agile strategic planning', zh: '敏捷战略规划' } },
    'education-training': { presetId: 'education', reason: { en: 'Entrepreneurship training', zh: '创业培训' } },
    'communication': { presetId: 'entrepreneur', reason: { en: 'Dynamic team communication', zh: '充满活力的团队沟通' } },
  },
  // Product & Design
  'product': {
    'business-growth': { presetId: 'product-ux', reason: { en: 'Product-led growth presentation', zh: '产品主导的增长演示' } },
    'product-innovation': { presetId: 'product-ux', reason: { en: 'Product innovation showcase', zh: '产品创新展示' } },
    'reporting-review': { presetId: 'product-ux', reason: { en: 'Product metrics and user insights', zh: '产品指标和用户洞察' } },
    'strategy-planning': { presetId: 'product-ux', reason: { en: 'Product strategy and vision', zh: '产品战略和愿景' } },
    'education-training': { presetId: 'product-ux', reason: { en: 'Product management training', zh: '产品管理培训' } },
    'communication': { presetId: 'product-ux', reason: { en: 'Product team alignment', zh: '产品团队对齐' } },
  },
  // Marketing & Sales
  'marketing': {
    'business-growth': { presetId: 'marketing-sales', reason: { en: 'High-energy growth presentation', zh: '高能增长演示' } },
    'product-innovation': { presetId: 'marketing-sales', reason: { en: 'Product marketing launch', zh: '产品营销发布' } },
    'reporting-review': { presetId: 'marketing-sales', reason: { en: 'Marketing performance metrics', zh: '营销绩效指标' } },
    'strategy-planning': { presetId: 'marketing-sales', reason: { en: 'Marketing strategy vision', zh: '营销战略愿景' } },
    'education-training': { presetId: 'marketing-sales', reason: { en: 'Sales training and enablement', zh: '销售培训和赋能' } },
    'communication': { presetId: 'marketing-sales', reason: { en: 'Brand and campaign updates', zh: '品牌和活动更新' } },
  },
  // Operations & Support
  'operations': {
    'business-growth': { presetId: 'general', reason: { en: 'Operational efficiency for growth', zh: '运营效率支持增长' } },
    'product-innovation': { presetId: 'general', reason: { en: 'Process innovation showcase', zh: '流程创新展示' } },
    'reporting-review': { presetId: 'general', reason: { en: 'Operations metrics review', zh: '运营指标审查' } },
    'strategy-planning': { presetId: 'general', reason: { en: 'Operations strategic planning', zh: '运营战略规划' } },
    'education-training': { presetId: 'education', reason: { en: 'Operations training programs', zh: '运营培训项目' } },
    'communication': { presetId: 'general', reason: { en: 'Operational updates and alerts', zh: '运营更新和提醒' } },
  },
  // Consumer & Public
  'consumer': {
    'business-growth': { presetId: 'consumer', reason: { en: 'Consumer-friendly growth story', zh: '消费者友好的增长故事' } },
    'product-innovation': { presetId: 'consumer', reason: { en: 'Consumer product showcase', zh: '消费产品展示' } },
    'reporting-review': { presetId: 'education', reason: { en: 'Transparent public reporting', zh: '透明的公众报告' } },
    'strategy-planning': { presetId: 'consumer', reason: { en: 'Consumer vision and values', zh: '消费者愿景和价值观' } },
    'education-training': { presetId: 'education', reason: { en: 'Consumer education content', zh: '消费者教育内容' } },
    'communication': { presetId: 'consumer', reason: { en: 'Brand-consumer communication', zh: '品牌-消费者沟通' } },
  },
  // Education & Research
  'education': {
    'business-growth': { presetId: 'education', reason: { en: 'Educational business development', zh: '教育业务发展' } },
    'product-innovation': { presetId: 'education', reason: { en: 'EdTech innovation showcase', zh: '教育科技展示' } },
    'reporting-review': { presetId: 'education', reason: { en: 'Research findings and reports', zh: '研究发现和报告' } },
    'strategy-planning': { presetId: 'education', reason: { en: 'Educational strategy planning', zh: '教育战略规划' } },
    'education-training': { presetId: 'education', reason: { en: 'Academic course content', zh: '学术课程内容' } },
    'communication': { presetId: 'education', reason: { en: 'Academic community updates', zh: '学术界更新' } },
  },
};

// Helper function to resolve style based on audience and purpose categories
export const resolveStyleRecommendation = (
  audienceCategoryId: string,
  purposeCategoryId: string,
  lang: 'en' | 'zh' = 'en'
): StyleRecommendation => {
  const matrix = AUDIENCE_PURPOSE_STYLE_MATRIX[audienceCategoryId];
  if (matrix && matrix[purposeCategoryId]) {
    return matrix[purposeCategoryId];
  }
  
  // Fallback to audience default
  const category = AUDIENCE_CATEGORIES.find(c => c.id === audienceCategoryId);
  return {
    presetId: category?.defaultStylePreset || 'general',
    reason: { en: 'Based on audience type', zh: '基于受众类型' }
  };
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