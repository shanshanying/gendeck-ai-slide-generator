
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
  {
    id: 'custom',
    name: 'Custom (OpenAI-compatible)',
    defaultBaseUrl: 'http://localhost:11434/v1',
    placeholderKey: 'Optional (for local/open endpoints)',
    models: [
      { id: 'custom-model', name: 'Custom Model', inputPrice: 0, outputPrice: 0 },
    ]
  },
];

// Format: [bg, bg-soft, bg-glass, bg-invert, text, text-muted, text-faint, text-invert,
//          border, border-strong, divider, primary, secondary, accent, success, warning, danger, info]
// 18-Color Standard Deck System
// Format: [bg, bg-soft, bg-glass, bg-invert, text, text-muted, text-faint, text-invert,
//          border, border-strong, divider, primary, secondary, accent, success, warning, danger, info]
// 18-Color Standard Deck System
export const COLOR_THEMES = [
  // ============================================================
  // 1. 商务类 (Business)
  // ============================================================
  
  // 1.1 经典商务 · 深蓝金 (Classic Navy)
  { 
    id: 'classic-navy', 
    label: 'Classic Navy', 
    colors: ['#0F1419', '#1A2332', '#1a2332cc', '#F0F4F8', '#F0F4F8', '#8B9AAA', '#5A6A7A', '#0F1419', '#2A3442', '#3A4856', '#1A2332', '#5B8DB8', '#E8D179', '#7AA8D0', '#4ADE80', '#FCD34D', '#F87171', '#60A5FA']
  },
  { 
    id: 'classic-navy-light', 
    label: 'Classic Navy Light', 
    colors: ['#FAF8F5', '#FFFFFF', '#ffffffd8', '#0F172A', '#1A2332', '#6B7B8C', '#9AA5B1', '#FFFFFF', '#E8E4DF', '#D0C8C0', '#F0EDE8', '#1E3A5F', '#C9A227', '#2E5A8F', '#2D8659', '#B8860B', '#8B2635', '#4A6FA5']
  },
  
  // 1.2 现代商务 · 石墨青 (Modern Graphite)
  { 
    id: 'modern-graphite', 
    label: 'Modern Graphite', 
    colors: ['#171923', '#1A202C', '#1a202cd8', '#F7FAFC', '#F7FAFC', '#A0AEC0', '#718096', '#171923', '#2D3748', '#4A5568', '#171923', '#4FD1C5', '#A0AEC0', '#81E6D9', '#68D391', '#F6E05E', '#FC8181', '#63B3ED']
  },
  { 
    id: 'modern-graphite-light', 
    label: 'Modern Graphite Light', 
    colors: ['#F5F7FA', '#FFFFFF', '#ffffffe5', '#1A202C', '#2C3E50', '#718096', '#A0AEC0', '#FFFFFF', '#E2E8F0', '#CBD5E0', '#EDF2F7', '#319795', '#2D3748', '#38B2AC', '#38A169', '#D69E2E', '#E53E3E', '#4299E1']
  },
  
  // 1.3 金融商务 · 墨绿金 (Finance Emerald)
  { 
    id: 'finance-emerald', 
    label: 'Finance Emerald', 
    colors: ['#0C1F1A', '#112826', '#112826d8', '#ECFDF5', '#ECFDF5', '#6EE7B7', '#34D399', '#0C1F1A', '#1A3C34', '#2D5A50', '#112826', '#34D399', '#FCD34D', '#6EE7B7', '#4ADE80', '#FBBF24', '#F87171', '#22D3EE']
  },
  { 
    id: 'finance-emerald-light', 
    label: 'Finance Emerald Light', 
    colors: ['#F9F8F6', '#FFFFFF', '#ffffffe0', '#064E3B', '#1C4532', '#588A6E', '#8FB5A0', '#FFFFFF', '#E5E0D8', '#D0C8B8', '#F0EDE8', '#064E3B', '#B8860B', '#065F46', '#059669', '#D97706', '#991B1B', '#0891B2']
  },

  // ============================================================
  // 2. 政企类 (Government)
  // ============================================================
  
  // 2.1 政务红 · 国旗红 (Government Red)
  { 
    id: 'government-red', 
    label: 'Government Red', 
    colors: ['#0A0A0A', '#1A1A1A', '#1a1a1ae5', '#F5F5F5', '#F5F5F5', '#808080', '#505050', '#0A0A0A', '#2A2A2A', '#404040', '#1A1A1A', '#FF2D2D', '#FFD700', '#FF5757', '#32CD32', '#FFA500', '#FF4444', '#60A5FA']
  },
  { 
    id: 'government-red-light', 
    label: 'Government Red Light', 
    colors: ['#FFFBF7', '#FFFFFF', '#fffbf7f2', '#1F1F1F', '#1F1F1F', '#737373', '#A3A3A3', '#FFFFFF', '#E8E0D8', '#D0C8C0', '#F5F0EB', '#DE2910', '#8B0000', '#FF1A1A', '#228B22', '#FF8C00', '#B22222', '#4169E1']
  },
  
  // 2.2 国企蓝 · 藏青银 (SOE Navy)
  { 
    id: 'soe-navy', 
    label: 'SOE Navy', 
    colors: ['#020617', '#0F172A', '#0f172ae0', '#F8FAFC', '#F8FAFC', '#94A3B8', '#64748B', '#020617', '#1E293B', '#334155', '#0F172A', '#60A5FA', '#CBD5E1', '#93C5FD', '#4ADE80', '#FBBF24', '#F87171', '#38BDF8']
  },
  { 
    id: 'soe-navy-light', 
    label: 'SOE Navy Light', 
    colors: ['#F5F7FA', '#FFFFFF', '#ffffffea', '#0F172A', '#0F172A', '#64748B', '#94A3B8', '#FFFFFF', '#E2E8F0', '#CBD5E1', '#F1F5F9', '#1E3A8A', '#64748B', '#2563EB', '#15803D', '#B45309', '#991B1B', '#0284C7']
  },
  
  // 2.3 行政灰 · 低调奢华 (Executive Gray)
  { 
    id: 'executive-gray', 
    label: 'Executive Gray', 
    colors: ['#0C0A09', '#1C1917', '#1c1917d8', '#FAFAF9', '#FAFAF9', '#A8A29E', '#78716C', '#0C0A09', '#292524', '#44403C', '#1C1917', '#D6D3D1', '#F59E0B', '#E7E5E4', '#A3A3A3', '#D97706', '#DC2626', '#A8A29E']
  },
  { 
    id: 'executive-gray-light', 
    label: 'Executive Gray Light', 
    colors: ['#FAFAF9', '#FFFFFF', '#fafaf9e5', '#292524', '#292524', '#78716C', '#A8A29E', '#FFFFFF', '#E7E5E4', '#D6D3D1', '#F5F5F4', '#44403C', '#A8A29E', '#57534E', '#57534E', '#B45309', '#7F1D1D', '#57534E']
  },

  // ============================================================
  // 3. 科技互联网 (Tech Internet)
  // ============================================================
  
  // 3.1 赛博蓝 · 电光蓝 (Cyber Electric)
  { 
    id: 'cyber-electric', 
    label: 'Cyber Electric', 
    colors: ['#050A14', '#0A192F', '#0a192fbf', '#E6F1FF', '#E6F1FF', '#8892B0', '#5F6B7A', '#050A14', '#1D4E89', '#2E5AA0', '#0A192F', '#00D4FF', '#FF006E', '#80EBFF', '#00E676', '#FFD600', '#FF5252', '#40C4FF']
  },
  { 
    id: 'cyber-electric-light', 
    label: 'Cyber Electric Light', 
    colors: ['#F0F4F8', '#FFFFFF', '#ffffffcc', '#0A192F', '#0A192F', '#5F6B7A', '#8B95A8', '#FFFFFF', '#E0E6ED', '#C0C8D8', '#F0F4F8', '#00D4FF', '#FF006E', '#33DDFF', '#00C853', '#FFAB00', '#FF1744', '#00B0FF']
  },
  
  // 3.2 极光紫 · 紫罗兰 (Aurora Violet)
  { 
    id: 'aurora-violet', 
    label: 'Aurora Violet', 
    colors: ['#0F0A1A', '#1A103C', '#1a103ccc', '#F3E8FF', '#F3E8FF', '#A78BFA', '#7C3AED', '#0F0A1A', '#4C1D95', '#5B21B6', '#1A103C', '#C084FC', '#22D3EE', '#D8B4FE', '#34D399', '#FBBF24', '#F87171', '#60A5FA']
  },
  { 
    id: 'aurora-violet-light', 
    label: 'Aurora Violet Light', 
    colors: ['#F8F7FA', '#FFFFFF', '#ffffffd8', '#2D1B4E', '#2D1B4E', '#7C3AED', '#A78BFA', '#FFFFFF', '#E9E4F0', '#D4C4E0', '#F3F0F8', '#8B5CF6', '#06B6D4', '#A78BFA', '#10B981', '#F59E0B', '#EF4444', '#3B82F6']
  },
  
  // 3.3 神经元橙 · 活力橙 (Neuron Orange)
  { 
    id: 'neuron-orange', 
    label: 'Neuron Orange', 
    colors: ['#0F0F0F', '#1A1A1A', '#1a1a1ad8', '#FAFAFA', '#FAFAFA', '#A3A3A3', '#737373', '#0F0F0F', '#333333', '#525252', '#1A1A1A', '#FF7A45', '#FF4D9E', '#FF9E7A', '#4ADE80', '#FCD34D', '#F87171', '#60A5FA']
  },
  { 
    id: 'neuron-orange-light', 
    label: 'Neuron Orange Light', 
    colors: ['#FFFBF5', '#FFFFFF', '#ffffffe0', '#1F2937', '#1F2937', '#6B7280', '#9CA3AF', '#FFFFFF', '#FFE4D6', '#FFD0C0', '#FFF0E8', '#FF6B35', '#FF006E', '#FF8C5A', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6']
  },

  // ============================================================
  // 4. 极简类 (Minimalist)
  // ============================================================
  
  // 4.1 纸白 · 日系极简 (Paper White)
  { 
    id: 'paper-white', 
    label: 'Paper White', 
    colors: ['#1A1A1A', '#242424', '#242424d8', '#F5F5F0', '#F5F5F0', '#808080', '#505050', '#1A1A1A', '#333333', '#505050', '#242424', '#F5F5F0', '#A0A0A0', '#FFFFFF', '#7A8B7C', '#C4A574', '#B88B8B', '#8B9BAB']
  },
  { 
    id: 'paper-white-light', 
    label: 'Paper White Light', 
    colors: ['#FDFCF8', '#FFFFFF', '#ffffffe5', '#2C2C2C', '#2C2C2C', '#8C8C8C', '#B8B8B8', '#FFFFFF', '#E8E8E8', '#D0D0D0', '#F5F5F5', '#2C2C2C', '#B8B8B8', '#404040', '#5A6B5C', '#B8956A', '#9B6B6B', '#6B7B8B']
  },
  
  // 4.2 水泥灰 · 工业极简 (Concrete Gray)
  { 
    id: 'concrete-gray', 
    label: 'Concrete Gray', 
    colors: ['#262626', '#333333', '#333333cc', '#E0E0E0', '#E0E0E0', '#808080', '#606060', '#262626', '#404040', '#606060', '#333333', '#B0B0B0', '#909090', '#D0D0D0', '#8FA88F', '#C4B48A', '#C48A8A', '#90A0B0']
  },
  { 
    id: 'concrete-gray-light', 
    label: 'Concrete Gray Light', 
    colors: ['#F2F2F2', '#FFFFFF', '#ffffffd8', '#404040', '#404040', '#808080', '#B0B0B0', '#FFFFFF', '#D9D9D9', '#BFBFBF', '#E6E6E6', '#808080', '#B0B0B0', '#606060', '#6B8E6B', '#B8A06B', '#B87070', '#708090']
  },
  
  // 4.3 奶油色 · 温馨极简 (Cream Minimal)
  { 
    id: 'cream-minimal', 
    label: 'Cream Minimal', 
    colors: ['#1A1714', '#2A2520', '#2a2520d8', '#F5F0E8', '#F5F0E8', '#A69B8A', '#786C5C', '#1A1714', '#3A342E', '#5A5046', '#2A2520', '#D4B896', '#C9B896', '#E8D6B8', '#9AAF8E', '#E0C878', '#D4A0A0', '#9AABBB']
  },
  { 
    id: 'cream-minimal-light', 
    label: 'Cream Minimal Light', 
    colors: ['#FAF8F5', '#FFFFFF', '#ffffffe0', '#3D3833', '#3D3833', '#8B8279', '#B0A89F', '#FFFFFF', '#E8E0D5', '#D0C8BC', '#F0EAE0', '#A67B5B', '#C4A77D', '#8B6548', '#7A8B6E', '#C9A959', '#B87676', '#7A8B9B']
  },

  // ============================================================
  // 5. 艺术类 (Artistic)
  // ============================================================
  
  // 5.1 莫兰迪 · 高级灰 (Morandi)
  { 
    id: 'morandi', 
    label: 'Morandi', 
    colors: ['#2A2826', '#363432', '#363432d8', '#E8E4E0', '#E8E4E0', '#989088', '#706860', '#2A2826', '#42403E', '#5A5856', '#363432', '#D4C4B8', '#B8C4B0', '#E0D4C8', '#A8B8A0', '#D4C8A8', '#C8A8A8', '#B0B8C0']
  },
  { 
    id: 'morandi-light', 
    label: 'Morandi Light', 
    colors: ['#F5F3F0', '#FAFAF8', '#fafaf8e5', '#4A4A48', '#4A4A48', '#8B8B89', '#B0A8A0', '#FFFFFF', '#E0DCD5', '#C8C4BC', '#EBE8E3', '#B5A397', '#A8B5A0', '#9B8B7D', '#8FA088', '#C4B598', '#B59898', '#98A0A8']
  },
  
  // 5.2 包豪斯 · 三原色 (Bauhaus)
  { 
    id: 'bauhaus', 
    label: 'Bauhaus', 
    colors: ['#0A0A0A', '#1A1A1A', '#1a1a1ae5', '#FFFFFF', '#FFFFFF', '#888888', '#555555', '#0A0A0A', '#333333', '#666666', '#1A1A1A', '#FF4757', '#48DBFB', '#FECA57', '#1DD1A1', '#FECA57', '#FF6B6B', '#48DBFB']
  },
  { 
    id: 'bauhaus-light', 
    label: 'Bauhaus Light', 
    colors: ['#FFFFFF', '#F5F5F5', '#fffffff2', '#1A1A1A', '#1A1A1A', '#666666', '#999999', '#FFFFFF', '#E0E0E0', '#BFBFBF', '#F0F0F0', '#E63946', '#457B9D', '#F4A261', '#2A9D8F', '#E9C46A', '#E63946', '#457B9D']
  },
  
  // 5.3 复古胶片 · 暖棕 (Vintage Film)
  { 
    id: 'vintage-film', 
    label: 'Vintage Film', 
    colors: ['#1A1410', '#2A2018', '#2a2018d8', '#F5E6D3', '#F5E6D3', '#A89080', '#685848', '#1A1410', '#3A2C20', '#5A4838', '#2A2018', '#CD853F', '#D2B48C', '#DEB887', '#8FBC8F', '#F4A460', '#D2691E', '#8FA0B0']
  },
  { 
    id: 'vintage-film-light', 
    label: 'Vintage Film Light', 
    colors: ['#F5F1E8', '#FFFCF5', '#fffcf5e0', '#3D3229', '#3D3229', '#8B7355', '#B8A090', '#FFFCF5', '#E0D5C5', '#C8B8A8', '#EBE5D8', '#8B4513', '#D4A574', '#A0522D', '#556B2F', '#CD853F', '#A0522D', '#708090']
  },

  // 5.4 漫威宇宙 · 英雄本色 (Marvel Universe)
  { 
    id: 'marvel', 
    label: 'Marvel', 
    colors: ['#0D0D0D', '#1A1A1A', '#1a1a1acc', '#FFD700', '#F0F0F0', '#808080', '#505050', '#0D0D0D', '#333333', '#FF4444', '#2A2A2A', '#FF4444', '#4D79FF', '#FFE55C', '#00E676', '#FF9100', '#FF4444', '#4D79FF']
  },
  { 
    id: 'marvel-light', 
    label: 'Marvel Light', 
    colors: ['#F5F5F5', '#FFFFFF', '#ffffffe5', '#0D0D0D', '#0D0D0D', '#4A4A4A', '#888888', '#FFFFFF', '#E0E0E0', '#E23636', '#E23636', '#E23636', '#0033CC', '#FFD700', '#00C853', '#FF6D00', '#E23636', '#0033CC']
  },

  // 5.5 美拉德 · 焦糖棕 (Maillard Caramel)
  { 
    id: 'maillard', 
    label: 'Maillard', 
    colors: ['#1A1410', '#2A211B', '#2a211be0', '#FAF7F2', '#F5F0E8', '#A89080', '#786C5C', '#1A1410', '#3D3229', '#C4A77D', '#2A211B', '#C4A77D', '#D4B896', '#E8C4A0', '#8A9B6F', '#D4B896', '#A65D3D', '#8B9BAB']
  },
  { 
    id: 'maillard-light', 
    label: 'Maillard Light', 
    colors: ['#FAF7F2', '#F5F0E8', '#f5f0e8eb', '#3D3229', '#3D3229', '#8B7355', '#B8A090', '#FAF7F2', '#E8E0D5', '#A67B5B', '#F0EAE0', '#A67B5B', '#8B6239', '#D4A574', '#5A6B47', '#B8956A', '#8B4513', '#6B7B8B']
  },

  // 5.6 藕粉灰 · 温柔雅致 (Lotus Pink)
  { 
    id: 'lotus-pink', 
    label: 'Lotus Pink', 
    colors: ['#2A2527', '#363033', '#363033e0', '#F5E6E8', '#F0E5E7', '#A898A0', '#786870', '#2A2527', '#4A4045', '#E8A5B5', '#363033', '#E8A5B5', '#B8A8B0', '#F4C2C2', '#A8C4A8', '#E8D4A8', '#E89090', '#A8C0D0']
  },
  { 
    id: 'lotus-pink-light', 
    label: 'Lotus Pink Light', 
    colors: ['#FDF8F8', '#FFFFFF', '#fffffff5', '#4A4A4A', '#3D3D3D', '#8B7B7B', '#B8A8A8', '#FDF8F8', '#E8D8D8', '#D4A5A5', '#F0E5E5', '#D4A5A5', '#6B6B6B', '#E8B4B4', '#8FA68F', '#D4B896', '#C47070', '#8FA0B0']
  },

  // ============================================================
  // 7. 女性力量 (Feminine Power)
  // ============================================================
  
  // 7.1 酒红权力 · 职场女王 (Burgundy Power)
  { 
    id: 'burgundy-power', 
    label: 'Burgundy Power', 
    colors: ['#1A1A1A', '#242424', '#242424e6', '#F5F0E8', '#F0E8E0', '#A89890', '#706860', '#1A1A1A', '#3D3535', '#A04050', '#2A2A2A', '#A04050', '#D4AF37', '#C45C6C', '#6B9B6B', '#F4D03F', '#D45460', '#8BA5B5']
  },
  { 
    id: 'burgundy-power-light', 
    label: 'Burgundy Power Light', 
    colors: ['#FAF8F7', '#FFFFFF', '#fffffff5', '#2D2D2D', '#2D2D2D', '#6B5B5B', '#A89898', '#FFFFFF', '#E8E0D8', '#722F37', '#F0E8E0', '#722F37', '#2D2D2D', '#8B404C', '#4A6B4A', '#B8860B', '#8B2635', '#5B6B7B']
  },
  
  // 7.2 珍珠老钱 · 优雅智慧 (Pearl Old Money)
  { 
    id: 'pearl-oldmoney', 
    label: 'Pearl Old Money', 
    colors: ['#1C1C1C', '#2A2A2A', '#2a2a2ae0', '#F0F0E8', '#F5F5E8', '#A0A0A0', '#707070', '#1C1C1C', '#3D3D3D', '#F4D03F', '#2A2A2A', '#F4D03F', '#C9A86C', '#E8D8A8', '#8FBC8F', '#FFD700', '#D2691E', '#90A0B0']
  },
  { 
    id: 'pearl-oldmoney-light', 
    label: 'Pearl Old Money Light', 
    colors: ['#F8F7F2', '#FFFFFF', '#ffffffe6', '#2C2C2C', '#2C2C2C', '#7A7A7A', '#B0B0B0', '#FFFFFF', '#E5E5E0', '#D4AF37', '#F0F0E8', '#D4AF37', '#8B7355', '#C0B090', '#6B8E6B', '#C9A227', '#A0522D', '#708090']
  },
  
  // 7.3 紫罗兰叛逆 · 独立酷女孩 (Violet Rebellion)
  { 
    id: 'violet-rebellion', 
    label: 'Violet Rebellion', 
    colors: ['#0F0A1A', '#1A1028', '#1a1028d9', '#E8D5F0', '#F0E0F8', '#A080B0', '#604080', '#0F0A1A', '#3D2060', '#A855F7', '#1A1028', '#A855F7', '#FF4DA6', '#40E0FF', '#00E676', '#FFEA00', '#FF4D9E', '#40E0FF']
  },
  { 
    id: 'violet-rebellion-light', 
    label: 'Violet Rebellion Light', 
    colors: ['#F5F3F8', '#FFFFFF', '#ffffffeb', '#1A0A2E', '#1A0A2E', '#6B5B8B', '#9B8BB0', '#FFFFFF', '#E0D5F0', '#7C3AED', '#F0E8F8', '#7C3AED', '#FF006E', '#00D9FF', '#00C853', '#FFD600', '#FF006E', '#00D9FF']
  },
  
  // 7.4 赤陶大地 · 母性自然 (Terracotta Earth)
  { 
    id: 'terracotta-earth', 
    label: 'Terracotta Earth', 
    colors: ['#2A2520', '#363028', '#363028e0', '#F0E5D8', '#F5E6D8', '#A89888', '#786858', '#2A2520', '#4A4035', '#F49A80', '#363028', '#F49A80', '#B8D4A8', '#E8C8A0', '#9CC48C', '#E8C070', '#D47060', '#8BBBD0']
  },
  { 
    id: 'terracotta-earth-light', 
    label: 'Terracotta Earth Light', 
    colors: ['#F9F6F0', '#FFFFFF', '#ffffffe6', '#4A4035', '#3D3530', '#8B7D70', '#B8A898', '#F9F6F0', '#E8E0D5', '#E07A5F', '#F0EAE0', '#E07A5F', '#9CAF88', '#D4A574', '#7A9B6A', '#D4A05A', '#B85C4A', '#6B8B9B']
  },
  
  // 7.5 赛博姬械 · 未来科技 (Cyber Femme)
  { 
    id: 'cyber-femme', 
    label: 'Cyber Femme', 
    colors: ['#0A0F14', '#141B24', '#141b24d9', '#E0F0FF', '#E0F0FF', '#80A0B8', '#506070', '#0A0F14', '#2A3442', '#FF69B4', '#1A2332', '#FF69B4', '#40E0D0', '#DA70FF', '#40FFB0', '#FFE55C', '#FF69B4', '#40E0D0']
  },
  { 
    id: 'cyber-femme-light', 
    label: 'Cyber Femme Light', 
    colors: ['#F0F4F8', '#FFFFFF', '#ffffffe0', '#0A192F', '#0A192F', '#4A5B6B', '#8A9BA8', '#FFFFFF', '#E0E8F0', '#FF1493', '#E8F0F8', '#FF1493', '#00CED1', '#BF00FF', '#00FA9A', '#FFD700', '#FF1493', '#00CED1']
  },

  // ============================================================
  // 6. 科技大厂 (Tech Giants)
  // ============================================================
  
  // 6.1 Google
  { 
    id: 'google', 
    label: 'Google', 
    colors: ['#0D1117', '#161B22', '#161b22d8', '#FFFFFF', '#FFFFFF', '#8B949E', '#5A6570', '#0D1117', '#30363D', '#484F58', '#161B22', '#4285F4', '#34A853', '#EA4335', '#34A853', '#FBBC05', '#EA4335', '#4285F4']
  },
  { 
    id: 'google-light', 
    label: 'Google Light', 
    colors: ['#FFFFFF', '#F8F9FA', '#f8f9fae0', '#202124', '#202124', '#5F6368', '#9AA0A6', '#FFFFFF', '#DADCE0', '#BDC1C6', '#F1F3F4', '#1A73E8', '#188038', '#EA4335', '#188038', '#F9AB00', '#D93025', '#4285F4']
  },
  
  // 6.2 Tesla
  { 
    id: 'tesla', 
    label: 'Tesla', 
    colors: ['#0A0A0A', '#171717', '#171717d8', '#FFFFFF', '#FFFFFF', '#888888', '#555555', '#0A0A0A', '#333333', '#CC0000', '#171717', '#E82127', '#CC0000', '#FF4D4D', '#22C55E', '#F59E0B', '#E82127', '#3B82F6']
  },
  { 
    id: 'tesla-light', 
    label: 'Tesla Light', 
    colors: ['#FFFFFF', '#F4F4F4', '#f4f4f4e0', '#171A20', '#171A20', '#5C5E62', '#8E9094', '#FFFFFF', '#E0E0E0', '#D1D1D1', '#F0F0F0', '#CC0000', '#E82127', '#FF3333', '#16A34A', '#D97706', '#DC2626', '#2563EB']
  },
  
  // 6.3 Alibaba
  { 
    id: 'alibaba', 
    label: 'Alibaba', 
    colors: ['#0D1117', '#161B22', '#161b22d8', '#FFFFFF', '#FFFFFF', '#8B949E', '#5A6570', '#0D1117', '#FF6600', '#FF8533', '#161B22', '#FF6600', '#FF8533', '#FF9900', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6']
  },
  { 
    id: 'alibaba-light', 
    label: 'Alibaba Light', 
    colors: ['#FFFFFF', '#FFF5F0', '#fff5f0e0', '#1A1A1A', '#1A1A1A', '#666666', '#999999', '#FFFFFF', '#FFE4D6', '#FFD0C0', '#FFF0E8', '#FF6600', '#FF8533', '#FF9900', '#16A34A', '#D97706', '#DC2626', '#2563EB']
  },
  
  // 6.4 Huawei
  { 
    id: 'huawei', 
    label: 'Huawei', 
    colors: ['#0A0A0A', '#141414', '#141414d8', '#FFFFFF', '#FFFFFF', '#A0A0A0', '#707070', '#0A0A0A', '#CF0A2C', '#FF1A3D', '#141414', '#CF0A2C', '#FF1A3D', '#FA6400', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6']
  },
  { 
    id: 'huawei-light', 
    label: 'Huawei Light', 
    colors: ['#FFFFFF', '#F7F7F7', '#f7f7f7e0', '#232527', '#232527', '#666666', '#999999', '#FFFFFF', '#FFE4E8', '#FFC8D0', '#FFF0F2', '#CF0A2C', '#FF1A3D', '#FA6400', '#16A34A', '#D97706', '#DC2626', '#2563EB']
  },
  
  // 6.5 Apple
  { 
    id: 'apple', 
    label: 'Apple', 
    colors: ['#000000', '#1D1D1F', '#1d1d1fd8', '#F5F5F7', '#F5F5F7', '#86868B', '#636366', '#000000', '#424245', '#6E6E73', '#1D1D1F', '#0071E3', '#5E5CE6', '#34C759', '#34C759', '#FF9500', '#FF3B30', '#5AC8FA']
  },
  { 
    id: 'apple-light', 
    label: 'Apple Light', 
    colors: ['#FFFFFF', '#F5F5F7', '#f5f5f7e0', '#1D1D1F', '#1D1D1F', '#6E6E73', '#AEAEB2', '#FFFFFF', '#D2D2D7', '#C4C4C7', '#E8E8ED', '#0071E3', '#5E5CE6', '#34C759', '#16A34A', '#D97706', '#DC2626', '#0A84FF']
  },
  
  // 6.6 Microsoft
  { 
    id: 'microsoft', 
    label: 'Microsoft', 
    colors: ['#0D1117', '#161B22', '#161b22d8', '#FFFFFF', '#FFFFFF', '#8B949E', '#5A6570', '#0D1117', '#30363D', '#484F58', '#161B22', '#00A4EF', '#7FBA00', '#FFB900', '#7FBA00', '#FFB900', '#F25022', '#00A4EF']
  },
  { 
    id: 'microsoft-light', 
    label: 'Microsoft Light', 
    colors: ['#FFFFFF', '#F8F9FA', '#f8f9fae0', '#323130', '#323130', '#605E5C', '#A19F9D', '#FFFFFF', '#C8C6C4', '#B3B0AD', '#EDEBE9', '#0078D4', '#107C10', '#FFB900', '#107C10', '#D97706', '#D83B01', '#0078D4']
  },
  
  // 6.7 Meta
  { 
    id: 'meta', 
    label: 'Meta', 
    colors: ['#0F1115', '#1C1E21', '#1c1e21d8', '#FFFFFF', '#FFFFFF', '#8B949E', '#5A6570', '#0F1115', '#0668E1', '#1877F2', '#1C1E21', '#0668E1', '#0081FB', '#42B72A', '#42B72A', '#F7B928', '#FA383E', '#00A4FF']
  },
  { 
    id: 'meta-light', 
    label: 'Meta Light', 
    colors: ['#FFFFFF', '#F5F6F7', '#f5f6f7e0', '#1C1E21', '#1C1E21', '#606770', '#8A8D91', '#FFFFFF', '#DADDE1', '#CCD0D5', '#E4E6EB', '#1877F2', '#42B72A', '#0081FB', '#16A34A', '#D97706', '#DC2626', '#00A4FF']
  },
  
  // 6.8 Netflix
  { 
    id: 'netflix', 
    label: 'Netflix', 
    colors: ['#000000', '#141414', '#141414d8', '#FFFFFF', '#FFFFFF', '#B3B3B3', '#808080', '#000000', '#333333', '#E50914', '#141414', '#E50914', '#FF4D4D', '#B20710', '#22C55E', '#F59E0B', '#E50914', '#3B82F6']
  },
  { 
    id: 'netflix-light', 
    label: 'Netflix Light', 
    colors: ['#FFFFFF', '#F5F5F5', '#f5f5f5e0', '#000000', '#000000', '#757575', '#A3A3A3', '#FFFFFF', '#E0E0E0', '#D1D1D1', '#F0F0F0', '#E50914', '#FF4D4D', '#B20710', '#16A34A', '#D97706', '#DC2626', '#2563EB']
  },
  
  // 6.9 ByteDance
  { 
    id: 'bytedance', 
    label: 'ByteDance', 
    colors: ['#0A0A0A', '#1A1A1A', '#1a1a1ad8', '#FFFFFF', '#FFFFFF', '#A1A1AA', '#707070', '#0A0A0A', '#00F2EA', '#FF0050', '#1A1A1A', '#00F2EA', '#FF0050', '#00D2DB', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6']
  },
  { 
    id: 'bytedance-light', 
    label: 'ByteDance Light', 
    colors: ['#FFFFFF', '#F9FAFB', '#f9fafbe0', '#111827', '#111827', '#374151', '#9CA3AF', '#FFFFFF', '#CCFCFB', '#FFD6E5', '#F3F4F6', '#00C7C0', '#E6004C', '#00A8B0', '#16A34A', '#D97706', '#DC2626', '#2563EB']
  },
  
  // 6.10 Tencent
  { 
    id: 'tencent', 
    label: 'Tencent', 
    colors: ['#082F49', '#0C4A6E', '#0c4a6ed8', '#F0F9FF', '#F0F9FF', '#7DD3FC', '#38BDF8', '#082F49', '#0284C7', '#0369A1', '#0C4A6E', '#00A1D6', '#00C3FF', '#0052D9', '#22C55E', '#F59E0B', '#EF4444', '#3B82F6']
  },
  { 
    id: 'tencent-light', 
    label: 'Tencent Light', 
    colors: ['#FFFFFF', '#F0F9FF', '#f0f9ffe0', '#0C4A6E', '#0C4A6E', '#075985', '#38BDF8', '#FFFFFF', '#BAE6FD', '#7DD3FC', '#E0F2FE', '#00A1D6', '#00C3FF', '#0052D9', '#16A34A', '#D97706', '#DC2626', '#2563EB']
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
  ]
};

// ============================================
// STYLE PRESETS - Reusable style configurations
// Users can manually select/override these
// ============================================

export interface StylePreset {
  id: string;
  label: string;
  description: string;
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
    label: 'Corporate Formal',
    description: 'Authoritative, data-driven, minimalist. Best for executives and board presentations.',
    recommendedThemes: ['classic-navy', 'modern-graphite', 'finance-emerald', 'executive-gray', 'soe-navy'],
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
    label: 'Corporate Trust',
    description: 'Professional, trustworthy, conservative. Ideal for investors and financial presentations.',
    recommendedThemes: ['classic-navy-light', 'modern-graphite-light', 'finance-emerald-light', 'executive-gray-light', 'cream-minimal-light'],
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
    label: 'Government / Official',
    description: 'Traditional, authoritative, policy-focused. Suitable for government and SOE presentations.',
    recommendedThemes: ['soe-navy', 'government-red', 'executive-gray', 'executive-gray-light', 'soe-navy-light'],
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
    label: 'Technical / Engineering',
    description: 'Precise, detailed, architecture-focused. Perfect for engineering and technical teams.',
    recommendedThemes: ['cyber-electric', 'aurora-violet', 'neuron-orange', 'concrete-gray', 'paper-white'],
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
    label: 'Entrepreneur / Startup',
    description: 'Bold, energetic, opportunity-focused. Great for entrepreneurs and growth-stage companies.',
    recommendedThemes: ['cyber-electric', 'neuron-orange', 'aurora-violet', 'bauhaus', 'concrete-gray'],
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
    label: 'Product / UX',
    description: 'Clean, modern, user-centric. Ideal for product managers and UX presentations.',
    recommendedThemes: ['modern-graphite', 'paper-white-light', 'cream-minimal-light', 'morandi-light', 'concrete-gray-light'],
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
    label: 'Marketing / Sales',
    description: 'Persuasive, benefit-driven, attention-grabbing. Best for marketing and sales teams.',
    recommendedThemes: ['cyber-electric', 'neuron-orange', 'aurora-violet', 'bauhaus', 'vintage-film'],
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
    label: 'Consumer / B2C',
    description: 'Friendly, approachable, benefit-focused. Perfect for consumer-facing presentations.',
    recommendedThemes: ['paper-white-light', 'cream-minimal-light', 'morandi-light', 'modern-graphite-light', 'classic-navy-light'],
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
    label: 'Education / Academic',
    description: 'Scholarly, clear, foundational. Suitable for educational and academic presentations.',
    recommendedThemes: ['morandi', 'morandi-light', 'vintage-film', 'vintage-film-light', 'cream-minimal'],
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
    label: 'General / Universal',
    description: 'Balanced, accessible, versatile. Works for broad audiences and general purposes.',
    recommendedThemes: ['paper-white-light', 'concrete-gray-light', 'cream-minimal-light', 'morandi-light', 'bauhaus-light'],
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
  label: string;
  description: string;
  defaultStylePreset: string; // References STYLE_PRESETS id
  audiences: {
    id: string;
    label: string;
  }[];
}

export const AUDIENCE_CATEGORIES: AudienceCategory[] = [
  {
    id: 'corporate',
    label: 'Corporate Leadership',
    description: 'Executives, board members, and senior leadership',
    defaultStylePreset: 'corporate-formal',
    audiences: [
      { id: 'c-level', label: 'C-Level / Executives' },
      { id: 'board', label: 'Board of Directors' },
      { id: 'middle-mgmt', label: 'Middle Management' },
      { id: 'cross-functional', label: 'Cross-functional Teams' },
    ],
  },
  {
    id: 'investors',
    label: 'Investors & Finance',
    description: 'Investors, VCs, PE firms, and financial stakeholders',
    defaultStylePreset: 'corporate-trust',
    audiences: [
      { id: 'vc-pe', label: 'VC / PE Investors' },
      { id: 'angel', label: 'Angel Investors' },
      { id: 'institutional', label: 'Institutional Investors' },
      { id: 'ipo-analysts', label: 'IPO Analysts' },
    ],
  },
  {
    id: 'government',
    label: 'Government & Public Sector',
    description: 'Government officials, SOE leaders, and public sector',
    defaultStylePreset: 'government-official',
    audiences: [
      { id: 'officials', label: 'Government Officials' },
      { id: 'soe-leaders', label: 'SOE Leaders' },
      { id: 'policy-makers', label: 'Policy Makers' },
      { id: 'regulators', label: 'Regulators' },
    ],
  },
  {
    id: 'technical',
    label: 'Technical & Engineering',
    description: 'Engineers, developers, architects, and technical teams',
    defaultStylePreset: 'technical',
    audiences: [
      { id: 'engineers', label: 'Engineers / Developers' },
      { id: 'architects', label: 'System Architects' },
      { id: 'rd-team', label: 'R&D Team' },
      { id: 'devops', label: 'DevOps / SRE' },
    ],
  },
  {
    id: 'business',
    label: 'Business & Entrepreneurship',
    description: 'Entrepreneurs, business owners, and commercial teams',
    defaultStylePreset: 'entrepreneur',
    audiences: [
      { id: 'founders', label: 'Founders / Entrepreneurs' },
      { id: 'sme-owners', label: 'SME Owners' },
      { id: 'b2b-clients', label: 'B2B Clients / Partners' },
      { id: 'franchise', label: 'Franchise Partners' },
    ],
  },
  {
    id: 'product',
    label: 'Product & Design',
    description: 'Product managers, designers, and UX professionals',
    defaultStylePreset: 'product-ux',
    audiences: [
      { id: 'product-managers', label: 'Product Managers' },
      { id: 'ux-designers', label: 'UX / UI Designers' },
      { id: 'design-team', label: 'Design Team' },
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing & Sales',
    description: 'Marketing, sales, and growth teams',
    defaultStylePreset: 'marketing-sales',
    audiences: [
      { id: 'marketing-team', label: 'Marketing Team' },
      { id: 'sales-team', label: 'Sales Team' },
      { id: 'growth-team', label: 'Growth Team' },
      { id: 'brand-team', label: 'Brand Team' },
    ],
  },
  {
    id: 'operations',
    label: 'Operations & Support',
    description: 'Operations, HR, and support functions',
    defaultStylePreset: 'general',
    audiences: [
      { id: 'operations', label: 'Operations Team' },
      { id: 'hr', label: 'HR / Talent' },
      { id: 'customer-success', label: 'Customer Success' },
      { id: 'support', label: 'Support Team' },
    ],
  },
  {
    id: 'consumer',
    label: 'Consumer & Public',
    description: 'End consumers and general public audiences',
    defaultStylePreset: 'consumer',
    audiences: [
      { id: 'end-consumers', label: 'End Consumers' },
      { id: 'general-public', label: 'General Public' },
      { id: 'community', label: 'Community / Users' },
    ],
  },
  {
    id: 'education',
    label: 'Education & Research',
    description: 'Students, educators, researchers, and academics',
    defaultStylePreset: 'education',
    audiences: [
      { id: 'students', label: 'Students' },
      { id: 'academics', label: 'Academics / Researchers' },
      { id: 'educators', label: 'Educators / Trainers' },
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
      const audLabel = aud.label.toLowerCase();
      
      if (normalized.includes(aud.id.toLowerCase()) ||
          normalized.includes(audLabel) ||
          audLabel.includes(normalized)) {
        return STYLE_PRESETS.find(p => p.id === category.defaultStylePreset);
      }
    }
    
    // Check category label match
    if (normalized.includes(category.label.toLowerCase())) {
      return STYLE_PRESETS.find(p => p.id === category.defaultStylePreset);
    }
  }
  
  // Fallback to keyword matching
  if (normalized.includes('executive') || normalized.includes('c-level') || normalized.includes('ceo') || normalized.includes('cto') || normalized.includes('cfo') || normalized.includes('board')) 
    return STYLE_PRESETS.find(p => p.id === 'corporate-formal');
  if (normalized.includes('investor') || normalized.includes('vc') || normalized.includes('pe'))
    return STYLE_PRESETS.find(p => p.id === 'corporate-trust');
  if (normalized.includes('engineer') || normalized.includes('technical') || normalized.includes('developer') || normalized.includes('tech'))
    return STYLE_PRESETS.find(p => p.id === 'technical');
  if (normalized.includes('government') || normalized.includes('official'))
    return STYLE_PRESETS.find(p => p.id === 'government-official');
  if (normalized.includes('soe') || normalized.includes('state-owned'))
    return STYLE_PRESETS.find(p => p.id === 'government-official');
  if (normalized.includes('entrepreneur') || normalized.includes('founder') || normalized.includes('business owner'))
    return STYLE_PRESETS.find(p => p.id === 'entrepreneur');
  if (normalized.includes('product') || normalized.includes('pm '))
    return STYLE_PRESETS.find(p => p.id === 'product-ux');
  if (normalized.includes('market') || normalized.includes('sales'))
    return STYLE_PRESETS.find(p => p.id === 'marketing-sales');
  if (normalized.includes('consumer') || normalized.includes('customer'))
    return STYLE_PRESETS.find(p => p.id === 'consumer');
  if (normalized.includes('student') || normalized.includes('academic') || normalized.includes('education'))
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
  label: string;
  description: string;
  purposes: {
    id: string;
    label: string;
    styleAdjustment?: Partial<StylePreset>; // Override certain style aspects
  }[];
}

export const PURPOSE_CATEGORIES: PurposeCategory[] = [
  {
    id: 'business-growth',
    label: 'Business Growth',
    description: 'Presentations focused on business development and growth',
    purposes: [
      { id: 'investment-pitch', label: 'Investment Pitch' },
      { id: 'sales-pitch', label: 'Sales / Client Pitch' },
      { id: 'partnership', label: 'Partnership Proposal' },
      { id: 'market-expansion', label: 'Market Expansion' },
    ],
  },
  {
    id: 'product-innovation',
    label: 'Product & Innovation',
    description: 'Product launches, updates, and innovation showcases',
    purposes: [
      { id: 'product-launch', label: 'Product Launch' },
      { id: 'product-update', label: 'Product Update / Iteration' },
      { id: 'tech-demo', label: 'Technical Demonstration' },
      { id: 'innovation-showcase', label: 'Innovation Showcase' },
    ],
  },
  {
    id: 'reporting-review',
    label: 'Reporting & Review',
    description: 'Status updates, reviews, and performance reports',
    purposes: [
      { id: 'status-report', label: 'Status / Progress Report' },
      { id: 'performance-review', label: 'Performance Review' },
      { id: 'year-end-summary', label: 'Year-end Summary' },
      { id: 'audit-report', label: 'Audit / Compliance Report' },
    ],
  },
  {
    id: 'strategy-planning',
    label: 'Strategy & Planning',
    description: 'Strategic planning, roadmaps, and vision presentations',
    purposes: [
      { id: 'strategic-planning', label: 'Strategic Planning' },
      { id: 'roadmap', label: 'Roadmap Presentation' },
      { id: 'vision-keynote', label: 'Vision / Keynote' },
      { id: 'transformation', label: 'Transformation Initiative' },
    ],
  },
  {
    id: 'education-training',
    label: 'Education & Training',
    description: 'Training sessions, workshops, and educational content',
    purposes: [
      { id: 'training', label: 'Training Session' },
      { id: 'workshop', label: 'Workshop / Seminar' },
      { id: 'knowledge-sharing', label: 'Knowledge Sharing' },
      { id: 'onboarding', label: 'Onboarding / Orientation' },
    ],
  },
  {
    id: 'communication',
    label: 'Communication & Engagement',
    description: 'Internal communications, announcements, and team building',
    purposes: [
      { id: 'announcement', label: 'Announcement / News' },
      { id: 'team-building', label: 'Team Building / Motivation' },
      { id: 'change-management', label: 'Change Management' },
      { id: 'crisis-communication', label: 'Crisis Communication' },
    ],
  },
];

// Purpose-driven layout recommendations
export interface PurposeLayoutGuide {
  purpose: string;
  keywords?: string[];
  layouts: string[];
  contentFocus: string;
}

export const PURPOSE_LAYOUT_GUIDES: PurposeLayoutGuide[] = [
  { purpose: 'pitch', keywords: ['pitch', 'investment', 'sales'], layouts: ['Data', 'Compare', 'Grid', 'Standard'], contentFocus: 'Value proposition, differentiation, traction' },
  { purpose: 'report', keywords: ['report', 'status', 'progress', 'audit'], layouts: ['Data', 'Timeline', 'Standard', 'Grid'], contentFocus: 'Key metrics, status, trends' },
  { purpose: 'proposal', keywords: ['proposal', 'partnership', 'plan'], layouts: ['Compare', 'Timeline', 'Standard', 'Grid'], contentFocus: 'Problem, solution, plan, ROI' },
  { purpose: 'review', keywords: ['review', 'performance', 'summary'], layouts: ['Timeline', 'Data', 'Standard'], contentFocus: 'Achievements, metrics, learnings' },
  { purpose: 'training', keywords: ['training', 'workshop', 'onboarding'], layouts: ['Grid', 'Standard', 'Image-Heavy', 'Quote'], contentFocus: 'Concepts, examples, exercises' },
  { purpose: 'roadshow', keywords: ['roadshow', 'vision', 'keynote'], layouts: ['Data', 'Compare', 'Center', 'Standard'], contentFocus: 'Vision, opportunity, team, traction' },
  { purpose: 'launch', keywords: ['launch', 'update', 'innovation'], layouts: ['Grid', 'Image-Heavy', 'Data', 'Standard'], contentFocus: 'Features, benefits, demo, availability' },
];

// ============================================
// STYLE RESOLUTION - Audience + Purpose determine style
// ============================================

export interface StyleRecommendation {
  presetId: string;
  reason: string;
}

// Matrix: Audience Category + Purpose Category -> Style Preset
const AUDIENCE_PURPOSE_STYLE_MATRIX: Record<string, Record<string, StyleRecommendation>> = {
  // Corporate Leadership
  'corporate': {
    'business-growth': { presetId: 'corporate-formal', reason: 'Executive authority for growth initiatives' },
    'product-innovation': { presetId: 'product-ux', reason: 'Product-focused executive presentation' },
    'reporting-review': { presetId: 'corporate-formal', reason: 'Formal reporting to leadership' },
    'strategy-planning': { presetId: 'corporate-formal', reason: 'Strategic vision with authority' },
    'education-training': { presetId: 'education', reason: 'Leadership development content' },
    'communication': { presetId: 'corporate-trust', reason: 'Trust-building internal communication' },
  },
  // Investors & Finance
  'investors': {
    'business-growth': { presetId: 'corporate-trust', reason: 'Trust-focused investor presentation' },
    'product-innovation': { presetId: 'corporate-trust', reason: 'Product potential with financial rigor' },
    'reporting-review': { presetId: 'corporate-trust', reason: 'Financial reporting with credibility' },
    'strategy-planning': { presetId: 'corporate-trust', reason: 'Long-term value proposition' },
    'education-training': { presetId: 'education', reason: 'Investor education materials' },
    'communication': { presetId: 'corporate-trust', reason: 'Transparent stakeholder communication' },
  },
  // Government & Public Sector
  'government': {
    'business-growth': { presetId: 'government-official', reason: 'Official procurement or partnership' },
    'product-innovation': { presetId: 'government-official', reason: 'Public sector innovation showcase' },
    'reporting-review': { presetId: 'government-official', reason: 'Official reporting to authorities' },
    'strategy-planning': { presetId: 'government-official', reason: 'Policy-aligned strategic planning' },
    'education-training': { presetId: 'education', reason: 'Government training programs' },
    'communication': { presetId: 'government-official', reason: 'Official announcements and updates' },
  },
  // Technical & Engineering
  'technical': {
    'business-growth': { presetId: 'technical', reason: 'Technical solution for business growth' },
    'product-innovation': { presetId: 'technical', reason: 'Technical innovation deep-dive' },
    'reporting-review': { presetId: 'technical', reason: 'Technical status and metrics review' },
    'strategy-planning': { presetId: 'technical', reason: 'Technical architecture and roadmap' },
    'education-training': { presetId: 'technical', reason: 'Technical skills training' },
    'communication': { presetId: 'technical', reason: 'Technical team updates' },
  },
  // Business & Entrepreneurship
  'business': {
    'business-growth': { presetId: 'entrepreneur', reason: 'Entrepreneurial growth mindset' },
    'product-innovation': { presetId: 'entrepreneur', reason: 'Innovation with business agility' },
    'reporting-review': { presetId: 'corporate-trust', reason: 'Business performance review' },
    'strategy-planning': { presetId: 'entrepreneur', reason: 'Agile strategic planning' },
    'education-training': { presetId: 'education', reason: 'Entrepreneurship training' },
    'communication': { presetId: 'entrepreneur', reason: 'Dynamic team communication' },
  },
  // Product & Design
  'product': {
    'business-growth': { presetId: 'product-ux', reason: 'Product-led growth presentation' },
    'product-innovation': { presetId: 'product-ux', reason: 'Product innovation showcase' },
    'reporting-review': { presetId: 'product-ux', reason: 'Product metrics and user insights' },
    'strategy-planning': { presetId: 'product-ux', reason: 'Product strategy and vision' },
    'education-training': { presetId: 'product-ux', reason: 'Product management training' },
    'communication': { presetId: 'product-ux', reason: 'Product team alignment' },
  },
  // Marketing & Sales
  'marketing': {
    'business-growth': { presetId: 'marketing-sales', reason: 'High-energy growth presentation' },
    'product-innovation': { presetId: 'marketing-sales', reason: 'Product marketing launch' },
    'reporting-review': { presetId: 'marketing-sales', reason: 'Marketing performance metrics' },
    'strategy-planning': { presetId: 'marketing-sales', reason: 'Marketing strategy vision' },
    'education-training': { presetId: 'marketing-sales', reason: 'Sales training and enablement' },
    'communication': { presetId: 'marketing-sales', reason: 'Brand and campaign updates' },
  },
  // Operations & Support
  'operations': {
    'business-growth': { presetId: 'general', reason: 'Operational efficiency for growth' },
    'product-innovation': { presetId: 'general', reason: 'Process innovation showcase' },
    'reporting-review': { presetId: 'general', reason: 'Operations metrics review' },
    'strategy-planning': { presetId: 'general', reason: 'Operations strategic planning' },
    'education-training': { presetId: 'education', reason: 'Operations training programs' },
    'communication': { presetId: 'general', reason: 'Operational updates and alerts' },
  },
  // Consumer & Public
  'consumer': {
    'business-growth': { presetId: 'consumer', reason: 'Consumer-friendly growth story' },
    'product-innovation': { presetId: 'consumer', reason: 'Consumer product showcase' },
    'reporting-review': { presetId: 'education', reason: 'Transparent public reporting' },
    'strategy-planning': { presetId: 'consumer', reason: 'Consumer vision and values' },
    'education-training': { presetId: 'education', reason: 'Consumer education content' },
    'communication': { presetId: 'consumer', reason: 'Brand-consumer communication' },
  },
  // Education & Research
  'education': {
    'business-growth': { presetId: 'education', reason: 'Educational business development' },
    'product-innovation': { presetId: 'education', reason: 'EdTech innovation showcase' },
    'reporting-review': { presetId: 'education', reason: 'Research findings and reports' },
    'strategy-planning': { presetId: 'education', reason: 'Educational strategy planning' },
    'education-training': { presetId: 'education', reason: 'Academic course content' },
    'communication': { presetId: 'education', reason: 'Academic community updates' },
  },
};

// Helper function to resolve style based on audience and purpose categories
export const resolveStyleRecommendation = (
  audienceCategoryId: string,
  purposeCategoryId: string
): StyleRecommendation => {
  const matrix = AUDIENCE_PURPOSE_STYLE_MATRIX[audienceCategoryId];
  if (matrix && matrix[purposeCategoryId]) {
    return matrix[purposeCategoryId];
  }
  
  // Fallback to audience default
  const category = AUDIENCE_CATEGORIES.find(c => c.id === audienceCategoryId);
  return {
    presetId: category?.defaultStylePreset || 'general',
    reason: 'Based on audience type'
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
    analyzingContent: "Analyzing content...",
    generatingOutline: "Generating outline...",
    presentationReady: "Presentation Ready",
    generateNotes: "Generate Notes",
    regenerateNotes: "Regenerate Notes",
    preview: "Preview",
    downloadHtml: "Download HTML",
    otherFormats: "Other Formats",
    exportOutline: "Outline (Markdown)",
    exportNotes: "Speaker Notes (Txt)",
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
    livePreview: "Palette Preview",
    // 18-Color System Labels
    cBg: "BG",
    cBgSoft: "SOFT",
    cBgGlass: "GLASS",
    cBgInvert: "INV",
    cText: "TXT",
    cTextMuted: "MUTED",
    cTextFaint: "FAINT",
    cTextInvert: "TINV",
    cBorder: "BDR",
    cBorderStrong: "BDR+",
    cDivider: "DIV",
    cPrimary: "PRI",
    cSecondary: "SEC",
    cAccent: "ACC",
    cSuccess: "OK",
    cWarning: "WARN",
    cDanger: "ERR",
    cInfo: "INFO",

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
  }
};
