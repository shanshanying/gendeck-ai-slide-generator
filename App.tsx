
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PresentationConfig, SlideData, OutlineItem, GenerationStatus, Language, ApiSettings, ApiProvider } from './types';
import type { Theme } from './styles/theme';
import { useThemeContext } from './contexts/ThemeContext';
import { cls } from './styles/themeUtils';
import { getThemeClasses, cx } from './styles/theme';
import InputForm from './components/InputForm';
import Sidebar from './components/Sidebar';
import SlidePreview from './components/SlidePreview';
import OutlineEditor from './components/OutlineEditor';
import { generateOutline, generateSlideHtml, generateSpeakerNotes } from './services/geminiService';
import { ImportResult, parseExportedHtml } from './services/importService';
import { deckApi, checkBackendAvailable, DatabaseDeckWithSlides, dbSlideToSlideData } from './services/databaseService';
import DeckBrowser from './components/DeckBrowser';
import SlideHistory from './components/SlideHistory';
import { Download, DollarSign, Eye, FileText, FileJson, ChevronDown, MessageSquareText, Loader2, Languages, Play, Pause, XCircle, Printer, Plus, Sun, Moon, Database, Save, History, CheckCircle, AlertCircle } from 'lucide-react';
import { TRANSLATIONS, COLOR_THEMES, PROVIDERS } from './constants';

const generateId = () => Math.random().toString(36).substr(2, 9);

// Auto-save data structure
interface AutosaveData {
  status: GenerationStatus;
  config: PresentationConfig | null;
  colorPalette: string;
  slides: SlideData[];
  currentSlideId: string | null;
  totalCost: number;
  timestamp: number;
}

const AUTOSAVE_KEY = 'gendeck_autosave';

