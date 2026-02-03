
import React, { useState, useRef, useEffect } from 'react';
import { SlideData } from '../types';
import { RefreshCw, Code, ZoomIn, ZoomOut, Maximize, Monitor, Sun, Moon, CheckCircle, AlertTriangle } from 'lucide-react';

interface SlidePreviewProps {
  slide: SlideData | undefined;
  onRegenerate: (id: string, customPrompt?: string) => void;
  styleDescription: string;
  colorPalette: string;
}

const DESIGN_CONSTRAINTS = [
  "Dimensions: 1920x1080px (Strict)",
  "Theme: CSS Variables (Light/Dark)",
  "Assets: Inline SVGs only (No bitmaps)",
  "Layout: Unique styles for Cover/Ending"
];

const SlidePreview: React.FC<SlidePreviewProps> = ({ slide, onRegenerate, colorPalette }) => {
  const [showCode, setShowCode] = useState(false);
  const [customInstruction, setCustomInstruction] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [scale, setScale] = useState(0.5); 
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to Dark Mode (root)
  const containerRef = useRef<HTMLDivElement>(null);

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
      <div className="flex-1 flex flex-col items-center justify-center h-full bg-gray-900 text-gray-500 p-8 text-center border-l border-gray-800">
        <div className="w-16 h-16 mb-4 rounded-full bg-gray-800 flex items-center justify-center">
          <Monitor className="w-8 h-8 text-gray-600" />
        </div>
        <p className="text-xl font-medium">No Slide Selected</p>
        <p className="text-sm mt-2 max-w-md">Select a slide from the sidebar to preview, regenerate, or edit.</p>
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

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-900 border-l border-gray-800 relative">
      {/* Toolbar */}
      <div className="h-14 border-b border-gray-700 bg-gray-800 flex items-center justify-between px-4 shrink-0 z-20 relative">
        <div className="flex items-center gap-3 overflow-hidden">
           <h3 className="text-sm font-semibold text-gray-300 truncate max-w-[200px]" title={slide.title}>{slide.title}</h3>
           {slide.isRegenerating && <span className="text-xs text-purple-400 flex items-center gap-1 shrink-0"><RefreshCw className="w-3 h-3 animate-spin"/> Updating...</span>}
        </div>
        
        {/* Center: Zoom */}
        {!showCode && (
          <div className="hidden md:flex items-center bg-gray-900 rounded-lg border border-gray-700 p-1 mx-2">
            <button onClick={handleZoomOut} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="Zoom Out"><ZoomOut className="w-3 h-3" /></button>
            <span className="text-[10px] w-10 text-center text-gray-400 font-mono">{Math.round(scale * 100)}%</span>
            <button onClick={handleZoomIn} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="Zoom In"><ZoomIn className="w-3 h-3" /></button>
            <div className="w-px h-3 bg-gray-700 mx-1"></div>
            <button onClick={handleFit} className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white" title="Fit to Screen"><Maximize className="w-3 h-3" /></button>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
           {/* Theme Toggle */}
           <button
             onClick={() => setIsDarkMode(!isDarkMode)}
             className={`p-2 rounded-lg transition-colors border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-yellow-400' : 'bg-gray-200 border-gray-300 text-orange-500'}`}
             title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
           >
             {isDarkMode ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
           </button>

           <div className="w-px h-4 bg-gray-700 mx-1" />

           <button 
             onClick={() => setIsEditing(!isEditing)}
             disabled={slide.isRegenerating}
             className={`text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-2 ${isEditing ? 'bg-gray-600 text-white' : 'bg-gray-700 text-white hover:bg-gray-600'}`}
           >
             <RefreshCw className={`w-3 h-3 ${slide.isRegenerating ? 'animate-spin' : ''}`} />
             Regenerate
           </button>
           <button 
             onClick={() => setShowCode(!showCode)}
             className={`text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-2 ${showCode ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
           >
             <Code className="w-3 h-3" />
             {showCode ? 'Preview' : 'Code'}
           </button>
        </div>
      </div>

      {/* Regeneration Input Panel */}
      {isEditing && (
        <div className="absolute top-14 left-0 right-0 z-30 bg-gray-800 border-b border-gray-700 p-4 shadow-xl animate-in fade-in slide-in-from-top-2">
          <label className="block text-sm font-medium text-gray-300 mb-2">Instructions for regeneration</label>
          <div className="flex gap-2 mb-4">
             {!showConfirmation ? (
                <>
                  <input 
                    type="text" 
                    value={customInstruction}
                    onChange={(e) => setCustomInstruction(e.target.value)}
                    placeholder="e.g., Change layout to compare two items..."
                    className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:ring-1 focus:ring-purple-500 outline-none"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleApplyClick()}
                  />
                  <button 
                    onClick={handleApplyClick}
                    className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                  >
                    Apply
                  </button>
                  <button 
                    onClick={() => setIsEditing(false)}
                    className="bg-gray-700 hover:bg-gray-600 text-gray-300 px-4 py-2 rounded text-sm font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </>
             ) : (
                <div className="flex-1 flex items-center justify-between bg-red-900/20 border border-red-500/50 rounded-lg px-4 py-2 animate-in fade-in zoom-in-95">
                    <span className="text-red-200 text-sm font-medium flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        Overwrite current slide design?
                    </span>
                    <div className="flex gap-2">
                         <button 
                           onClick={() => setShowConfirmation(false)} 
                           className="text-xs text-gray-300 hover:text-white px-3 py-1.5 rounded hover:bg-gray-700"
                         >
                           Cancel
                         </button>
                         <button 
                           onClick={performRegeneration} 
                           className="bg-red-600 hover:bg-red-500 text-white px-4 py-1.5 rounded text-xs font-bold transition-colors shadow-lg shadow-red-900/50"
                         >
                           Yes, Regenerate
                         </button>
                    </div>
                </div>
             )}
          </div>
          
          {/* Design Checklist */}
          {!showConfirmation && (
            <div className="bg-gray-900/50 p-3 rounded border border-gray-700">
               <div className="flex items-center gap-2 mb-2">
                 <span className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Active System Constraints</span>
                 <div className="h-px bg-gray-700 flex-1"></div>
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-4">
                 {DESIGN_CONSTRAINTS.map((c, i) => (
                   <div key={i} className="flex items-center gap-2">
                     <CheckCircle className="w-3 h-3 text-green-500/80" />
                     <span className="text-[11px] text-gray-300">{c}</span>
                   </div>
                 ))}
               </div>
            </div>
          )}
        </div>
      )}

      {/* Content Area */}
      <div ref={containerRef} className="flex-1 overflow-hidden relative bg-black/90 w-full h-full">
        {slide.htmlContent ? (
           showCode ? (
             <div className="w-full h-full bg-gray-900 p-4 overflow-auto">
               <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap font-medium">
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
                       <span className="text-white font-medium text-lg drop-shadow-md">Regenerating Slide...</span>
                    </div>
                  )}
              </div>
           )
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
             {slide.isRegenerating ? (
               <div className="flex flex-col items-center animate-pulse">
                  <RefreshCw className="w-10 h-10 animate-spin text-purple-500 mb-2" />
                  <span className="text-sm font-medium text-gray-300">Generating Slide Design...</span>
               </div>
             ) : (
               <div className="text-center p-6 border-2 border-dashed border-gray-700 rounded-xl">
                 <p>Waiting for generation...</p>
                 <p className="text-xs text-gray-600 mt-1">Check the sidebar or click Regenerate</p>
               </div>
             )}
          </div>
        )}
      </div>
      
      {/* Notes footer */}
      <div className="h-32 bg-gray-900 border-t border-gray-800 p-4 overflow-y-auto shrink-0 z-20">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 flex items-center gap-2">
          <Code className="w-3 h-3" /> Speaker Notes
        </h4>
        {slide.notes ? (
           <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line font-serif">{slide.notes}</p>
        ) : (
           <p className="text-sm text-gray-600 italic">No notes available. Use the "Generate Notes" button in the Outline view or Export menu.</p>
        )}
      </div>
    </div>
  );
};

export default SlidePreview;
