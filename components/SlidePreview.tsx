
import React, { useState, useRef, useEffect } from 'react';
import { SlideData, Language, Theme } from '../types';
import { RefreshCw, Code, ZoomIn, ZoomOut, Maximize, Monitor, Sun, Moon, CheckCircle, AlertTriangle } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { getThemeClasses, cx } from '../styles/theme';

interface SlidePreviewProps {
  slide: SlideData | undefined;
  onRegenerate: (id: string, customPrompt?: string) => void;
  colorPalette: string;
  lang: Language;
  t: (key: keyof typeof TRANSLATIONS['en']) => string;
  theme: Theme;
}

const DESIGN_CONSTRAINTS = [
  "Dimensions: 1920x1080px (Strict)",
  "Theme: CSS Variables (Light/Dark)",
  "Assets: Inline SVGs only (No bitmaps)",
  "Layout: Unique styles for Cover/Ending"
];

const SlidePreview: React.FC<SlidePreviewProps> = ({ slide, onRegenerate, colorPalette, lang, t, theme }) => {
  const [showCode, setShowCode] = useState(false);
  const [customInstruction, setCustomInstruction] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [scale, setScale] = useState(0.5);
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to Dark Mode (root)
  const containerRef = useRef<HTMLDivElement>(null);

  const th = getThemeClasses(theme);
  const isDark = theme === 'dark';

  // Parse palette to CSS variables
  // colors[0]: Dark BG
  // colors[1]: Dark Surface
  // colors[2]: Accent (Used in both modes)
  // colors[3]: Light BG / Dark Text
  const colors = colorPalette.split(',').map(c => c.trim());
  const themeStyles = {
    '--c-bg': colors[0] || '#111',
    '--c-surface': colors[1] || '#222',
    '--c-accent': colors[2] || '#4f46e5',
    '--c-text': colors[3] || '#fff',
    '--c-text-muted': (colors[3] || '#fff') + '99',
  } as React.CSSProperties;

  // Light mode override
  const lightThemeStyles = {
    '--c-bg': colors[3] || '#fff',
    '--c-surface': '#f3f4f6',
    '--c-accent': colors[2] || '#4f46e5', // Use the specific accent color for light mode too
    '--c-text': colors[0] || '#000',
    '--c-text-muted': (colors[0] || '#000') + '99',
  } as React.CSSProperties;

  const activeStyles = isDarkMode ? themeStyles : lightThemeStyles;

  // Auto-fit logic
  const fitToScreen = () => {
    if (containerRef.current) {
      const padding = 60;
      const availableWidth = containerRef.current.clientWidth - padding;
      const availableHeight = containerRef.current.clientHeight - padding;

      const scaleX = availableWidth / 1920;
      const scaleY = availableHeight / 1080;

      const fitScale = Math.min(scaleX, scaleY);
      setScale(fitScale > 0 ? fitScale : 0.5);
    }
  };

  useEffect(() => {
    fitToScreen();
    const observer = new ResizeObserver(() => fitToScreen());
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [slide, showCode]);

  // Reset confirmation state when closing edit panel or switching slides
  useEffect(() => {
    if (!isEditing) setShowConfirmation(false);
  }, [isEditing, slide?.id]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2.0));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.1));
  const handleFit = () => fitToScreen();

  if (!slide) {
    return (
      <div className={cx('flex-1 flex flex-col items-center justify-center h-full p-8 text-center border-l', th.bg.primary, th.text.muted, th.border.primary)}>
        <div className={cx('w-16 h-16 mb-4 rounded-2xl flex items-center justify-center ring-1', isDark ? 'bg-slate-900/50 ring-white/10' : 'bg-gray-100 ring-gray-200')}>
          <Monitor className={cx('w-8 h-8', isDark ? 'text-slate-600' : 'text-gray-400')} />
        </div>
        <p className={cx('text-xl font-medium', isDark ? '' : 'text-gray-600')}>{t('noSlideSelected')}</p>
        <p className={cx('text-sm mt-2 max-w-md', th.text.tertiary)}>{t('selectSlidePrompt')}</p>
      </div>
    );
  }

  const handleApplyClick = () => {
    if (slide.htmlContent) {
      setShowConfirmation(true);
    } else {
      performRegeneration();
    }
  };

  const performRegeneration = () => {
    onRegenerate(slide.id, customInstruction);
    setIsEditing(false);
    setShowConfirmation(false);
    setCustomInstruction('');
  };

  // Get theme toggle button styles
  const getThemeToggleStyles = () => {
    if (isDarkMode) {
      return isDark
        ? 'bg-slate-900 border-white/10 text-yellow-400 hover:bg-slate-800'
        : 'bg-gray-800 border-gray-600 text-yellow-400 hover:bg-gray-700';
    } else {
      return isDark
        ? 'bg-slate-200 border-white/20 text-orange-500 hover:bg-slate-300'
        : 'bg-gray-100 border-gray-200 text-orange-500 hover:bg-gray-200';
    }
  };

  return (
    <div className={cx('flex-1 flex flex-col h-full border-l relative', th.bg.primary, th.border.primary)}>
      {/* Toolbar */}
      <div className={cx('h-14 backdrop-blur flex items-center justify-between px-4 shrink-0 z-20 relative border-b', th.bg.glass, th.border.primary)}>
        <div className="flex items-center gap-3 overflow-hidden">
           <h3 className={cx('text-sm font-semibold truncate max-w-[200px]', th.text.secondary)} title={slide.title}>{slide.title}</h3>
           {slide.isRegenerating && <span className="text-xs text-purple-400 flex items-center gap-1 shrink-0"><RefreshCw className="w-3 h-3 animate-spin"/> {t('updating')}</span>}
        </div>

        {/* Center: Zoom */}
        {!showCode && (
          <div className={cx('hidden md:flex items-center rounded-lg border p-1 mx-2', isDark ? 'bg-slate-950 border-white/10' : 'bg-white border-gray-200')}>
            <button onClick={handleZoomOut} className={cx('p-1.5 rounded-lg transition-colors', th.button.ghost)} title={t('zoomOut')}><ZoomOut className="w-3.5 h-3.5" /></button>
            <span className={cx('text-[10px] w-10 text-center font-mono', th.text.tertiary)}>{Math.round(scale * 100)}%</span>
            <button onClick={handleZoomIn} className={cx('p-1.5 rounded-lg transition-colors', th.button.ghost)} title={t('zoomIn')}><ZoomIn className="w-3.5 h-3.5" /></button>
            <div className="w-px h-3 bg-white/10 mx-1"></div>
            <button onClick={handleFit} className={cx('p-1.5 rounded-lg transition-colors', th.button.ghost)} title={t('fitToScreen')}><Maximize className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
           {/* Theme Toggle */}
           <button
             onClick={() => setIsDarkMode(!isDarkMode)}
             className={cx('p-2 rounded-lg transition-all border', getThemeToggleStyles())}
             title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
           >
             {isDarkMode ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
           </button>

           <div className={cx('w-px h-4 mx-1', th.border.divider)} />

           <button
             onClick={() => setIsEditing(!isEditing)}
             disabled={slide.isRegenerating}
             className={cx(
               'text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 border',
               isEditing
                 ? 'bg-slate-600 text-white'
                 : isDark
                   ? 'bg-slate-800 text-white hover:bg-slate-700 border-white/10'
                   : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border-gray-200'
             )}
           >
             <RefreshCw className={`w-3.5 h-3.5 ${slide.isRegenerating ? 'animate-spin' : ''}`} />
             {t('regenerate')}
           </button>
           <button
             onClick={() => setShowCode(!showCode)}
             className={cx(
               'text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 border',
               showCode
                 ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/25'
                 : isDark
                   ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-white/10'
                   : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200'
             )}
           >
             <Code className="w-3.5 h-3.5" />
             {showCode ? t('previewView') : t('code')}
           </button>
        </div>
      </div>

      {/* Regeneration Input Panel */}
      {isEditing && (
        <div className={cx('absolute top-14 left-0 right-0 z-30 backdrop-blur border-b p-4 shadow-xl animate-in fade-in slide-in-from-top-2', isDark ? 'bg-slate-900/95 border-white/5 shadow-black/20' : 'bg-gray-50/95 border-gray-200 shadow-gray-200/20')}>
          <label className={cx('block text-sm font-medium mb-2', th.text.secondary)}>{t('instructions')}</label>
          <div className="flex gap-2 mb-4">
             {!showConfirmation ? (
                <>
                  <input
                    type="text"
                    value={customInstruction}
                    onChange={(e) => setCustomInstruction(e.target.value)}
                    placeholder={t('instructionPlaceholder')}
                    className={cx('flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all border', th.input.bg, th.input.border, th.input.text, th.input.focusBorder)}
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyClick()}
                  />
                  <button
                    onClick={handleApplyClick}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all shadow-lg shadow-purple-500/20"
                  >
                    {t('apply')}
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className={cx('px-4 py-2 rounded-lg text-sm font-medium transition-all border', isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-white/10' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border-gray-200')}
                  >
                    {t('cancel')}
                  </button>
                </>
             ) : (
                <div className="flex-1 flex items-center justify-between bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2 animate-in fade-in zoom-in-95">
                    <span className="text-red-200 text-sm font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        {t('overwriteConfirm')}
                    </span>
                    <div className="flex gap-2">
                         <button
                           onClick={() => setShowConfirmation(false)}
                           className="text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg hover:bg-white/10 transition-colors"
                         >
                           {t('cancel')}
                         </button>
                         <button
                           onClick={performRegeneration}
                           className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all shadow-lg shadow-red-500/20"
                         >
                           {t('yesRegenerate')}
                         </button>
                    </div>
                </div>
             )}
          </div>

          {/* Design Checklist */}
          {!showConfirmation && (
            <div className="bg-slate-950/50 p-3 rounded-lg border border-white/5">
               <div className="flex items-center gap-2 mb-2">
                 <span className={cx('text-[10px] font-bold uppercase tracking-wider', th.text.muted)}>{t('constraints')}</span>
                 <div className="h-px bg-white/5 flex-1"></div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4">
                 {DESIGN_CONSTRAINTS.map((c, i) => (
                   <div key={i} className="flex items-center gap-2">
                     <CheckCircle className="w-3 h-3 text-emerald-500/80" />
                     <span className={cx('text-[11px]', th.text.secondary)}>{c}</span>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>
      )}

      {/* Content Area */}
      <div ref={containerRef} className="flex-1 overflow-hidden relative bg-black/10 w-full h-full">
        {slide.htmlContent ? (
           showCode ? (
             <div className={cx('w-full h-full p-4 overflow-auto', isDark ? 'bg-slate-950' : 'bg-gray-50')}>
               <pre className={cx('text-xs font-mono whitespace-pre-wrap font-medium', isDark ? 'text-emerald-400' : 'text-emerald-600')}>
                 {slide.htmlContent}
               </pre>
             </div>
           ) : (
              <div
                style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    width: 1920,
                    height: 1080,
                    transform: `translate(-50%, -50%) scale(${scale})`,
                    transformOrigin: 'center center',
                    transition: 'transform 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                    boxShadow: '0 0 100px rgba(0,0,0,0.7)',
                    backfaceVisibility: 'hidden',
                    ...activeStyles
                }}
                className={`overflow-hidden shadow-2xl ${isDarkMode ? '' : 'theme-light'}`}
              >
                  {/* The Dangerous HTML is rendered here. */}
                  <div
                    className="w-full h-full"
                    dangerouslySetInnerHTML={{ __html: slide.htmlContent }}
                  />

                  {slide.isRegenerating && (
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                       <RefreshCw className="w-12 h-12 animate-spin text-purple-400 mb-3" />
                       <span className="text-white font-medium text-lg drop-shadow-md">{t('regeneratingSlide')}</span>
                    </div>
                  )}
              </div>
           )
        ) : (
          <div className={cx('w-full h-full flex flex-col items-center justify-center', th.text.muted)}>
             {slide.isRegenerating ? (
               <div className="flex flex-col items-center animate-pulse">
                  <RefreshCw className="w-10 h-10 animate-spin text-purple-400 mb-2" />
                  <span className={cx('text-sm font-medium', th.text.secondary)}>{t('generatingDesign')}</span>
               </div>
             ) : (
               <div className={cx('text-center p-6 border-2 border-dashed rounded-xl', th.border.secondary)}>
                 <p>{t('waitingGeneration')}</p>
                 <p className={cx('text-xs mt-1', th.text.muted)}>{t('checkSidebar')}</p>
               </div>
             )}
          </div>
        )}
      </div>

      {/* Notes footer */}
      <div className={cx('h-32 backdrop-blur border-t p-4 overflow-y-auto shrink-0 z-20', th.bg.sidebar, th.border.primary)}>
        <h4 className={cx('text-xs font-semibold uppercase tracking-wider mb-1 flex items-center gap-2', th.text.muted)}>
          <Code className="w-3 h-3" /> {t('speakerNotes')}
        </h4>
        {slide.notes ? (
           <p className={cx('text-sm leading-relaxed whitespace-pre-line font-serif', th.text.secondary)}>{slide.notes}</p>
        ) : (
           <p className={cx('text-sm italic', th.text.muted)}>{t('noNotes')}</p>
        )}
      </div>
    </div>
  );
};

export default SlidePreview;
