
import React, { useState, useEffect, useCallback } from 'react';
import { PresentationConfig, SlideData, OutlineItem, GenerationStatus } from './types';
import InputForm from './components/InputForm';
import Sidebar from './components/Sidebar';
import SlidePreview from './components/SlidePreview';
import OutlineEditor from './components/OutlineEditor';
import { generateOutline, generateSlideHtml, generateSpeakerNotes } from './services/geminiService';
import { Download, DollarSign, Eye, FileText, FileJson, ChevronDown, MessageSquareText, Loader2, MoreVertical } from 'lucide-react';

const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [config, setConfig] = useState<PresentationConfig | null>(null);
  const [colorPalette, setColorPalette] = useState<string>(''); // New State for palette
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [currentSlideId, setCurrentSlideId] = useState<string | null>(null);
  const [totalCost, setTotalCost] = useState(0);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

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
        currentConfig.apiSettings
      );

      setTotalCost(prev => prev + result.cost);

      setSlides(prev => {
        const next = prev.map(s => s.id === slideToProcess.id ? { ...s, htmlContent: result.data, isRegenerating: false } : s);
        // Trigger next item in queue
        setTimeout(() => processSlideQueue(next, currentConfig, palette), 100); 
        return next;
      });
    } catch (e) {
      console.error("Failed to generate slide", slideToProcess.id, e);
      setSlides(prev => prev.map(s => s.id === slideToProcess.id ? { ...s, isRegenerating: false } : s));
    }
  }, []);

  // Step 1: Generate Outline Only
  const handleGenerateOutline = async (newConfig: PresentationConfig) => {
    setConfig(newConfig);
    setStatus(GenerationStatus.GENERATING_OUTLINE);
    setSlides([]);
    setCurrentSlideId(null);
    setTotalCost(0); // Reset cost for new deck

    try {
      const result = await generateOutline(
        newConfig.documentContent, 
        newConfig.topic, 
        newConfig.audience,
        newConfig.purpose, // Pass the purpose here
        newConfig.slideCount,
        newConfig.apiSettings
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

    } catch (error) {
      console.error(error);
      setStatus(GenerationStatus.ERROR);
      alert("Failed to generate outline. Please check your settings, API Key, or text content.");
    }
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
  <title>GenDeck - ${config?.topic}</title>
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

    /* Print Overrides */
    @media print {
      @page {
        size: 1920px 1080px;
        margin: 0;
      }
      body, html { background: white; height: auto; overflow: visible; }
      #deck-container { 
        position: static; 
        width: auto; 
        height: auto; 
        transform: none !important; 
        display: block !important; 
      }
      .slide { 
        position: relative; 
        width: 1920px;
        height: 1080px;
        top: auto; 
        left: auto; 
        display: block !important; 
        margin: 0; 
        page-break-after: always; 
        break-after: page; 
        box-shadow: none;
        overflow: visible !important;
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

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white overflow-hidden font-sans">
      {/* Header */}
      <header className="h-16 border-b border-gray-800 bg-gray-900 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg">G</div>
          <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">GenDeck</h1>
        </div>
        
        {/* Cost Display */}
        {totalCost > 0 && (
          <div className="hidden md:flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-full border border-gray-700">
            <DollarSign className="w-3 h-3 text-green-400" />
            <span className="text-xs font-mono text-gray-300">Est. Cost: ${totalCost.toFixed(4)}</span>
          </div>
        )}
        
        {status === GenerationStatus.REVIEWING_OUTLINE && (
           <div className="text-sm text-gray-400 font-medium">Outline Editor</div>
        )}

        {(status === GenerationStatus.GENERATING_SLIDES || status === GenerationStatus.COMPLETE) && slides.length > 0 && (
          <div className="flex items-center gap-2 md:gap-4">
             <div className="text-xs text-gray-500 hidden lg:block">
               {status === GenerationStatus.GENERATING_SLIDES 
                 ? `Generating slides... (${slides.filter(s => s.htmlContent).length}/${slides.length})` 
                 : 'Presentation Ready'}
             </div>

             {/* Speaker Notes Button */}
             <button 
               onClick={handleGenerateNotes}
               disabled={isGeneratingNotes}
               className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 ${
                 hasNotes 
                   ? 'bg-blue-900/30 text-blue-300 border-blue-800 hover:bg-blue-900/50' 
                   : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
               }`}
               title={hasNotes ? 'Regenerate Speaker Notes' : 'Generate Speaker Notes'}
             >
                {isGeneratingNotes ? <Loader2 className="w-3 h-3 animate-spin" /> : <MessageSquareText className="w-3 h-3" />}
                <span className="hidden md:inline">{hasNotes ? 'Regenerate Notes' : 'Generate Notes'}</span>
             </button>
             
             {/* Preview Button */}
             <button 
               onClick={handlePreview}
               className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all border border-gray-600"
               title="Preview in new tab"
             >
               <Eye className="w-4 h-4" />
               <span className="hidden sm:inline">Preview</span>
             </button>

             {/* Explicit Download HTML Button (Fixed Visibility) */}
             <button 
               onClick={handleExportHtml}
               className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-purple-900/30 border border-purple-500"
               title="Download HTML Deck"
             >
               <Download className="w-4 h-4" />
               <span>Download HTML</span>
             </button>

             {/* Export Menu for other options */}
             <div className="relative">
               <button 
                 onClick={() => setShowExportMenu(!showExportMenu)}
                 className="bg-gray-800 hover:bg-gray-700 text-gray-400 px-2 py-2 rounded-lg text-sm font-medium flex items-center justify-center transition-all border border-gray-700"
                 title="More export options"
               >
                 <MoreVertical className="w-4 h-4" />
               </button>
               
               {showExportMenu && (
                 <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
                   <div className="px-4 py-2 text-[10px] font-semibold text-gray-500 uppercase tracking-wider bg-gray-900/50">Other Formats</div>
                   <button onClick={handleExportMarkdown} className="w-full text-left px-4 py-3 hover:bg-gray-700 flex items-center gap-2 text-sm text-gray-200 border-t border-gray-700">
                     <FileJson className="w-4 h-4 text-green-400" /> Outline (Markdown)
                   </button>
                   <button onClick={handleExportNotes} className="w-full text-left px-4 py-3 hover:bg-gray-700 flex items-center gap-2 text-sm text-gray-200 border-t border-gray-700">
                     <FileText className="w-4 h-4 text-blue-400" /> Speaker Notes (Txt)
                   </button>
                 </div>
               )}
             </div>
             
             <button 
               onClick={() => {
                 setSlides([]);
                 setConfig(null);
                 setStatus(GenerationStatus.IDLE);
                 setTotalCost(0);
               }}
               className="text-gray-400 hover:text-white text-sm ml-2"
             >
               New
             </button>
          </div>
        )}
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {status === GenerationStatus.IDLE || status === GenerationStatus.ERROR || status === GenerationStatus.GENERATING_OUTLINE ? (
           <div className="w-full h-full overflow-y-auto p-4 md:p-10">
             <InputForm onGenerate={handleGenerateOutline} isGenerating={status === GenerationStatus.GENERATING_OUTLINE} />
           </div>
        ) : status === GenerationStatus.REVIEWING_OUTLINE ? (
           <OutlineEditor 
             slides={slides}
             onUpdateSlides={handleUpdateSlides}
             onConfirm={handleConfirmOutline}
             onCancel={handleCancelOutline}
           />
        ) : (
          <>
            <Sidebar 
              slides={slides} 
              currentSlideId={currentSlideId} 
              onSelectSlide={setCurrentSlideId}
              isGeneratingAll={status === GenerationStatus.GENERATING_SLIDES}
            />
            <SlidePreview 
              slide={currentSlide} 
              onRegenerate={handleRegenerateSlide}
              styleDescription={config?.audience || ""}
              colorPalette={colorPalette}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default App;
