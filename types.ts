
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
}

export type ApiProvider = 'google' | 'openai' | 'deepseek' | 'anthropic' | 'moonshot';

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
  extraPrompt?: string;
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
