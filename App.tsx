
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { PresentationConfig, SlideData, OutlineItem, GenerationStatus, Language, Theme } from './types';
import InputForm from './components/InputForm';
import Sidebar from './components/Sidebar';
import SlidePreview from './components/SlidePreview';
import OutlineEditor from './components/OutlineEditor';
import { generateOutline, generateSlideHtml, generateSpeakerNotes } from './services/geminiService';
import { Download, DollarSign, Eye, FileText, FileJson, ChevronDown, MessageSquareText, Loader2, Languages, Play, Pause, XCircle, Printer, Plus, Sun, Moon } from 'lucide-react';
import { TRANSLATIONS } from './constants';

const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('gendeck_lang');
    return (saved === 'en' || saved === 'zh') ? saved : 'en';
  });

  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('gendeck_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    return 'dark';
  });
  
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [config, setConfig] = useState<PresentationConfig | null>(null);
  const [colorPalette, setColorPalette] = useState<string>('');
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [currentSlideId, setCurrentSlideId] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState(0);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showNewDeckConfirm, setShowNewDeckConfirm] = useState(false);
  
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

  useEffect(() => {
    localStorage.setItem('gendeck_theme', theme);
    // Apply theme class to document for global styling
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
    
    // 4. Reset the stop flag so future generations can proceed
    shouldStopRef.current = false;
  };

  // Cancel new deck confirmation
  const cancelNewDeck = () => {
    setShowNewDeckConfirm(false);
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
  
  <button class="theme-toggle no-print" onclick="toggleTheme()" id="themeBtn">☀ Light Mode</button>

  <div id="deck-container">
    ${slides.map((s, i) => s.htmlContent).join('\n')}
  </div>

  <div class="nav-controls no-print">
    <div class="nav-btn" onclick="prevSlide()">←</div>
    <div class="page-indicator" id="pageIndicator">1 / ${slides.length}</div>
    <div class="nav-btn" onclick="nextSlide()">→</div>
    <div class="nav-btn" onclick="toggleFullScreen()" title="Fullscreen">⛶</div>
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

  const themeClasses = theme === 'dark' 
    ? 'bg-slate-950 text-slate-100 selection:bg-purple-500/30 selection:text-purple-100'
    : 'bg-gray-50 text-gray-900 selection:bg-purple-200 selection:text-purple-900';

  const bgGradient = theme === 'dark'
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
      <header className={`h-16 border-b backdrop-blur-xl flex items-center justify-between px-6 z-50 relative ${
        theme === 'dark' 
          ? 'border-white/5 bg-slate-950/80' 
          : 'border-gray-200/50 bg-white/70'
      }`}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-purple-500/25 ring-1 ring-white/20">G</div>
          <h1 className={`text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${
            theme === 'dark' ? 'from-white via-slate-200 to-slate-400' : 'from-gray-900 via-gray-700 to-gray-600'
          }`}>GenDeck</h1>
        </div>
        
        <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
              className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-all ${
                theme === 'dark'
                  ? 'bg-slate-900/80 hover:bg-slate-800 border-white/10 hover:border-white/20 text-slate-400 hover:text-yellow-400'
                  : 'bg-white/80 hover:bg-white border-gray-200 hover:border-gray-300 text-gray-600 hover:text-orange-500'
              }`}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Language Switcher */}
            <button 
                onClick={() => setLanguage(l => l === 'en' ? 'zh' : 'en')}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                  theme === 'dark'
                    ? 'text-slate-400 hover:text-white bg-slate-900/80 hover:bg-slate-800 border-white/10 hover:border-white/20'
                    : 'text-gray-600 hover:text-gray-900 bg-white/80 hover:bg-white border-gray-200 hover:border-gray-300'
                }`}
                title="Switch Language"
            >
                <Languages className="w-3.5 h-3.5" />
                <span className="font-medium">{language === 'en' ? 'EN' : '中文'}</span>
            </button>

            {/* Cost Display */}
            {totalCost > 0 && (
            <div className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full border shadow-sm ${
              theme === 'dark'
                ? 'bg-slate-900/80 border-emerald-500/20'
                : 'bg-white/80 border-emerald-500/30'
            }`}>
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                <span className={`text-xs font-mono ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
                {t('estCost')}: ${totalCost.toFixed(4)}
                </span>
            </div>
            )}

            {status === GenerationStatus.REVIEWING_OUTLINE && (
            <div className={`px-3 py-1.5 rounded-full text-xs font-medium animate-pulse ${
              theme === 'dark'
                ? 'bg-blue-500/10 text-blue-300 border border-blue-500/20'
                : 'bg-blue-100 text-blue-700 border border-blue-200'
            }`}>
                {t('outlineEditor')}
            </div>
            )}
            
            {(status === GenerationStatus.GENERATING_SLIDES || status === GenerationStatus.COMPLETE) && (
              <div className="flex items-center gap-2">
                 {status === GenerationStatus.GENERATING_SLIDES && (
                   <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border backdrop-blur-sm ${
                     theme === 'dark'
                       ? 'bg-purple-500/10 text-purple-200 border-purple-500/20'
                       : 'bg-purple-100 text-purple-700 border-purple-200'
                   }`}>
                     <Loader2 className="w-3.5 h-3.5 animate-spin" />
                     <span className="text-xs font-medium">{t('generating')} {Math.round(progressPercent)}%</span>
                     <div className={`h-3 w-px mx-1 ${theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-300'}`} />
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
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                        theme === 'dark'
                          ? 'bg-slate-900/80 hover:bg-slate-800 text-white border-white/10 hover:border-white/20'
                          : 'bg-white/80 hover:bg-white text-gray-900 border-gray-200 hover:border-gray-300'
                      } border`}
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">{t('otherFormats')}</span>
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    
                    {showExportMenu && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setShowExportMenu(false)}></div>
                        <div className={`absolute top-full right-0 mt-2 w-48 backdrop-blur-xl rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 border ${
                          theme === 'dark'
                            ? 'bg-slate-900/95 border-white/10'
                            : 'bg-white/95 border-gray-200'
                        }`}>
                          <div className="p-1">
                             <button 
                               onClick={handleExportHtml}
                               className={`w-full text-left px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors ${
                                 theme === 'dark'
                                   ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                                   : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                               }`}
                             >
                               <FileJson className="w-4 h-4" />
                               {t('downloadHtml')}
                             </button>
                             <button 
                               onClick={handleExportPdf}
                               className={`w-full text-left px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors ${
                                 theme === 'dark'
                                   ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                                   : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                               }`}
                             >
                               <Printer className="w-4 h-4" />
                               {t('exportPdf')}
                             </button>
                             <button 
                               onClick={handleExportMarkdown}
                               className={`w-full text-left px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors ${
                                 theme === 'dark'
                                   ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                                   : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                               }`}
                             >
                               <FileText className="w-4 h-4" />
                               {t('exportOutline')}
                             </button>
                             <button 
                               onClick={handleExportNotes}
                               className={`w-full text-left px-4 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors ${
                                 theme === 'dark'
                                   ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                                   : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                               }`}
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
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-all ml-2 ${
                  theme === 'dark'
                    ? 'bg-slate-900/80 hover:bg-slate-800 text-white border-white/10 hover:border-white/20'
                    : 'bg-white/80 hover:bg-white text-gray-900 border-gray-200 hover:border-gray-300'
                }`}
                title={t('new')}
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">{t('new')}</span>
              </button>
            )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className={`flex-1 overflow-hidden relative ${theme === 'light' ? 'bg-gray-50/50' : ''}`}>
        {(status === GenerationStatus.IDLE || status === GenerationStatus.GENERATING_OUTLINE) && (
          <div className="h-full overflow-y-auto">
            <InputForm 
              onGenerate={handleGenerateOutline} 
              onCancel={handleCancelOutlineGeneration}
              isGenerating={status === GenerationStatus.GENERATING_OUTLINE} 
              lang={language}
              t={t}
              theme={theme}
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
                        className={`backdrop-blur px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 text-sm font-medium animate-in fade-in slide-in-from-bottom-4 transition-all border ${
                          theme === 'dark'
                            ? 'bg-slate-900/90 hover:bg-slate-800 text-white border-white/10 hover:border-white/20 shadow-black/20'
                            : 'bg-white/90 hover:bg-white text-gray-900 border-gray-200 hover:border-gray-300 shadow-gray-200/50'
                        }`}
                      >
                         <MessageSquareText className={`w-4 h-4 ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
                         {t('generateNotes')}
                      </button>
                   </div>
               )}

               {isGeneratingNotes && (
                   <div className="absolute bottom-6 right-6 z-40">
                      <div className={`backdrop-blur px-4 py-2 rounded-lg shadow-xl flex items-center gap-2 text-sm font-medium border ${
                        theme === 'dark'
                          ? 'bg-slate-900/90 text-white border-white/10 shadow-black/20'
                          : 'bg-white/90 text-gray-900 border-gray-200 shadow-gray-200/50'
                      }`}>
                         <Loader2 className={`w-4 h-4 animate-spin ${theme === 'dark' ? 'text-green-400' : 'text-green-600'}`} />
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
          <div className={`absolute inset-0 backdrop-blur-sm transition-opacity ${
            theme === 'dark' ? 'bg-slate-950/80' : 'bg-gray-900/40'
          }`} />
          
          {/* Modal Content */}
          <div className={`relative border rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-in fade-in zoom-in-95 duration-200 ${
            theme === 'dark'
              ? 'bg-slate-900 border-white/10'
              : 'bg-white border-gray-200'
          }`}>
            {/* Header */}
            <div className={`flex items-center gap-3 px-6 py-5 border-b ${
              theme === 'dark' ? 'border-white/5' : 'border-gray-100'
            }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ring-1 ${
                theme === 'dark'
                  ? 'bg-amber-500/10 ring-amber-500/20'
                  : 'bg-amber-100 ring-amber-200'
              }`}>
                <Plus className={`w-5 h-5 ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`} />
              </div>
              <div>
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('new')}</h3>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>{t('confirmNew')}</p>
              </div>
            </div>
            
            {/* Body */}
            <div className="px-6 py-4">
              <div className={`flex items-start gap-3 text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-gray-600'}`}>
                <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ring-1 ${
                  theme === 'dark'
                    ? 'bg-red-500/10 ring-red-500/20'
                    : 'bg-red-100 ring-red-200'
                }`}>
                  <span className={`font-bold text-xs ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>!</span>
                </div>
                <p>{language === 'zh' ? '当前演示文稿的所有进度都将被清除，包括已生成的幻灯片和设置。此操作无法撤销。' : 'All progress on the current presentation will be cleared, including generated slides and settings. This action cannot be undone.'}</p>
              </div>
            </div>
            
            {/* Footer */}
            <div className={`flex items-center justify-end gap-3 px-6 py-4 border-t rounded-b-2xl ${
              theme === 'dark'
                ? 'border-white/5 bg-slate-900/50'
                : 'border-gray-100 bg-gray-50/50'
            }`}>
              <button
                onClick={cancelNewDeck}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all border ${
                  theme === 'dark'
                    ? 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border-white/5'
                    : 'text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-100 border-gray-200'
                }`}
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
    </div>
  );
};

export default App;