// Helper to get API keys from localStorage
const getStoredApiKeys = (): Partial<Record<ApiProvider, string>> => {
  try {
    const saved = localStorage.getItem('gendeck_api_keys');
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
};

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('gendeck_lang');
    return (saved === 'en' || saved === 'zh') ? saved : 'en';
  });

  // Restore from autosave on initial load
  const getInitialState = (): Partial<AutosaveData> => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        const data: AutosaveData = JSON.parse(saved);
        // Only restore if autosave is less than 7 days old
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - data.timestamp < oneWeek) {
          return data;
        }
      }
    } catch {
      // Ignore parse errors
    }
    return {};
  };

  const initialState = getInitialState();

  const { theme, toggleTheme, isDark } = useThemeContext();
  const th = getThemeClasses(theme as Theme);

  const [status, setStatus] = useState<GenerationStatus>(initialState.status || GenerationStatus.IDLE);
  const [config, setConfig] = useState<PresentationConfig | null>(initialState.config || null);
  const [colorPalette, setColorPalette] = useState<string>(initialState.colorPalette || '');
  const [slides, setSlides] = useState<SlideData[]>(initialState.slides || []);
  const [currentSlideId, setCurrentSlideId] = useState<string | null>(initialState.currentSlideId || null);
  const [totalCost, setTotalCost] = useState(initialState.totalCost || 0);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNewDeckConfirm, setShowNewDeckConfirm] = useState(false);

  // Database-related state
  const [showDeckBrowser, setShowDeckBrowser] = useState(false);
  const [showSlideHistory, setShowSlideHistory] = useState(false);
  const [currentDbDeckId, setCurrentDbDeckId] = useState<string | null>(null);
  const [isSavingToDb, setIsSavingToDb] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [hasDatabase, setHasDatabase] = useState(true);
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null);

  // New State for Pause/Resume
  const [isPaused, setIsPaused] = useState(false);

  // Refs for process control
  const shouldStopRef = React.useRef(false);
  const processingTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref for aborting outline generation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper function for translations
  const t = (key: keyof typeof TRANSLATIONS['en']) => TRANSLATIONS[language][key];

  useEffect(() => {
    localStorage.setItem('gendeck_lang', language);
  }, [language]);

  // Check backend availability on mount so Browse/Save/History can be disabled when backend is down
  useEffect(() => {
    let cancelled = false;
    if (!hasDatabase) {
      console.log('[Gendeck] Database: disabled (no API URL configured)');
      return;
    }
    console.log('[Gendeck] Database: checking backend...');
    checkBackendAvailable().then((ok) => {
      if (!cancelled) {
        setBackendAvailable(ok);
        console.log('[Gendeck] Database service:', ok ? 'available' : 'unavailable');
      }
    });
    return () => { cancelled = true; };
  }, []);

  // Auto-save state to localStorage whenever important state changes
  useEffect(() => {
    // Only autosave if we have actual content (not in IDLE state with empty slides)
    if (status !== GenerationStatus.IDLE || slides.length > 0) {
      const data: AutosaveData = {
        status,
        config,
        colorPalette,
        slides,
        currentSlideId,
        totalCost,
        timestamp: Date.now(),
      };
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(data));
    }
  }, [status, config, colorPalette, slides, currentSlideId, totalCost]);



  // Ensure currentSlideId is valid when slides change
  useEffect(() => {
    if (slides.length > 0) {
       // If no selection, select first
       if (!currentSlideId) {
         setCurrentSlideId(slides[0].id);
       }
       // If selection is invalid (e.g. deleted), select first
       else if (!slides.find(s => s.id === currentSlideId)) {
         setCurrentSlideId(slides[0].id);
       }
    } else {
       setCurrentSlideId(null);
    }
  }, [slides.length, currentSlideId]);

  // Function to process the queue of slides that need HTML generation
  const processSlideQueue = useCallback(async (currentSlides: SlideData[], currentConfig: PresentationConfig, palette: string) => {
    // Check if stopped
    if (shouldStopRef.current) return;

    // Find first slide without HTML and not currently regenerating
    const pendingSlideIndex = currentSlides.findIndex(s => !s.htmlContent && !s.isRegenerating);

    if (pendingSlideIndex === -1) {
      setStatus(GenerationStatus.COMPLETE);
      return;
    }

    const slideToProcess = currentSlides[pendingSlideIndex];

    // Optimistic update to show regeneration state
    setSlides(prev => prev.map(s => s.id === slideToProcess.id ? { ...s, isRegenerating: true } : s));

    try {
      const outlineItem: OutlineItem = {
        title: slideToProcess.title,
        contentPoints: slideToProcess.contentPoints,
        notes: slideToProcess.notes || "",
        layoutSuggestion: slideToProcess.layoutSuggestion || ""
      };

      const result = await generateSlideHtml(
        outlineItem,
        palette,
        currentConfig.audience,
        currentConfig.apiSettings,
        currentConfig.topic,
        pendingSlideIndex + 1,
        currentSlides.length
      );

      setTotalCost(prev => prev + result.cost);

      setSlides(prev => {
        const next = prev.map(s => s.id === slideToProcess.id ? { ...s, htmlContent: result.data, isRegenerating: false } : s);

        // Check stop ref again before scheduling next
        if (!shouldStopRef.current) {
            processingTimeoutRef.current = setTimeout(() => processSlideQueue(next, currentConfig, palette), 100);
        }
        return next;
      });
    } catch (e) {
      // Failed to generate slide - will retry automatically
      setSlides(prev => {
         const next = prev.map(s => s.id === slideToProcess.id ? { ...s, isRegenerating: false } : s);
         // Even on error, try to continue if not stopped
         if (!shouldStopRef.current) {
            processingTimeoutRef.current = setTimeout(() => processSlideQueue(next, currentConfig, palette), 100);
         }
         return next;
      });
    }
  }, []);

  const handlePauseGeneration = () => {
    shouldStopRef.current = true;
    setIsPaused(true);
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }
  };

  const handleResumeGeneration = () => {
    shouldStopRef.current = false;
    setIsPaused(false);
    if (config) {
      processSlideQueue(slides, config, colorPalette);
    }
  };

  const handleCancelGeneration = () => {
    shouldStopRef.current = true;
    setIsPaused(false);
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
    }
    // Return to outline view to allow editing or restarting
    setStatus(GenerationStatus.REVIEWING_OUTLINE);
  };

  // Show confirmation dialog for new deck
  const handleNewDeck = () => {
    setShowNewDeckConfirm(true);
  };

  // Handle importing a previously generated HTML deck
  const handleImportHtml = (result: ImportResult) => {
    // Set the topic and config
    const importedConfig: PresentationConfig = {
      topic: result.topic,
      audience: result.config.audience || '',
      purpose: result.config.purpose || '',
      slideCount: result.slides.length,
      apiSettings: config?.apiSettings || {
        apiKeys: {},
        outline: { provider: 'google', modelId: 'gemini-3-flash-preview' },
        slides: { provider: 'google', modelId: 'gemini-3-flash-preview' },
      },
      documentContent: result.config.documentContent || '',
    };

    setConfig(importedConfig);
    setSlides(result.slides);

    // Try to match the color palette to a theme
    const paletteColors = result.colorPalette.split(',');
    let matchedTheme = result.colorPalette;

    // Find matching theme by comparing colors
    for (const theme of COLOR_THEMES) {
      const themeColors = theme.colors;
      // Simple heuristic: check if the first color (background) matches approximately
      if (paletteColors[0] && themeColors[0] &&
          areColorsSimilar(paletteColors[0], themeColors[0])) {
        matchedTheme = theme.colors.join(',');
        break;
      }
    }

    setColorPalette(matchedTheme);
    setTotalCost(0);

    // Go directly to COMPLETE status since we already have HTML
    setStatus(GenerationStatus.COMPLETE);

    // Save topic to localStorage
    localStorage.setItem('gendeck_topic', result.topic);
  };

  // Helper to check if two colors are similar (basic hex comparison)
  const areColorsSimilar = (color1: string, color2: string): boolean => {
    // Normalize colors
    const c1 = color1.toLowerCase().trim();
    const c2 = color2.toLowerCase().trim();

    // Exact match
    if (c1 === c2) return true;

    // Check for shorthand hex (#fff vs #ffffff)
    const normalize = (c: string) => {
      if (c.startsWith('#') && c.length === 4) {
        return '#' + c[1] + c[1] + c[2] + c[2] + c[3] + c[3];
      }
      return c;
    };

    return normalize(c1) === normalize(c2);
  };

  // Actually reset the app to IDLE state after confirmation
  const confirmNewDeck = () => {
    // 1. Stop any ongoing generation processes
    shouldStopRef.current = true;

    // Clear any pending processing timeout
    if (processingTimeoutRef.current) {
      clearTimeout(processingTimeoutRef.current);
      processingTimeoutRef.current = null;
    }

    // Abort any ongoing outline generation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // 2. Reset UI State
    setIsPaused(false);
    setShowExportMenu(false);
    setShowNewDeckConfirm(false);
    setStatus(GenerationStatus.IDLE);

    // 3. Reset Data State - all to initial values
    setSlides([]);
    setConfig(null);
    setTotalCost(0);
    setCurrentSlideId(null);
    setColorPalette('');
    setIsGeneratingNotes(false);

    // 4. Clear autosave data
    localStorage.removeItem(AUTOSAVE_KEY);

    // 5. Reset the stop flag so future generations can proceed
    shouldStopRef.current = false;
  };

  // Cancel new deck confirmation
  const cancelNewDeck = () => {
    setShowNewDeckConfirm(false);
  };

  // ==================== DATABASE FUNCTIONS ====================

  // Save current deck to database
  const handleSaveToDatabase = async () => {
    if (!config || slides.length === 0 || !hasDatabase || backendAvailable !== true) return;

    setIsSavingToDb(true);
    setSaveStatus('idle');

    try {
      // Generate full HTML for export
      const fullHtml = getFullHtml();

      // If deck already exists, save a version first
      if (currentDbDeckId) {
        try {
          await deckApi.saveVersion(currentDbDeckId, {
            topic: config.topic,
            fullHtml,
            outline: slides.map(s => ({
              title: s.title,
              contentPoints: s.contentPoints,
              layoutSuggestion: s.layoutSuggestion,
              notes: s.notes
            })),
            colorPalette,
          });
        } catch (versionError) {
          console.warn('Failed to save version, continuing with deck update:', versionError);
        }

        // Update existing deck
        await deckApi.update(currentDbDeckId, {
          topic: config.topic,
          audience: config.audience,
          purpose: config.purpose,
          colorPalette,
          slides: slides.map((s, i) => ({ ...s, orderIndex: i })),
          totalCost,
          fullHtml,
          documentContent: config.documentContent,
          outlineProvider: config.apiSettings.model.provider,
          outlineModel: config.apiSettings.model.modelId,
          outlineBaseUrl: config.apiSettings.model.baseUrl,
          slidesProvider: config.apiSettings.model.provider,
          slidesModel: config.apiSettings.model.modelId,
          slidesBaseUrl: config.apiSettings.model.baseUrl,
        });
      } else {
        // Create new deck
        const response = await deckApi.create({
          topic: config.topic,
          audience: config.audience,
          purpose: config.purpose,
          colorPalette,
          slides,
          totalCost,
          fullHtml,
          documentContent: config.documentContent,
          outlineProvider: config.apiSettings.model.provider,
          outlineModel: config.apiSettings.model.modelId,
          outlineBaseUrl: config.apiSettings.model.baseUrl,
          slidesProvider: config.apiSettings.model.provider,
          slidesModel: config.apiSettings.model.modelId,
          slidesBaseUrl: config.apiSettings.model.baseUrl,
        });
        setCurrentDbDeckId(response.data.id);
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error: any) {
      console.error('Failed to save to database:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } finally {
      setIsSavingToDb(false);
    }
  };

  // Helper to get baseUrl for a provider
  const getBaseUrl = (providerId: string): string | undefined => {
    return PROVIDERS.find(p => p.id === providerId)?.defaultBaseUrl;
  };

  // Load deck from database at specific stage
  const handleLoadFromDatabase = (deck: DatabaseDeckWithSlides, stage: import('./components/DeckBrowser').LoadStage) => {
    setCurrentDbDeckId(deck.id);

    // Use slides_provider/model as the single model (backward compatible)
    const provider = (deck.slides_provider as ApiProvider) || (deck.outline_provider as ApiProvider) || 'google';
    const modelId = deck.slides_model || deck.outline_model || 'gemini-3-flash-preview';
    const baseUrl = deck.slides_base_url || deck.outline_base_url || getBaseUrl(provider);

    const baseConfig: PresentationConfig = {
      topic: deck.topic,
      audience: deck.audience || '',
      purpose: deck.purpose || '',
      slideCount: deck.slide_count || 0,
      apiSettings: {
        apiKeys: getStoredApiKeys(),
        model: {
          provider,
          modelId,
          baseUrl,
        },
      },
      documentContent: deck.document_content || '',
    };

    switch (stage) {
      case 'input':
        // Load into input form stage
        setConfig(baseConfig);
        setColorPalette(deck.color_palette || '');
        setSlides([]);
        setStatus(GenerationStatus.IDLE);
        localStorage.setItem('gendeck_topic', deck.topic);
        localStorage.setItem('gendeck_audience', deck.audience || '');
        localStorage.setItem('gendeck_purpose', deck.purpose || '');
        localStorage.setItem('gendeck_content', deck.document_content || '');
        break;

      case 'outline':
        // Load into outline preview stage
        if (!deck.full_html) {
          alert(language === 'zh' ? '错误：此演示文稿没有保存完整HTML' : 'Error: Full HTML not available');
          return;
        }
        const parsed = parseExportedHtml(deck.full_html);
        setSlides(parsed.slides.map((s, i) => ({
          ...s,
          id: generateId(),
          htmlContent: null, // Will regenerate
          isRegenerating: false,
        })));
        setConfig(baseConfig);
        setColorPalette(deck.color_palette || parsed.colorPalette);
        setStatus(GenerationStatus.REVIEWING_OUTLINE);
        localStorage.setItem('gendeck_topic', deck.topic);
        break;

      case 'deck':
        // Load into deck preview stage (full HTML)
        if (!deck.full_html) {
          alert(language === 'zh' ? '错误：此演示文稿没有保存完整HTML' : 'Error: Full HTML not available');
          return;
        }
        const parsedDeck = parseExportedHtml(deck.full_html);
        setSlides(parsedDeck.slides.map((s, i) => ({
          ...s,
          id: generateId(),
          isRegenerating: false,
        })));
        setConfig(baseConfig);
        setColorPalette(deck.color_palette || parsedDeck.colorPalette);
        setStatus(GenerationStatus.COMPLETE);
        localStorage.setItem('gendeck_topic', deck.topic);
        break;
    }
  };

  // Restore slide from history
  const handleRestoreVersion = (version: import('./services/databaseService').DeckHistoryItem) => {
    if (!version.full_html) {
      alert(language === 'zh' ? '此版本没有保存完整HTML' : 'This version has no full HTML');
      return;
    }

    // Parse the full HTML like loading from database
    const parsed = parseExportedHtml(version.full_html);
    setSlides(parsed.slides.map((s, i) => ({
      ...s,
      id: generateId(),
      isRegenerating: false,
    })));
    setColorPalette(version.color_palette || parsed.colorPalette);

    // Update topic if different
    if (config && version.topic !== config.topic) {
      setConfig({ ...config, topic: version.topic });
      localStorage.setItem('gendeck_topic', version.topic);
    }
  };

  // Step 1: Generate Outline Only
  const handleGenerateOutline = async (newConfig: PresentationConfig) => {
    setConfig(newConfig);
    setStatus(GenerationStatus.GENERATING_OUTLINE);
    setSlides([]);
    setCurrentSlideId(null);
    setTotalCost(0); // Reset cost for new deck

    // Create abort controller
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const result = await generateOutline(
        newConfig.documentContent,
        newConfig.topic,
        newConfig.audience,
        newConfig.purpose, // Pass the purpose here
        newConfig.slideCount,
        newConfig.apiSettings,
        controller.signal // Pass signal
      );

      setTotalCost(prev => prev + result.cost);

      const initialSlides: SlideData[] = result.data.map(item => ({
        id: generateId(),
        title: item.title,
        contentPoints: item.contentPoints,
        notes: item.notes || "",
        layoutSuggestion: item.layoutSuggestion,
        htmlContent: null, // Will be generated later
        isRegenerating: false
      }));

      setSlides(initialSlides);
      setStatus(GenerationStatus.REVIEWING_OUTLINE);

    } catch (error: any) {
      if (error.name === 'AbortError') {
        // Outline generation aborted by user - silently return to idle
        setStatus(GenerationStatus.IDLE);
      } else {
        // Error handled via alert
        setStatus(GenerationStatus.ERROR);
        alert("Failed to generate outline. Please check your settings, API Key, or text content.");
        setStatus(GenerationStatus.IDLE);
      }
    } finally {
        abortControllerRef.current = null;
    }
  };

  const handleCancelOutlineGeneration = () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    setStatus(GenerationStatus.IDLE);
  };

  const handleGenerateNotes = async () => {
    if (!config || slides.length === 0) return;
    setIsGeneratingNotes(true);

    try {
      const outlineItems = slides.map(s => ({
        title: s.title,
        contentPoints: s.contentPoints,
        layoutSuggestion: s.layoutSuggestion || "",
        notes: ""
      }));

      const result = await generateSpeakerNotes(
        outlineItems,
        config.topic,
        config.audience,
        config.apiSettings
      );

      setTotalCost(prev => prev + result.cost);

      if (result.data.length === slides.length) {
        setSlides(prev => prev.map((s, i) => ({ ...s, notes: result.data[i] })));
      } else {
        alert("Generated note count didn't match slide count. Some notes might be missing.");
      }
    } catch (e) {
      alert("Failed to generate notes. Please try again.");
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  // Step 2: Confirm Outline, Set Palette, and Start HTML Generation
  const handleConfirmOutline = (selectedColorPalette: string) => {
    if (!config || slides.length === 0) return;

    setColorPalette(selectedColorPalette);
    setStatus(GenerationStatus.GENERATING_SLIDES);

    // Reset stop flags
    shouldStopRef.current = false;
    setIsPaused(false);

    // processSlideQueue will handle the rest
    processSlideQueue(slides, config, selectedColorPalette);
  };

  const handleUpdateSlides = (updatedSlides: SlideData[]) => {
    setSlides(updatedSlides);
  };

  const handleCancelOutline = () => {
    setStatus(GenerationStatus.IDLE);
    setSlides([]);
    setConfig(null);
  };

  const handleRegenerateSlide = async (id: string, customInstruction?: string) => {
    if (!config) return;

    setSlides(prev => prev.map(s => s.id === id ? { ...s, isRegenerating: true } : s));

    const slide = slides.find(s => s.id === id);
    const slideIndex = slides.findIndex(s => s.id === id);

    if (!slide) return;

    try {
      const outlineItem: OutlineItem = {
        title: slide.title,
        contentPoints: slide.contentPoints,
        notes: slide.notes || "",
        layoutSuggestion: slide.layoutSuggestion || ""
      };

      const result = await generateSlideHtml(
        outlineItem,
        colorPalette, // Use stored palette
        config.audience,
        config.apiSettings,
        config.topic,
        slideIndex + 1,
        slides.length,
        customInstruction
      );

      setTotalCost(prev => prev + result.cost);

      setSlides(prev => prev.map(s => s.id === id ? { ...s, htmlContent: result.data, isRegenerating: false } : s));
    } catch (e) {
      setSlides(prev => prev.map(s => s.id === id ? { ...s, isRegenerating: false } : s));
    }
  };

  const getFullHtml = () => {
    const colors = colorPalette.split(',').map(c => c.trim());
    const themeCss = `
    :root {
      --c-bg: ${colors[0] || '#111'};
      --c-surface: ${colors[1] || '#222'};
      --c-accent: ${colors[2] || '#4f46e5'};
      --c-text: ${colors[3] || '#fff'};
      --c-text-muted: ${colors[3] ? colors[3] + 'aa' : '#ffffffaa'};
    }
    .theme-light {
      --c-bg: ${colors[3] || '#fff'};
      --c-surface: #f3f4f6;
      --c-accent: ${colors[2] || '#4f46e5'}; /* Use defined accent for light mode too */
      --c-text: ${colors[0] || '#000'};
      --c-text-muted: ${colors[0] ? colors[0] + 'aa' : '#000000aa'};
    }
    `;

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${config?.topic}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    /* CSS Reset & Defaults */
    * { box-sizing: border-box; }
    body, html { margin: 0; padding: 0; background: #1a1a1a; font-family: sans-serif; overflow: hidden; height: 100vh; }

    /* Global Theme */
    ${themeCss}

    /* Screen View Container */
    #deck-container {
      width: 1920px;
      height: 1080px;
      position: absolute;
      top: 50%;
      left: 50%;
      transform-origin: center;
      /* scale set by JS */
    }

    /* Strict Slide Constraints */
    .slide {
      width: 100%;
      height: 100%;
      position: absolute;
      top: 0;
      left: 0;
      overflow: hidden;
      display: none;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .slide.active {
      display: block;
    }

    /* Top Right Theme Toggle */
    .theme-toggle {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 1100;
      background: rgba(0,0,0,0.6);
      backdrop-filter: blur(5px);
      border: 1px solid rgba(255,255,255,0.2);
      color: white;
      padding: 8px 16px;
      border-radius: 20px;
      cursor: pointer;
      font-size: 14px;
      font-family: monospace;
      transition: all 0.2s;
    }
    .theme-toggle:hover { background: rgba(0,0,0,0.9); }

    /* Bottom Center Navigation Bar */
    .nav-controls {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 16px;
      background: rgba(0,0,0,0.8);
      backdrop-filter: blur(8px);
      padding: 8px 16px;
      border-radius: 30px;
      border: 1px solid rgba(255,255,255,0.1);
      z-index: 1000;
      color: white;
      font-family: monospace;
      font-size: 14px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.3);
    }

    .nav-btn {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      cursor: pointer;
      transition: all 0.2s;
      background: rgba(255,255,255,0.1);
    }
    .nav-btn:hover { background: rgba(255,255,255,0.2); transform: scale(1.1); }
    .nav-btn:active { transform: scale(0.95); }

    .page-indicator {
      min-width: 60px;
      text-align: center;
      font-weight: bold;
      letter-spacing: 1px;
    }

    .progress-bar {
      position: fixed;
      bottom: 0;
      left: 0;
      height: 3px;
      background: #4ade80; /* Standard green, style might override */
      transition: width 0.3s;
      z-index: 1001;
    }

    /* Print Overrides (PDF Export) */
    @media print {
      @page {
        size: 1920px 1080px;
        margin: 0;
      }
      body, html {
        margin: 0 !important;
        padding: 0 !important;
        background-color: transparent !important;
        width: 1920px !important;
        height: auto !important;
        overflow: visible !important;
      }
      #deck-container {
        position: static !important;
        width: 1920px !important;
        height: auto !important;
        transform: none !important;
        display: block !important;
        margin: 0 !important;
        padding: 0 !important;
        overflow: visible !important;
      }
      .slide {
        position: relative !important;
        width: 1920px !important;
        height: 1080px !important;
        top: auto !important;
        left: auto !important;
        display: block !important;
        margin: 0 !important;
        padding: 0 !important;
        page-break-after: always !important;
        break-after: page !important;
        box-shadow: none !important;
        overflow: hidden !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        background-color: var(--c-bg) !important;
        border: none !important;
      }

      /* Force theme colors in print */
      .slide * {
         -webkit-print-color-adjust: exact !important;
         print-color-adjust: exact !important;
      }

      .nav-controls, .theme-toggle, .progress-bar, .no-print { display: none !important; }
    }
  </style>
</head>
<body class="theme-root">
  <div class="progress-bar" id="progressBar" style="width: 0%"></div>

  <button class="theme-toggle no-print" id="themeBtn">☀ Light Mode</button>

  <div id="deck-container">
    ${slides.map((s, i) => s.htmlContent).join('\n')}
  </div>

  <div class="nav-controls no-print">
    <div class="nav-btn" id="prevBtn">←</div>
    <div class="page-indicator" id="pageIndicator">1 / ${slides.length}</div>
    <div class="nav-btn" id="nextBtn">→</div>
    <div class="nav-btn" id="fullscreenBtn" title="Fullscreen">⛶</div>
  </div>

  <script>
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const totalSlides = slides.length;
    const indicator = document.getElementById('pageIndicator');
    const progressBar = document.getElementById('progressBar');
    const themeBtn = document.getElementById('themeBtn');
    let isLight = false;

    function updateSlide() {
      slides.forEach((s, i) => {
        s.classList.toggle('active', i === currentSlide);
      });
      indicator.innerText = (currentSlide + 1) + ' / ' + totalSlides;
      progressBar.style.width = ((currentSlide + 1) / totalSlides * 100) + '%';
    }

    function nextSlide() {
      if (currentSlide < totalSlides - 1) {
        currentSlide++;
        updateSlide();
      }
    }

    function prevSlide() {
      if (currentSlide > 0) {
        currentSlide--;
        updateSlide();
      }
    }

    function toggleFullScreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    }

    function toggleTheme() {
      isLight = !isLight;
      const container = document.getElementById('deck-container');

      slides.forEach(slide => {
        if (isLight) {
          slide.classList.add('theme-light');
        } else {
          slide.classList.remove('theme-light');
        }
      });

      themeBtn.innerText = isLight ? "☾ Dark Mode" : "☀ Light Mode";
    }

    // Auto-Scale Logic
    function fitSlides() {
      const container = document.getElementById('deck-container');
      const winW = window.innerWidth;
      const winH = window.innerHeight;
      const scaleX = winW / 1920;
      const scaleY = winH / 1080;
      const scale = Math.min(scaleX, scaleY) * 0.95;

      container.style.transform = \`translate(-50%, -50%) scale(\${scale})\`;
    }

    // Attach event listeners to buttons
    document.getElementById('themeBtn').addEventListener('click', toggleTheme);
    document.getElementById('prevBtn').addEventListener('click', prevSlide);
    document.getElementById('nextBtn').addEventListener('click', nextSlide);
    document.getElementById('fullscreenBtn').addEventListener('click', toggleFullScreen);

    window.addEventListener('resize', fitSlides);
    fitSlides();
    updateSlide();

    // Keyboard Nav
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp' || e.key === 'PageUp') {
        prevSlide();
      } else if (e.key === 'Home') {
        currentSlide = 0;
        updateSlide();
      } else if (e.key === 'End') {
        currentSlide = totalSlides - 1;
        updateSlide();
      }
    });
  </script>
</body>
</html>
    `;
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleExportHtml = () => {
    downloadFile(getFullHtml(), `deck-${config?.topic.replace(/\s+/g, '-').toLowerCase()}.html`, 'text/html');
    setShowExportMenu(false);
  };

  const handleExportPdf = () => {
    const fullHtml = getFullHtml();
    // Inject auto-print script before body end
    // The delay ensures Tailwind/Styles are applied
    const printScript = `
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 1000); // 1s delay to ensure fonts/layout settle
        };
      </script>
    `;
    const htmlToPrint = fullHtml.replace('</body>', `${printScript}</body>`);

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.open();
      printWindow.document.write(htmlToPrint);
      printWindow.document.close();
    }
    setShowExportMenu(false);
  };

  const handleExportMarkdown = () => {
    const md = slides.map(s => `## ${s.title}\n\n${s.contentPoints.map(p => `- ${p}`).join('\n')}\n\n**Notes:**\n${s.notes || 'N/A'}\n`).join('\n---\n\n');
    downloadFile(md, `outline-${config?.topic.replace(/\s+/g, '-').toLowerCase()}.md`, 'text/markdown');
    setShowExportMenu(false);
  };

  const handleExportNotes = () => {
    const txt = slides.map((s, i) => `Slide ${i+1}: ${s.title}\n-------------------\n${s.notes || '(No notes)'}\n\n`).join('\n');
    downloadFile(txt, `notes-${config?.topic.replace(/\s+/g, '-').toLowerCase()}.txt`, 'text/plain');
    setShowExportMenu(false);
  };

  const handlePreview = () => {
    if (slides.length === 0) return;
    const fullHtml = getFullHtml();
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(fullHtml);
      win.document.close();
    }
  };

  const currentSlide = slides.find(s => s.id === currentSlideId);
  const hasNotes = slides.some(s => s.notes && s.notes.trim().length > 0);

  // Calculate generation progress
  const generatedCount = slides.filter(s => s.htmlContent).length;
  const progressPercent = slides.length > 0 ? (generatedCount / slides.length) * 100 : 0;

  // Use centralized theme classes
  const themeClasses = isDark
    ? 'bg-slate-950 text-slate-100 selection:bg-purple-500/30 selection:text-purple-100'
    : 'bg-gray-50 text-gray-900 selection:bg-purple-200 selection:text-purple-900';

  const bgGradient = isDark
    ? 'from-purple-900/20 via-slate-950 to-slate-950'
    : 'from-purple-100/50 via-gray-50 to-gray-50';

  return (
    <div className={`h-screen flex flex-col overflow-hidden font-sans relative ${themeClasses}`}>
      {/* Animated Background Gradient */}
      <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${bgGradient} pointer-events-none`} />

      {/* Progress Bar Overlay */}
      {status === GenerationStatus.GENERATING_SLIDES && (
        <div className="absolute top-0 left-0 w-full h-1 bg-slate-800/50 z-[100]">
           <div
             className={`h-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(168,85,247,0.5)] ${isPaused ? 'opacity-50' : ''}`}
             style={{ width: `${progressPercent}%` }}
           />
        </div>
      )}

      {/* Glass Header */}
      <header className={cls(
        'h-16 border-b backdrop-blur-xl flex items-center justify-between px-6 z-50 relative',
        isDark ? 'border-white/5 bg-slate-950/80' : 'border-gray-200/50 bg-white/70'
      )}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/25 ring-1 ring-white/20">G</div>
          <h1 className={cls(
            'text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r',
            isDark ? 'from-white via-slate-200 to-slate-400' : 'from-gray-900 via-gray-700 to-gray-600'
          )}>GenDeck</h1>
        </div>

        <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={cx(
                'flex items-center justify-center w-8 h-8 rounded-lg border transition-all',
                isDark
                  ? 'bg-slate-900/80 hover:bg-slate-800 border-white/10 hover:border-white/20 text-slate-400 hover:text-yellow-400'
                  : 'bg-white/80 hover:bg-white border-gray-200 hover:border-gray-300 text-gray-600 hover:text-orange-500'
              )}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Language Switcher */}
            <button
                onClick={() => setLanguage(l => l === 'en' ? 'zh' : 'en')}
                className={cx('flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all', th.button.primary)}
                title="Switch Language"
            >
                <Languages className="w-3.5 h-3.5" />
                <span className="font-medium">{language === 'en' ? 'EN' : '中文'}</span>
            </button>

            {/* Cost Display */}
            {totalCost > 0 && (
            <div className={cx('hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm', isDark ? 'bg-slate-900/80 border-emerald-500/20' : 'bg-white/80 border-emerald-500/30')}>
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                <span className={cx('text-xs font-mono', th.text.secondary)}>
                {t('estCost')}: ${totalCost.toFixed(4)}
                </span>
            </div>
            )}

            {/* Auto-save indicator */}
            {slides.length > 0 && (
              <div className={cx('hidden md:flex items-center gap-1.5 px-2 py-1 rounded-full border', isDark ? 'bg-slate-800/50 border-white/5' : 'bg-gray-100/80 border-gray-200')} title={language === 'zh' ? '已自动保存' : 'Auto-saved'}>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className={cx('text-[10px] font-medium', th.text.muted)}>{language === 'zh' ? '已保存' : 'Saved'}</span>
              </div>
            )}

            {/* Database Actions: shown when API URL is configured; Browse/Save/History disabled when backend unavailable */}
            {hasDatabase && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => backendAvailable === true && setShowDeckBrowser(true)}
                  disabled={backendAvailable !== true}
                  className={cx(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border',
                    backendAvailable !== true
                      ? 'opacity-50 cursor-not-allowed border-gray-400/50 text-gray-500'
                      : th.button.primary
                  )}
                  title={
                    backendAvailable === false
                      ? (language === 'zh' ? '后端不可用' : 'Backend unavailable')
                      : backendAvailable === null
                        ? (language === 'zh' ? '检查后端...' : 'Checking backend...')
                        : (language === 'zh' ? '浏览保存的演示文稿' : 'Browse saved decks')
                  }
                >
                  <Database className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{language === 'zh' ? '浏览' : 'Browse'}</span>
                </button>

                {(status === GenerationStatus.GENERATING_SLIDES || status === GenerationStatus.COMPLETE) && slides.length > 0 && (
                  <button
                    onClick={handleSaveToDatabase}
                    disabled={isSavingToDb || backendAvailable !== true}
                    className={cx(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                      saveStatus === 'success' && 'bg-gradient-to-r from-emerald-500 to-green-500 shadow-emerald-500/30',
                      saveStatus === 'error' && 'bg-gradient-to-r from-red-500 to-rose-500 shadow-red-500/30',
                      saveStatus === 'idle' && backendAvailable === true && 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-500/20',
                      backendAvailable !== true && 'opacity-50 cursor-not-allowed bg-gray-500/30',
                      'text-white shadow-lg',
                      'border border-white/20',
                      'hover:shadow-xl hover:scale-105 active:scale-95',
                      'disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100',
                      'relative overflow-hidden'
                    )}
                    title={
                      backendAvailable === false
                        ? (language === 'zh' ? '后端不可用' : 'Backend unavailable')
                        : backendAvailable === null
                          ? (language === 'zh' ? '检查后端...' : 'Checking backend...')
                          : (language === 'zh' ? '保存到数据库' : 'Save to database')
                    }
                  >
                    {/* Status indicator dot */}
                    <span className={cx(
                      'absolute top-1 right-1 w-1.5 h-1.5 rounded-full transition-all',
                      saveStatus === 'success' && 'bg-green-300 animate-pulse',
                      saveStatus === 'error' && 'bg-red-300',
                      saveStatus === 'idle' && 'bg-emerald-300/50'
                    )} />

                    {isSavingToDb ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span className="hidden sm:inline">{language === 'zh' ? '保存中...' : 'Saving...'}</span>
                      </>
                    ) : saveStatus === 'success' ? (
                      <>
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{language === 'zh' ? '已保存' : 'Saved!'}</span>
                      </>
                    ) : saveStatus === 'error' ? (
                      <>
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{language === 'zh' ? '失败' : 'Failed'}</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{language === 'zh' ? '保存' : 'Save'}</span>
                      </>
                    )}
                  </button>
                )}

                {currentDbDeckId && (
                  <button
                    onClick={() => backendAvailable === true && setShowSlideHistory(true)}
                    disabled={backendAvailable !== true}
                    className={cx(
                      'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border',
                      backendAvailable !== true
                        ? 'opacity-50 cursor-not-allowed border-gray-400/50 text-gray-500'
                        : th.button.primary
                    )}
                    title={
                      backendAvailable === false
                        ? (language === 'zh' ? '后端不可用' : 'Backend unavailable')
                        : backendAvailable === null
                          ? (language === 'zh' ? '检查后端...' : 'Checking backend...')
                          : (language === 'zh' ? '查看历史版本' : 'View history')
                    }
                  >
                    <History className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{language === 'zh' ? '历史' : 'History'}</span>
                  </button>
                )}
              </div>
            )}

            {status === GenerationStatus.REVIEWING_OUTLINE && (
            <div className={cx('px-3 py-1.5 rounded-full text-xs font-medium animate-pulse border', isDark ? 'bg-blue-500/10 text-blue-300 border-blue-500/20' : 'bg-blue-100 text-blue-700 border-blue-200')}>
                {t('outlineEditor')}
            </div>
            )}

            {(status === GenerationStatus.GENERATING_SLIDES || status === GenerationStatus.COMPLETE) && (
              <div className="flex items-center gap-2">
                 {status === GenerationStatus.GENERATING_SLIDES && (
                   <div className={cx('flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-sm', isDark ? 'bg-purple-500/10 text-purple-200 border-purple-500/20' : 'bg-purple-100 text-purple-700 border-purple-200')}>
                     <Loader2 className="w-3.5 h-3.5 animate-spin" />
                     <span className="text-xs font-medium">{t('generating')} {Math.round(progressPercent)}%</span>
                     <div className={cx('h-3 w-px mx-1', isDark ? 'bg-purple-500/20' : 'bg-purple-300')} />
                     {isPaused ? (
                        <button onClick={handleResumeGeneration} className="hover:opacity-70 transition-colors" title={t('resume')}>
                            <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                     ) : (
                        <button onClick={handlePauseGeneration} className="hover:opacity-70 transition-colors" title={t('pause')}>
                            <Pause className="w-3.5 h-3.5 fill-current" />
                        </button>
                     )}
                     <button onClick={handleCancelGeneration} className="hover:opacity-70 transition-colors ml-1" title={t('cancel')}>
                        <XCircle className="w-3.5 h-3.5" />
                     </button>
                   </div>
                 )}

                 {/* Export Dropdown */}
                 <div className="relative">
                    <button
                      onClick={() => setShowExportMenu(!showExportMenu)}
                      className={cx('flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all border', th.button.primary)}
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">{t('otherFormats')}</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>

                    {showExportMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)}></div>
                        <div className={cx('absolute top-full right-0 mt-2 w-48 backdrop-blur-xl rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 border', isDark ? 'bg-slate-900/95 border-white/10' : 'bg-white/95 border-gray-200')}>
                          <div className="p-1">
                             <button
                               onClick={handleExportHtml}
                               className={cx('w-full text-left px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors', th.button.ghost)}
                             >
                               <FileJson className="w-4 h-4" />
                               {t('downloadHtml')}
                             </button>
                             <button
                               onClick={handleExportPdf}
                               className={cx('w-full text-left px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors', th.button.ghost)}
                             >
                               <Printer className="w-4 h-4" />
                               {t('exportPdf')}
                             </button>
                             <button
                               onClick={handleExportMarkdown}
                               className={cx('w-full text-left px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors', th.button.ghost)}
                             >
                               <FileText className="w-4 h-4" />
                               {t('exportOutline')}
                             </button>
                             <button
                               onClick={handleExportNotes}
                               className={cx('w-full text-left px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors', th.button.ghost)}
                             >
                               <MessageSquareText className="w-4 h-4" />
                               {t('exportNotes')}
                             </button>
                          </div>
                        </div>
                      </>
                    )}
                 </div>

                 <button
                    onClick={handlePreview}
                    disabled={slides.length === 0}
                    className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-purple-500/25 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                    <Eye className="w-4 h-4" />
                    <span className="hidden sm:inline">{t('preview')}</span>
                 </button>
              </div>
            )}

            {status !== GenerationStatus.IDLE && (
              <button
                onClick={handleNewDeck}
                className={cx('flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ml-2', th.button.primary)}
                title={t('new')}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{t('new')}</span>
              </button>
            )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className={cx('flex-1 overflow-hidden relative', !isDark && 'bg-gray-50/50')}>
        {(status === GenerationStatus.IDLE || status === GenerationStatus.GENERATING_OUTLINE) && (
          <div className="h-full w-full overflow-y-auto">
            <InputForm
              onGenerate={handleGenerateOutline}
              onCancel={handleCancelOutlineGeneration}
              isGenerating={status === GenerationStatus.GENERATING_OUTLINE}
              lang={language}
              t={t}
              theme={theme}
              onImportHtml={handleImportHtml}
            />
          </div>
        )}

        {status === GenerationStatus.REVIEWING_OUTLINE && (
          <OutlineEditor
            slides={slides}
            onUpdateSlides={handleUpdateSlides}
            onConfirm={handleConfirmOutline}
            onCancel={handleCancelOutline}
            lang={language}
            t={t}
            theme={theme}
          />
        )}

        {(status === GenerationStatus.GENERATING_SLIDES || status === GenerationStatus.COMPLETE) && (
          <div className="flex h-full">
            <Sidebar
              slides={slides}
              currentSlideId={currentSlideId}
              onSelectSlide={setCurrentSlideId}
              isGeneratingAll={status === GenerationStatus.GENERATING_SLIDES && !isPaused}
              lang={language}
              t={t}
              theme={theme}
            />
            <div className="flex-1 relative">
               <SlidePreview
                 slide={currentSlide}
                 onRegenerate={handleRegenerateSlide}
                 colorPalette={colorPalette}
                 lang={language}
                 t={t}
                 theme={theme}
               />

               {/* Notes Generation CTA Overlay if complete but no notes */}
               {status === GenerationStatus.COMPLETE && !hasNotes && !isGeneratingNotes && (
                   <div className="absolute bottom-6 right-6 z-40">
                      <button
                        onClick={handleGenerateNotes}
                        className={cx('backdrop-blur px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-bottom-4 transition-all border', isDark ? 'bg-slate-900/90 hover:bg-slate-800 text-white border-white/10 hover:border-white/20 shadow-black/20' : 'bg-white/90 hover:bg-white text-gray-900 border-gray-200 hover:border-gray-300 shadow-gray-200/50')}
                      >
                         <MessageSquareText className={cx('w-4 h-4', isDark ? 'text-green-400' : 'text-green-600')} />
                         {t('generateNotes')}
                      </button>
                   </div>
               )}

               {isGeneratingNotes && (
                   <div className="absolute bottom-6 right-6 z-40">
                      <div className={cx('backdrop-blur px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 text-sm font-medium border', isDark ? 'bg-slate-900/90 text-white border-white/10 shadow-black/20' : 'bg-white/90 text-gray-900 border-gray-200 shadow-gray-200/50')}>
                         <Loader2 className={cx('w-4 h-4 animate-spin', isDark ? 'text-green-400' : 'text-green-600')} />
                         Generating speaker notes...
                      </div>
                   </div>
               )}
            </div>
          </div>
        )}
      </main>

      {/* New Deck Confirmation Modal */}
      {showNewDeckConfirm && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) cancelNewDeck();
          }}
        >
          {/* Backdrop */}
          <div className={cx('absolute inset-0 backdrop-blur-sm transition-opacity', isDark ? 'bg-slate-950/80' : 'bg-gray-900/40')} />

          {/* Modal Content */}
          <div className={cx('relative border rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-in fade-in zoom-in-95 duration-200', isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-gray-200')}>
            {/* Header */}
            <div className={cx('flex items-center gap-3 px-6 py-5 border-b', isDark ? 'border-white/5' : 'border-gray-100')}>
              <div className={cx('w-10 h-10 rounded-xl flex items-center justify-center ring-1', isDark ? 'bg-amber-500/10 ring-amber-500/20' : 'bg-amber-100 ring-amber-200')}>
                <Plus className={cx('w-5 h-5', isDark ? 'text-amber-400' : 'text-amber-600')} />
              </div>
              <div>
                <h3 className={cx('text-lg font-semibold', th.text.primary)}>{t('new')}</h3>
                <p className={cx('text-sm', th.text.muted)}>{t('confirmNew')}</p>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4">
              <div className={cx('flex items-start gap-3 text-sm', th.text.secondary)}>
                <div className={cx('w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ring-1', isDark ? 'bg-red-500/10 ring-red-500/20' : 'bg-red-100 ring-red-200')}>
                  <span className={cx('font-bold text-xs', isDark ? 'text-red-400' : 'text-red-600')}>!</span>
                </div>
                <p>{language === 'zh' ? '当前演示文稿的所有进度都将被清除，包括已生成的幻灯片和设置。此操作无法撤销。' : 'All progress on the current presentation will be cleared, including generated slides and settings. This action cannot be undone.'}</p>
              </div>
            </div>

            {/* Footer */}
            <div className={cx('flex items-center justify-end gap-3 px-6 py-4 border-t rounded-b-2xl', isDark ? 'border-white/5 bg-slate-900/50' : 'border-gray-100 bg-gray-50/50')}>
              <button
                onClick={cancelNewDeck}
                className={cx('px-4 py-2 text-sm font-medium rounded-lg transition-all border', th.button.primary)}
              >
                {language === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={confirmNewDeck}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-lg transition-all shadow-lg shadow-red-500/20"
              >
                {language === 'zh' ? '确认新建' : 'Confirm New'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Database Browser Modal */}
      <DeckBrowser
        isOpen={showDeckBrowser}
        onClose={() => setShowDeckBrowser(false)}
        onLoadDeck={handleLoadFromDatabase}
        lang={language}
        theme={theme}
      />

      {/* Slide History Modal */}
      <SlideHistory
        isOpen={showSlideHistory}
        onClose={() => setShowSlideHistory(false)}
        deckId={currentDbDeckId}
        onRestore={handleRestoreVersion}
        lang={language}
        theme={theme}
      />


    </div>
  );
};

export default App;
