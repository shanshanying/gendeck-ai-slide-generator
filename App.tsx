
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PresentationConfig, SlideData, OutlineItem, GenerationStatus, Language, LocalProjectFile, ApiProvider } from './types';
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
import { Download, DollarSign, Eye, FileText, FileJson, ChevronDown, MessageSquareText, Loader2, Languages, Play, Pause, XCircle, Printer, Plus, Moon, FolderOpen, Save } from 'lucide-react';
import { TRANSLATIONS, COLOR_THEMES, findAudienceProfile, getStylePreset } from './constants';

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

type ExportFormat = 'html' | 'pdf';
interface ExportQaIssue {
  level: 'error' | 'warning' | 'pass';
  messageEn: string;
  messageZh: string;
}

const AUTOSAVE_KEY = 'gendeck_autosave';
const PROJECT_FILE_VERSION = 1;

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('gendeck_lang');
    return (saved === 'en' || saved === 'zh') ? saved : 'en';
  });

  // Restore from autosave on initial load
  const getInitialState = (): { data: Partial<AutosaveData>; recovered: boolean } => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY);
      if (saved) {
        const data: AutosaveData = JSON.parse(saved);
        // Only restore if autosave is less than 7 days old
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        if (Date.now() - data.timestamp < oneWeek) {
          return { data, recovered: true };
        }
      }
    } catch {
      // Ignore parse errors
    }
    return { data: {}, recovered: false };
  };

  const initialStateResult = getInitialState();
  const initialState = initialStateResult.data;

  const { theme } = useThemeContext();
  const th = getThemeClasses();

  const [status, setStatus] = useState<GenerationStatus>(initialState.status || GenerationStatus.IDLE);
  const [config, setConfig] = useState<PresentationConfig | null>(initialState.config || null);
  const [colorPalette, setColorPalette] = useState<string>(initialState.colorPalette || '');
  const [slides, setSlides] = useState<SlideData[]>(initialState.slides || []);
  const [currentSlideId, setCurrentSlideId] = useState<string | null>(initialState.currentSlideId || null);
  const [totalCost, setTotalCost] = useState(initialState.totalCost || 0);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showExportQa, setShowExportQa] = useState(false);
  const [pendingExportFormat, setPendingExportFormat] = useState<ExportFormat | null>(null);
  const [exportQaIssues, setExportQaIssues] = useState<ExportQaIssue[]>([]);
  const [showNewDeckConfirm, setShowNewDeckConfirm] = useState(false);
  const [showRecoveredBanner, setShowRecoveredBanner] = useState(initialStateResult.recovered);

  // New State for Pause/Resume
  const [isPaused, setIsPaused] = useState(false);

  // Refs for process control
  const shouldStopRef = React.useRef(false);
  const processingTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const slideRetryCountRef = useRef<Record<string, number>>({});
  const MAX_SLIDE_RETRIES = 3;

  // Ref for aborting outline generation
  const abortControllerRef = useRef<AbortController | null>(null);
  const openProjectInputRef = useRef<HTMLInputElement | null>(null);

  // Helper function for translations
  const t = (key: keyof typeof TRANSLATIONS['en']) => TRANSLATIONS[language][key];

  const getBaseUrl = (providerId: ApiProvider): string | undefined => {
    return providerId === 'openai' ? 'https://api.openai.com/v1'
      : providerId === 'deepseek' ? 'https://api.deepseek.com'
      : providerId === 'moonshot' ? 'https://api.moonshot.ai/v1'
      : providerId === 'anthropic' ? 'https://api.anthropic.com/v1'
      : undefined;
  };

  useEffect(() => {
    localStorage.setItem('gendeck_lang', language);
  }, [language]);

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
        currentSlides.length,
        undefined,
        currentConfig.stylePresetId
      );

      setTotalCost(prev => prev + result.cost);
      slideRetryCountRef.current[slideToProcess.id] = 0;

      setSlides(prev => {
        const htmlContent = (result.data || '').trim();
        const next = prev.map(s => s.id === slideToProcess.id
          ? {
              ...s,
              htmlContent: htmlContent || `<section class="slide flex items-center justify-center text-3xl" style="width:1920px;height:1080px;background-color:var(--c-bg);color:var(--c-accent);"><div style="text-align:center;"><div style="font-size:48px;margin-bottom:16px;">⚠️</div><div>Slide generation returned empty output</div></div></section>`,
              isRegenerating: false
            }
          : s
        );

        // Check stop ref again before scheduling next
        if (!shouldStopRef.current) {
            processingTimeoutRef.current = setTimeout(() => processSlideQueue(next, currentConfig, palette), 100);
        }
        return next;
      });
    } catch (e) {
      // Failed to generate slide - retry with cap to avoid infinite loop.
      setSlides(prev => {
         const attempts = (slideRetryCountRef.current[slideToProcess.id] || 0) + 1;
         slideRetryCountRef.current[slideToProcess.id] = attempts;

         const next = prev.map(s => {
           if (s.id !== slideToProcess.id) return s;
           if (attempts >= MAX_SLIDE_RETRIES) {
             return {
               ...s,
               isRegenerating: false,
               htmlContent: `<section class="slide flex items-center justify-center text-3xl" style="width:1920px;height:1080px;background-color:var(--c-bg);color:var(--c-accent);"><div style="text-align:center;"><div style="font-size:48px;margin-bottom:16px;">⚠️</div><div>Slide failed after ${MAX_SLIDE_RETRIES} retries</div></div></section>`
             };
           }
           return { ...s, isRegenerating: false };
         });

         // Even on error, continue if not stopped. Back off on repeated failures.
         if (!shouldStopRef.current) {
            const retryDelay = Math.min(2000, 100 * attempts);
            processingTimeoutRef.current = setTimeout(() => processSlideQueue(next, currentConfig, palette), retryDelay);
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
    slideRetryCountRef.current = {};
  };

  // Show confirmation dialog for new deck
  const handleNewDeck = () => {
    setShowNewDeckConfirm(true);
  };

  // Handle importing a previously generated HTML deck
  const handleImportHtml = (result: ImportResult) => {
    setShowRecoveredBanner(false);
    // Set the topic and config
    const importedConfig: PresentationConfig = {
      topic: result.topic,
      audience: result.config.audience || '',
      purpose: result.config.purpose || '',
      slideCount: result.slides.length,
      apiSettings: config?.apiSettings || {
        apiKeys: {},
        model: { provider: 'google', modelId: 'gemini-3-flash-preview', baseUrl: getBaseUrl('google') },
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
    setShowRecoveredBanner(false);
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
    slideRetryCountRef.current = {};
  };

  // Cancel new deck confirmation
  const cancelNewDeck = () => {
    setShowNewDeckConfirm(false);
  };

  // Step 1: Generate Outline Only
  const handleGenerateOutline = async (newConfig: PresentationConfig) => {
    setShowRecoveredBanner(false);
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
        controller.signal, // Pass signal
        newConfig.strictMode, // Pass strict mode flag
        newConfig.stylePresetId // Pass user-selected style preset
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
      
      // Auto-select theme based on style preset or audience
      let selectedThemeColors = '';
      
      if (newConfig.stylePresetId) {
        // Use user-selected style preset
        const preset = getStylePreset(newConfig.stylePresetId);
        if (preset && preset.recommendedThemes.length > 0) {
          const theme = COLOR_THEMES.find(t => t.id === preset.recommendedThemes[0]);
          if (theme) {
            selectedThemeColors = theme.colors.join(',');
          }
        }
      } else {
        // Fallback: auto-detect from audience
        const profile = findAudienceProfile(newConfig.audience);
        if (profile && profile.recommendedThemes.length > 0) {
          const theme = COLOR_THEMES.find(t => t.id === profile.recommendedThemes[0]);
          if (theme) {
            selectedThemeColors = theme.colors.join(',');
          }
        }
      }
      
      // Ensure we have a valid palette
      if (!selectedThemeColors) {
        selectedThemeColors = COLOR_THEMES[0].colors.join(',');
      }
      
      setColorPalette(selectedThemeColors);
      
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
        customInstruction,
        config.stylePresetId
      );

      setTotalCost(prev => prev + result.cost);

      setSlides(prev => prev.map(s => s.id === id ? { ...s, htmlContent: result.data, isRegenerating: false } : s));
    } catch (e) {
      setSlides(prev => prev.map(s => s.id === id ? { ...s, isRegenerating: false } : s));
    }
  };

  const getFullHtml = () => {
    const colors = colorPalette.split(',').map(c => c.trim());
    // Format: [bg, bg-soft, bg-glass, bg-invert, text, text-muted, text-faint, text-invert,
    //          border, border-strong, divider, primary, secondary, accent, success, warning, danger, info]
    const themeCss = `
    :root {
      /* Background */
      --c-bg: ${colors[0] || '#0a0a0a'};
      --c-bg-soft: ${colors[1] || '#141414'};
      --c-bg-glass: ${colors[2] || '#0a0a0a80'};
      --c-bg-invert: ${colors[3] || '#ffffff'};
      /* Text */
      --c-text: ${colors[4] || '#ffffff'};
      --c-text-muted: ${colors[5] || '#a1a1aa'};
      --c-text-faint: ${colors[6] || '#6b7280'};
      --c-text-invert: ${colors[7] || '#0a0a0a'};
      /* Structure */
      --c-border: ${colors[8] || '#404040'};
      --c-border-strong: ${colors[9] || '#525252'};
      --c-divider: ${colors[10] || '#40404040'};
      /* Accent */
      --c-primary: ${colors[11] || '#3b82f6'};
      --c-secondary: ${colors[12] || '#8b5cf6'};
      --c-accent: ${colors[13] || '#3b82f6'};
      /* Semantic */
      --c-success: ${colors[14] || '#22c55e'};
      --c-warning: ${colors[15] || '#f59e0b'};
      --c-danger: ${colors[16] || '#ef4444'};
      --c-info: ${colors[17] || '#06b6d4'};
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

      .nav-controls, .progress-bar, .no-print { display: none !important; }
    }
  </style>
</head>
<body class="theme-root">
  <div class="progress-bar" id="progressBar" style="width: 0%"></div>

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

  const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
    const normalized = hex.trim().replace('#', '');
    if (![3, 4, 6, 8].includes(normalized.length)) return null;
    const hasAlpha = normalized.length === 4 || normalized.length === 8;
    const rgbPart = hasAlpha ? normalized.slice(0, normalized.length - (normalized.length === 4 ? 1 : 2)) : normalized;
    const full = rgbPart.length === 3 ? rgbPart.split('').map((c) => c + c).join('') : rgbPart;
    const num = Number.parseInt(full, 16);
    if (Number.isNaN(num)) return null;
    return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
  };

  const relativeLuminance = ({ r, g, b }: { r: number; g: number; b: number }): number => {
    const channel = (v: number) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
  };

  const contrastRatio = (a: string, b: string): number | null => {
    const ca = hexToRgb(a);
    const cb = hexToRgb(b);
    if (!ca || !cb) return null;
    const l1 = relativeLuminance(ca);
    const l2 = relativeLuminance(cb);
    const light = Math.max(l1, l2);
    const dark = Math.min(l1, l2);
    return (light + 0.05) / (dark + 0.05);
  };

  const runExportChecks = (): ExportQaIssue[] => {
    const issues: ExportQaIssue[] = [];
    if (slides.length === 0) {
      issues.push({
        level: 'error',
        messageEn: 'No slides available to export.',
        messageZh: '当前没有可导出的幻灯片。',
      });
      return issues;
    }

    const missingHtmlCount = slides.filter((s) => !s.htmlContent || !s.htmlContent.trim()).length;
    if (missingHtmlCount > 0) {
      issues.push({
        level: 'error',
        messageEn: `${missingHtmlCount} slide(s) are missing rendered HTML.`,
        messageZh: `${missingHtmlCount} 页尚未生成 HTML 内容。`,
      });
    }

    const missingNotesCount = slides.filter((s) => !s.notes || !s.notes.trim()).length;
    if (missingNotesCount > 0) {
      issues.push({
        level: 'warning',
        messageEn: `${missingNotesCount} slide(s) have no speaker notes.`,
        messageZh: `${missingNotesCount} 页缺少演讲备注。`,
      });
    }

    const overflowRiskCount = slides.filter((s) => /overflow\s*:\s*(auto|scroll)/i.test(s.htmlContent || '')).length;
    if (overflowRiskCount > 0) {
      issues.push({
        level: 'warning',
        messageEn: `${overflowRiskCount} slide(s) may overflow in print (contains overflow:auto/scroll).`,
        messageZh: `${overflowRiskCount} 页可能在打印时溢出（含 overflow:auto/scroll）。`,
      });
    }

    const paletteColors = colorPalette.split(',').map((c) => c.trim());
    const ratio = contrastRatio(paletteColors[0] || '#0a0a0a', paletteColors[4] || '#ffffff');
    if (ratio !== null && ratio < 4.5) {
      issues.push({
        level: 'warning',
        messageEn: `Theme contrast ratio is ${ratio.toFixed(2)} (< 4.5). Readability risk on some displays/print.`,
        messageZh: `主题对比度为 ${ratio.toFixed(2)}（低于 4.5），在部分屏幕/打印场景可能影响可读性。`,
      });
    }

    if (issues.length === 0) {
      issues.push({
        level: 'pass',
        messageEn: 'All export checks passed.',
        messageZh: '导出检查全部通过。',
      });
    }

    return issues;
  };

  const requestExport = (format: ExportFormat) => {
    const issues = runExportChecks();
    setExportQaIssues(issues);
    setPendingExportFormat(format);
    setShowExportQa(true);
    setShowExportMenu(false);
  };

  const hasBlockingExportIssue = exportQaIssues.some((issue) => issue.level === 'error');

  const executePendingExport = () => {
    if (!pendingExportFormat) return;
    if (pendingExportFormat === 'html') {
      downloadFile(getFullHtml(), `deck-${config?.topic.replace(/\s+/g, '-').toLowerCase()}.html`, 'text/html');
    } else {
      const fullHtml = getFullHtml();
      const printScript = `
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 1000);
          };
        </script>
      `;
      const htmlToPrint = fullHtml.replace('</body>', `${printScript}</body>`);
      const printWindow = window.open('', '_blank', 'noopener,noreferrer');
      if (printWindow) {
        printWindow.opener = null;
        printWindow.document.open();
        printWindow.document.write(htmlToPrint);
        printWindow.document.close();
      }
    }
    setShowExportQa(false);
    setPendingExportFormat(null);
  };

  const toProjectFile = (): LocalProjectFile => ({
    version: PROJECT_FILE_VERSION,
    savedAt: new Date().toISOString(),
    status,
    config,
    colorPalette,
    slides,
    currentSlideId,
    totalCost,
  });

  const normalizeProjectFile = (raw: unknown): LocalProjectFile | null => {
    if (!raw || typeof raw !== 'object') return null;
    const candidate = raw as Partial<LocalProjectFile>;
    if (!Array.isArray(candidate.slides)) return null;

    const normalizedSlides = candidate.slides
      .filter((s): s is SlideData => !!s && typeof s === 'object')
      .map((s, index) => ({
        id: typeof s.id === 'string' && s.id ? s.id : `slide-${index}-${Date.now()}`,
        title: typeof s.title === 'string' ? s.title : `Slide ${index + 1}`,
        contentPoints: Array.isArray(s.contentPoints) ? s.contentPoints.map((p) => String(p)) : [],
        htmlContent: typeof s.htmlContent === 'string' ? s.htmlContent : null,
        notes: typeof s.notes === 'string' ? s.notes : '',
        layoutSuggestion: typeof s.layoutSuggestion === 'string' ? s.layoutSuggestion : 'Standard',
        isRegenerating: false,
        cost: typeof s.cost === 'number' ? s.cost : 0,
      }));

    const resolvedStatus = Object.values(GenerationStatus).includes(candidate.status as GenerationStatus)
      ? candidate.status as GenerationStatus
      : GenerationStatus.IDLE;

    return {
      version: typeof candidate.version === 'number' ? candidate.version : 1,
      savedAt: typeof candidate.savedAt === 'string' ? candidate.savedAt : new Date().toISOString(),
      status: resolvedStatus,
      config: candidate.config && typeof candidate.config === 'object' ? candidate.config as PresentationConfig : null,
      colorPalette: typeof candidate.colorPalette === 'string' ? candidate.colorPalette : '',
      slides: normalizedSlides,
      currentSlideId: typeof candidate.currentSlideId === 'string' ? candidate.currentSlideId : null,
      totalCost: typeof candidate.totalCost === 'number' ? candidate.totalCost : 0,
    };
  };

  const applyProjectFile = (project: LocalProjectFile) => {
    setStatus(project.status);
    setConfig(project.config);
    setColorPalette(project.colorPalette || '');
    setSlides(project.slides);
    setCurrentSlideId(project.currentSlideId);
    setTotalCost(project.totalCost || 0);
    setIsPaused(false);
    setShowExportMenu(false);
    shouldStopRef.current = false;
    slideRetryCountRef.current = {};
    setShowRecoveredBanner(false);
  };

  const handleSaveProject = () => {
    const project = toProjectFile();
    const filenameBase = (config?.topic || 'gendeck-project').replace(/\s+/g, '-').toLowerCase();
    downloadFile(JSON.stringify(project, null, 2), `${filenameBase}.gendeck.json`, 'application/json');
  };

  const handleOpenProjectClick = () => {
    openProjectInputRef.current?.click();
  };

  const handleOpenProjectFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      try {
        const rawText = String(loadEvent.target?.result || '');
        const parsed = JSON.parse(rawText);
        const project = normalizeProjectFile(parsed);
        if (!project) {
          throw new Error('Invalid project file format');
        }
        applyProjectFile(project);
      } catch {
        alert(language === 'zh' ? '项目文件无效，无法打开。' : 'Invalid project file. Could not open.');
      } finally {
        event.target.value = '';
      }
    };
    reader.readAsText(file);
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
    const win = window.open('', '_blank', 'noopener,noreferrer');
    if (win) {
      win.opener = null;
      win.document.write(fullHtml);
      win.document.close();
    }
  };

  const currentSlide = slides.find(s => s.id === currentSlideId);
  const hasNotes = slides.some(s => s.notes && s.notes.trim().length > 0);

  // Calculate generation progress
  const generatedCount = slides.filter(s => s.htmlContent).length;
  const progressPercent = slides.length > 0 ? (generatedCount / slides.length) * 100 : 0;
  const stageInfo = (() => {
    switch (status) {
      case GenerationStatus.GENERATING_OUTLINE:
        return {
          label: language === 'zh' ? '阶段 1/2：生成大纲' : 'Stage 1/2: Outline',
          hint: language === 'zh' ? '正在分析内容并建立演示结构' : 'Analyzing content and structuring slides'
        };
      case GenerationStatus.REVIEWING_OUTLINE:
        return {
          label: language === 'zh' ? '阶段 1/2：请确认大纲' : 'Stage 1/2: Review',
          hint: language === 'zh' ? '编辑大纲后继续生成页面' : 'Refine the outline before rendering slides'
        };
      case GenerationStatus.GENERATING_SLIDES:
        return {
          label: language === 'zh'
            ? `阶段 2/2：渲染页面 ${generatedCount}/${slides.length}`
            : `Stage 2/2: Rendering ${generatedCount}/${slides.length}`,
          hint: language === 'zh' ? '可以暂停、恢复或取消生成' : 'You can pause, resume, or cancel generation'
        };
      case GenerationStatus.COMPLETE:
        return {
          label: language === 'zh' ? '已完成：可以预览和导出' : 'Complete: Ready to export',
          hint: language === 'zh' ? '建议先快速预览后导出 PDF/HTML' : 'Preview once, then export PDF/HTML'
        };
      default:
        return null;
    }
  })();

  // Use centralized theme classes
  const themeClasses = 'bg-slate-950 text-slate-100 selection:bg-purple-500/30 selection:text-purple-100';

  const bgGradient = 'from-purple-900/20 via-slate-950 to-slate-950';

  return (
    <div className={`h-screen flex flex-col overflow-hidden font-sans relative ${themeClasses}`}>
      {/* Animated Background Gradient */}
      <div className={`absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] ${bgGradient} pointer-events-none`} />
      <input
        ref={openProjectInputRef}
        type="file"
        accept=".json,.gendeck.json"
        className="hidden"
        onChange={handleOpenProjectFile}
      />

      {showRecoveredBanner && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[90]">
          <div className={cx('px-4 py-2 rounded-lg border text-xs flex items-center gap-3', 'bg-emerald-900/60 border-emerald-500/30 text-emerald-100')}>
            <span>{language === 'zh' ? '已恢复上次未完成项目。' : 'Recovered your last in-progress project.'}</span>
            <button
              onClick={() => setShowRecoveredBanner(false)}
              className="underline decoration-dotted underline-offset-2 hover:opacity-80"
            >
              {language === 'zh' ? '关闭' : 'Dismiss'}
            </button>
          </div>
        </div>
      )}

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
        'border-white/5 bg-slate-950/80'
      )}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/25 ring-1 ring-white/20">G</div>
          <h1 className={cls(
            'text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r',
            'from-white via-slate-200 to-slate-400'
          )}>GenDeck</h1>
        </div>

        <div className="flex items-center gap-3">
            {/* Language Switcher -->
            <button
                onClick={() => setLanguage(l => l === 'en' ? 'zh' : 'en')}
                className={cx('flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all', th.button.primary)}
                title="Switch Language"
            >
                <Languages className="w-3.5 h-3.5" />
                <span className="font-medium">{language === 'en' ? 'EN' : '中文'}</span>
            </button>

            <button
              onClick={handleOpenProjectClick}
              className={cx('flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all', th.button.primary)}
              title={language === 'zh' ? '打开项目文件' : 'Open project file'}
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === 'zh' ? '打开项目' : 'Open Project'}</span>
            </button>

            <button
              onClick={handleSaveProject}
              className={cx('flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all', th.button.primary)}
              title={language === 'zh' ? '保存项目文件' : 'Save project file'}
            >
              <Save className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{language === 'zh' ? '保存项目' : 'Save Project'}</span>
            </button>

            {/* Cost Display */}
            {totalCost > 0 && (
            <div className={cx('hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm', 'bg-slate-900/80 border-emerald-500/20')}>
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                <span className={cx('text-xs font-mono', th.text.secondary)}>
                {t('estCost')}: ${totalCost.toFixed(4)}
                </span>
            </div>
            )}

            {/* Auto-save indicator */}
            {slides.length > 0 && (
              <div className={cx('hidden md:flex items-center gap-1.5 px-2 py-1 rounded-full border', 'bg-slate-800/50 border-white/5')} title={language === 'zh' ? '已自动保存' : 'Auto-saved'}>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className={cx('text-[10px] font-medium', th.text.muted)}>{language === 'zh' ? '已保存' : 'Saved'}</span>
              </div>
            )}

            {stageInfo && (
              <div className={cx('hidden lg:flex flex-col px-3 py-1.5 rounded-lg border min-w-[220px]', 'bg-slate-900/80 border-white/10')}>
                <span className={cx('text-[11px] font-semibold', 'text-violet-200')}>{stageInfo.label}</span>
                <span className={cx('text-[10px]', th.text.muted)}>{stageInfo.hint}</span>
              </div>
            )}

            {(status === GenerationStatus.GENERATING_SLIDES || status === GenerationStatus.COMPLETE) && (
              <div className="flex items-center gap-2">
                 {status === GenerationStatus.GENERATING_SLIDES && (
                   <div className={cx('flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-sm', 'bg-purple-500/10 text-purple-200 border-purple-500/20')}>
                     <Loader2 className="w-3.5 h-3.5 animate-spin" />
                     <span className="text-xs font-medium">{t('generating')} {Math.round(progressPercent)}%</span>
                     <div className={cx('h-3 w-px mx-1', 'bg-purple-500/20')} />
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
                        <div className={cx('absolute top-full right-0 mt-2 w-48 backdrop-blur-xl rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 border', 'bg-slate-900/95 border-white/10')}>
                          <div className="p-1">
                             <button
                               onClick={() => requestExport('html')}
                               className={cx('w-full text-left px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors', th.button.ghost)}
                             >
                               <FileJson className="w-4 h-4" />
                               {t('downloadHtml')}
                             </button>
                             <button
                               onClick={() => requestExport('pdf')}
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
      <main className={cx('flex-1 overflow-hidden relative', )}>
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
            colorPalette={colorPalette}
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
                 onColorPaletteChange={setColorPalette}
                 lang={language}
                 t={t}
                 theme={theme}
               />

               {/* Notes Generation CTA Overlay if complete but no notes */}
               {status === GenerationStatus.COMPLETE && !hasNotes && !isGeneratingNotes && (
                   <div className="absolute bottom-6 right-6 z-40">
                      <button
                        onClick={handleGenerateNotes}
                        className={cx('backdrop-blur px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-bottom-4 transition-all border', 'bg-slate-900/90 hover:bg-slate-800 text-white border-white/10 hover:border-white/20 shadow-black/20')}
                      >
                         <MessageSquareText className={cx('w-4 h-4', 'text-green-400')} />
                         {t('generateNotes')}
                      </button>
                   </div>
               )}

               {isGeneratingNotes && (
                   <div className="absolute bottom-6 right-6 z-40">
                      <div className={cx('backdrop-blur px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 text-sm font-medium border', 'bg-slate-900/90 text-white border-white/10 shadow-black/20')}>
                         <Loader2 className={cx('w-4 h-4 animate-spin', 'text-green-400')} />
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
          <div className={cx('absolute inset-0 backdrop-blur-sm transition-opacity', 'bg-slate-950/80')} />

          {/* Modal Content */}
          <div className={cx('relative border rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-in fade-in zoom-in-95 duration-200', 'bg-slate-900 border-white/10')}>
            {/* Header */}
            <div className={cx('flex items-center gap-3 px-6 py-5 border-b', 'border-white/5')}>
              <div className={cx('w-10 h-10 rounded-xl flex items-center justify-center ring-1', 'bg-amber-500/10 ring-amber-500/20')}>
                <Plus className={cx('w-5 h-5', 'text-amber-400')} />
              </div>
              <div>
                <h3 className={cx('text-lg font-semibold', th.text.primary)}>{t('new')}</h3>
                <p className={cx('text-sm', th.text.muted)}>{t('confirmNew')}</p>
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-4">
              <div className={cx('flex items-start gap-3 text-sm', th.text.secondary)}>
                <div className={cx('w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ring-1', 'bg-red-500/10 ring-red-500/20')}>
                  <span className={cx('font-bold text-xs', 'text-red-400')}>!</span>
                </div>
                <p>{language === 'zh' ? '当前演示文稿的所有进度都将被清除，包括已生成的幻灯片和设置。此操作无法撤销。' : 'All progress on the current presentation will be cleared, including generated slides and settings. This action cannot be undone.'}</p>
              </div>
            </div>

            {/* Footer */}
            <div className={cx('flex items-center justify-end gap-3 px-6 py-4 border-t rounded-b-2xl', 'border-white/5 bg-slate-900/50')}>
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

      {showExportQa && (
        <div
          className="fixed inset-0 z-[210] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowExportQa(false);
              setPendingExportFormat(null);
            }
          }}
        >
          <div className={cx('absolute inset-0 backdrop-blur-sm transition-opacity', 'bg-slate-950/80')} />
          <div className={cx('relative border rounded-2xl shadow-2xl max-w-2xl w-full transform transition-all animate-in fade-in zoom-in-95 duration-200', 'bg-slate-900 border-white/10')}>
            <div className={cx('flex items-center gap-3 px-6 py-5 border-b', 'border-white/5')}>
              <div className={cx('w-10 h-10 rounded-xl flex items-center justify-center ring-1', 'bg-violet-500/10 ring-violet-500/20')}>
                <Download className={cx('w-5 h-5', 'text-violet-300')} />
              </div>
              <div>
                <h3 className={cx('text-lg font-semibold', th.text.primary)}>
                  {language === 'zh' ? '导出前检查' : 'Pre-export Check'}
                </h3>
                <p className={cx('text-sm', th.text.muted)}>
                  {language === 'zh'
                    ? `目标格式：${pendingExportFormat === 'pdf' ? 'PDF' : 'HTML'}`
                    : `Target format: ${pendingExportFormat === 'pdf' ? 'PDF' : 'HTML'}`}
                </p>
              </div>
            </div>
            <div className="px-6 py-4 space-y-2 max-h-[50vh] overflow-y-auto">
              {exportQaIssues.map((issue, idx) => (
                <div
                  key={`${issue.level}-${idx}`}
                  className={cx(
                    'p-3 rounded-lg border text-sm',
                    issue.level === 'error' && 'bg-red-500/10 border-red-500/30 text-red-200',
                    issue.level === 'warning' && 'bg-amber-500/10 border-amber-500/30 text-amber-200',
                    issue.level === 'pass' && 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                  )}
                >
                  {language === 'zh' ? issue.messageZh : issue.messageEn}
                </div>
              ))}
            </div>
            <div className={cx('flex items-center justify-end gap-3 px-6 py-4 border-t rounded-b-2xl', 'border-white/5 bg-slate-900/50')}>
              <button
                onClick={() => {
                  setShowExportQa(false);
                  setPendingExportFormat(null);
                }}
                className={cx('px-4 py-2 text-sm font-medium rounded-lg transition-all border', th.button.primary)}
              >
                {language === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={executePendingExport}
                disabled={hasBlockingExportIssue}
                className={cx(
                  'px-4 py-2 text-sm font-medium text-white rounded-lg transition-all shadow-lg',
                  hasBlockingExportIssue
                    ? 'bg-gray-600/50 cursor-not-allowed shadow-none'
                    : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 shadow-purple-500/20'
                )}
              >
                {hasBlockingExportIssue
                  ? (language === 'zh' ? '请先修复阻断问题' : 'Resolve blocking issues first')
                  : (language === 'zh' ? '继续导出' : 'Export anyway')}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;
