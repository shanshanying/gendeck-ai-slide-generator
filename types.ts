
export enum GenerationStatus {
  IDLE = 'IDLE',
  GENERATING_OUTLINE = 'GENERATING_OUTLINE',
  REVIEWING_OUTLINE = 'REVIEWING_OUTLINE',
  GENERATING_SLIDES = 'GENERATING_SLIDES',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export interface SlideData {
  id: string;
  title: string;
  contentPoints: string[];
  htmlContent: string | null;
  notes?: string;
  layoutSuggestion?: string;
  isRegenerating: boolean;
  cost?: number;
  hasError?: boolean;
  errorMessage?: string;
}

export type ApiProvider = 'google' | 'openai' | 'deepseek' | 'anthropic' | 'moonshot' | 'custom';

export interface ModelSelection {
  provider: ApiProvider;
  modelId: string;
  baseUrl?: string;
}

export interface ApiSettings {
  // Map of provider IDs to their API keys
  apiKeys: Partial<Record<ApiProvider, string>>;
  
  // Single model for all generation tasks (outline and slides)
  model: ModelSelection;
}

export interface PresentationConfig {
  topic: string;
  audience: string;
  purpose: string;
  slideCount: number;
  apiSettings: ApiSettings;
  documentContent: string;
  strictMode?: boolean;
  stylePresetId?: string; // User-selected style preset (overrides audience default)
}

export interface OutlineItem {
  title: string;
  contentPoints: string[];
  layoutSuggestion: string;
  notes: string;
}

export interface ServiceResponse<T> {
  data: T;
  cost: number;
}

export type Language = 'en' | 'zh';

export interface LocalProjectFile {
  version: number;
  savedAt: string;
  status: GenerationStatus;
  config: PresentationConfig | null;
  colorPalette: string;
  slides: SlideData[];
  currentSlideId: string | null;
  totalCost: number;
}

// Audience-Driven Style Preferences
export interface StylePreferences {
  // Visual theme
  recommendedThemeId: string;
  // Typography guidance
  typography: {
    fontFamily: string;
    fontCharacteristics: string;
    titleCase: 'sentence' | 'title' | 'uppercase' | 'lowercase';
  };
  // Layout guidance
  layoutPreferences: {
    primary: string[];
    avoid: string[];
  };
  // Content style
  contentStyle: {
    tone: string;
    formality: 'formal' | 'semi-formal' | 'casual';
    bulletStyle: 'fragments' | 'sentences' | 'mixed';
    emphasis: string[];
  };
  // Visual density
  visualDensity: 'minimal' | 'balanced' | 'dense';
  // Data visualization preference
  dataVisualization: 'heavy' | 'moderate' | 'minimal';
}
