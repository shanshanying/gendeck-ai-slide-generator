
import { SlideData, PresentationConfig } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper for API calls
async function api<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Database Deck types
export interface DatabaseDeck {
  id: string;
  topic: string;
  audience: string;
  purpose: string;
  color_palette: string;
  slide_count: number;
  total_cost: number;
  full_html?: string;
  document_content?: string;
  outline_provider?: string;
  outline_model?: string;
  outline_base_url?: string;
  slides_provider?: string;
  slides_model?: string;
  slides_base_url?: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseDeckWithSlides extends DatabaseDeck {
  slides: DatabaseSlide[];
}

export interface DatabaseSlide {
  id: string;
  deck_id: string;
  slide_index: number;
  title: string;
  content_points: string[];
  html_content: string;
  notes: string;
  layout_suggestion: string;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface SlideHistoryItem {
  id: string;
  slide_id: string;
  slide_index: number;
  title: string;
  content_points: string[];
  html_content: string;
  notes: string;
  layout_suggestion: string;
  version: number;
  saved_at: string;
}

// Deck history (full deck versions)
export interface DeckHistoryItem {
  id: string;
  deck_id: string;
  topic: string;
  full_html?: string;
  outline?: any;
  color_palette?: string;
  version: number;
  saved_at: string;
}

// Convert database slide to frontend SlideData
export function dbSlideToSlideData(dbSlide: DatabaseSlide): SlideData {
  return {
    id: dbSlide.id,
    title: dbSlide.title,
    contentPoints: dbSlide.content_points || [],
    htmlContent: dbSlide.html_content,
    notes: dbSlide.notes,
    layoutSuggestion: dbSlide.layout_suggestion,
    isRegenerating: false,
    cost: 0,
  };
}

// Convert frontend data to database format
export function slideDataToDbSlide(slide: SlideData, index: number) {
  return {
    slide_index: index,
    title: slide.title,
    content_points: slide.contentPoints,
    html_content: slide.htmlContent,
    notes: slide.notes || '',
    layout_suggestion: slide.layoutSuggestion || 'Standard',
  };
}

// Deck API
export const deckApi = {
  // List all decks
  list: (limit = 50, offset = 0): Promise<{ success: boolean; data: DatabaseDeck[] }> =>
    api(`/decks?limit=${limit}&offset=${offset}`),

  // Get single deck
  get: (id: string): Promise<{ success: boolean; data: DatabaseDeckWithSlides }> =>
    api(`/decks/${id}`),

  // Create new deck
  create: (deck: {
    topic: string;
    audience?: string;
    purpose?: string;
    colorPalette?: string;
    slides: SlideData[];
    totalCost?: number;
    fullHtml?: string;
    documentContent?: string;
    outlineProvider?: string;
    outlineModel?: string;
    outlineBaseUrl?: string;
    slidesProvider?: string;
    slidesModel?: string;
    slidesBaseUrl?: string;
  }): Promise<{ success: boolean; data: { id: string } }> =>
    api('/decks', {
      method: 'POST',
      body: JSON.stringify({
        topic: deck.topic,
        audience: deck.audience || '',
        purpose: deck.purpose || '',
        colorPalette: deck.colorPalette || '',
        slides: deck.slides.map((s, i) => slideDataToDbSlide(s, i)),
        totalCost: deck.totalCost || 0,
        fullHtml: deck.fullHtml,
        documentContent: deck.documentContent,
        outlineProvider: deck.outlineProvider,
        outlineModel: deck.outlineModel,
        outlineBaseUrl: deck.outlineBaseUrl,
        slidesProvider: deck.slidesProvider,
        slidesModel: deck.slidesModel,
        slidesBaseUrl: deck.slidesBaseUrl,
      }),
    }),

  // Update deck
  update: (id: string, updates: Partial<DatabaseDeck>): Promise<{ success: boolean }> =>
    api(`/decks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  // Delete deck
  delete: (id: string): Promise<{ success: boolean }> =>
    api(`/decks/${id}`, { method: 'DELETE' }),

  // Search decks
  search: (query: string, limit = 20): Promise<{ success: boolean; data: DatabaseDeck[] }> =>
    api(`/decks/search?q=${encodeURIComponent(query)}&limit=${limit}`),

  // Download full HTML
  downloadHtml: (id: string): Promise<Blob> =>
    fetch(`${API_BASE_URL}/decks/${id}/html`).then(r => r.blob()),

  // Deck History
  saveVersion: (deckId: string, version: {
    topic: string;
    fullHtml?: string;
    outline?: any;
    colorPalette?: string;
  }): Promise<{ success: boolean; data: DeckHistoryItem }> =>
    api(`/decks/${deckId}/history`, {
      method: 'POST',
      body: JSON.stringify(version),
    }),

  getVersions: (deckId: string, limit = 50): Promise<{ success: boolean; data: DeckHistoryItem[] }> =>
    api(`/decks/${deckId}/history?limit=${limit}`),

  getVersion: (historyId: string): Promise<{ success: boolean; data: DeckHistoryItem }> =>
    api(`/decks/history/${historyId}`),
};

// Slide API
export const slideApi = {
  // Get slide history
  getHistory: (slideId: string, limit = 50): Promise<{ success: boolean; data: SlideHistoryItem[] }> =>
    api(`/slides/${slideId}/history?limit=${limit}`),

  // Get specific history version
  getHistoryVersion: (historyId: string): Promise<{ success: boolean; data: SlideHistoryItem }> =>
    api(`/slides/history/${historyId}`),

  // Restore to history version
  restore: (slideId: string, historyId: string): Promise<{ success: boolean; data: DatabaseSlide }> =>
    api(`/slides/${slideId}/restore`, {
      method: 'POST',
      body: JSON.stringify({ historyId }),
    }),

  // Update slide
  update: (slideId: string, updates: Partial<DatabaseSlide>): Promise<{ success: boolean; data: DatabaseSlide }> =>
    api(`/slides/${slideId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    }),

  // Save single slide (for auto-save)
  save: (deckId: string, slideIndex: number, slide: SlideData): Promise<{ success: boolean; data: DatabaseSlide }> =>
    api(`/slides/deck/${deckId}/slide/${slideIndex}`, {
      method: 'POST',
      body: JSON.stringify(slideDataToDbSlide(slide, slideIndex)),
    }),

  // Get all slide history for a deck
  getDeckHistory: (deckId: string, limitPerSlide = 10): Promise<{ success: boolean; data: Record<number, SlideHistoryItem[]> }> =>
    api(`/slides/deck/${deckId}/history?limitPerSlide=${limitPerSlide}`),
};

// Health check
export const healthCheck = (): Promise<{ status: string; timestamp: string }> =>
  api('/health');
