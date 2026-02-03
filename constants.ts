
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
    defaultBaseUrl: 'https://api.moonshot.cn/v1', 
    placeholderKey: 'sk-...',
    models: [
      { id: 'moonshot-v1-8k', name: 'Moonshot V1 8k', inputPrice: 0.012, outputPrice: 0.012 }, // Approx pricing
      { id: 'moonshot-v1-32k', name: 'Moonshot V1 32k', inputPrice: 0.024, outputPrice: 0.024 },
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

export const AUDIENCE_PRESETS = [
  "General Public",
  "Executives / Management",
  "Technical Team / Engineers",
  "Investors / VCs",
  "Students / Academic",
  "Potential Customers"
];

export const PRESENTATION_PURPOSES = [
  "Report / Update",
  "Pitch / Sales",
  "Review / Audit",
  "Educational / Training",
  "Keynote / Vision"
];

export const SAMPLE_CONTENT = `
Gemini 1.5 Pro is a mid-size multimodal model optimized for scaling across a wide range of tasks.
It features a breakthrough experimental 1 million token context window.
This allows it to process vast amounts of information in a single stream, including hours of video or audio, and large codebases.
Gemini 1.5 Pro performs at a level comparable to Gemini 1.0 Ultra on many benchmarks but with less compute.
It uses a Mixture-of-Experts (MoE) architecture for efficiency.
`;
