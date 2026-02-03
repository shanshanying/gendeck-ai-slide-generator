
import React, { useState } from 'react';
import { SlideData } from '../types';
import { Trash2, Plus, MoveUp, MoveDown, ArrowRight, ArrowLeft, PaintBucket, ChevronDown, ChevronUp, Type, AlignLeft, AlignCenter, Bold, Layout, FileDown, Columns, Grip, Calendar, BarChart2, Quote } from 'lucide-react';
import { COLOR_THEMES } from '../constants';

interface OutlineEditorProps {
  slides: SlideData[];
  onUpdateSlides: (slides: SlideData[]) => void;
  onConfirm: (colorPalette: string) => void;
  onCancel: () => void;
}

const OutlineEditor: React.FC<OutlineEditorProps> = ({ 
  slides, 
  onUpdateSlides, 
  onConfirm, 
  onCancel
}) => {
  const [colorPalette, setColorPalette] = useState(COLOR_THEMES[0].colors.join(', '));
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  
  const handleUpdateSlide = (id: string, field: keyof SlideData, value: any) => {
    onUpdateSlides(slides.map(slide => 
      slide.id === id ? { ...slide, [field]: value } : slide
    ));
  };

  const handleUpdatePoints = (id: string, text: string) => {
    const points = text.split('\n');
    handleUpdateSlide(id, 'contentPoints', points);
  };

  const handleUpdateSubtitle = (id: string, text: string) => {
    // For cover/ending slides, contentPoints[0] is often used as subtitle/summary
    handleUpdateSlide(id, 'contentPoints', [text]);
  };

  const handleCoverStyle = (id: string, type: 'modern' | 'elegant' | 'bold') => {
    let suggestion = "Layout: Cover. ";
    switch (type) {
        case 'modern':
            suggestion += "Style: Modern, Clean, Sans-Serif. Align: Left. High contrast.";
            break;
        case 'elegant':
            suggestion += "Style: Elegant, Serif Font for Title. Align: Centered. Italic subtitle.";
            break;
        case 'bold':
            suggestion += "Style: Impactful, Massive Typography, All Caps. Align: Left or Center.";
            break;
    }
    handleUpdateSlide(id, 'layoutSuggestion', suggestion);
  };

  const handleEndingStyle = (id: string, type: 'minimal' | 'contact' | 'brand') => {
    let suggestion = "Layout: Ending. ";
    switch (type) {
        case 'minimal':
            suggestion += "Style: Minimalist. Centered 'Thank You'. Clean background.";
            break;
        case 'contact':
            suggestion += "Style: Professional. Include placeholder contact details (email, phone, website) below thank you.";
            break;
        case 'brand':
            suggestion += "Style: Brand Focused. Massive Logo Placeholder in center, company slogan.";
            break;
    }
    handleUpdateSlide(id, 'layoutSuggestion', suggestion);
  };

  const handleStandardLayout = (id: string, type: 'standard' | 'split' | 'grid' | 'timeline' | 'data' | 'quote') => {
    let suggestion = "";
    switch (type) {
        case 'standard':
            suggestion = "Layout: Standard. Bullet points on left, relevant icon/graphic on right.";
            break;
        case 'split':
            suggestion = "Layout: Compare. Split screen comparison (Left vs Right).";
            break;
        case 'grid':
            suggestion = "Layout: Grid. 3 or 4 feature cards with icons.";
            break;
        case 'timeline':
            suggestion = "Layout: Timeline. Horizontal process flow or steps.";
            break;
        case 'data':
            suggestion = "Layout: Data. Focus on a large metric, statistic, or chart visualization.";
            break;
        case 'quote':
            suggestion = "Layout: Center. Single powerful quote or statement in the middle.";
            break;
    }
    handleUpdateSlide(id, 'layoutSuggestion', suggestion);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const newSlides = slides.filter(s => s.id !== id);
    onUpdateSlides(newSlides);
  };

  const handleAddSlide = () => {
    const newSlide: SlideData = {
      id: Math.random().toString(36).substr(2, 9),
      title: "New Slide",
      contentPoints: ["Add your content here"],
      htmlContent: null,
      notes: "",
      layoutSuggestion: "Layout: Standard. Title and Body.",
      isRegenerating: false
    };
    // Insert before the last slide (Ending) if possible
    if (slides.length > 1) {
        const newSlides = [...slides];
        newSlides.splice(slides.length - 1, 0, newSlide);
        onUpdateSlides(newSlides);
    } else {
        onUpdateSlides([...slides, newSlide]);
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === slides.length - 1)) return;
    
    const newSlides = [...slides];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newSlides[index], newSlides[targetIndex]] = [newSlides[targetIndex], newSlides[index]];
    onUpdateSlides(newSlides);
  };

  const handleDownloadOutline = () => {
    const md = slides.map(s => {
        return `## ${s.title}\n**Layout:** ${s.layoutSuggestion || 'Standard'}\n\n${s.contentPoints.map(p => `- ${p}`).join('\n')}`;
    }).join('\n\n---\n\n');
    
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `presentation-outline.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="w-full max-w-[95%] mx-auto p-6 h-full flex flex-col">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-white">Review & Style</h2>
          <p className="text-gray-400 text-sm">Refine your structure, choose layouts, and pick a theme.</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={handleDownloadOutline}
             className="px-3 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700 transition-colors flex items-center gap-2"
             title="Export Outline as Markdown"
           >
             <FileDown className="w-4 h-4" />
           </button>
           <button 
             onClick={onCancel}
             className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700 transition-colors flex items-center gap-2"
           >
             <ArrowLeft className="w-4 h-4" /> Back
           </button>
           <button 
             onClick={() => onConfirm(colorPalette)}
             className="px-6 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg transition-transform active:scale-95 flex items-center gap-2"
           >
             Generate Slides <ArrowRight className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* Theme Selection Section - Collapsible */}
      <div className="mb-8 bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shrink-0 transition-all duration-300">
         <button 
           onClick={() => setIsPaletteOpen(!isPaletteOpen)}
           className="w-full px-6 py-4 flex items-center justify-between bg-gray-800/50 hover:bg-gray-750 transition-colors"
         >
            <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
               <PaintBucket className="w-4 h-4 text-yellow-400"/> Select Color Palette
            </h3>
            {isPaletteOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
         </button>
         
         {isPaletteOpen && (
           <div className="p-6 pt-0 animate-in slide-in-from-top-2 fade-in duration-200">
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
                {COLOR_THEMES.map((theme) => {
                  const isActive = colorPalette === theme.colors.join(', ');
                  return (
                    <button 
                      key={theme.id}
                      type="button"
                      onClick={() => setColorPalette(theme.colors.join(', '))}
                      className={`p-3 rounded-lg border text-left transition-all ${isActive ? 'bg-gray-700 border-yellow-500 ring-1 ring-yellow-500 shadow-md' : 'bg-gray-900 border-gray-700 hover:bg-gray-800'}`}
                    >
                      <div className="flex gap-1.5 mb-2">
                         {theme.colors.map((c, i) => (
                           <div key={i} style={{backgroundColor: c}} className="w-4 h-4 rounded-full border border-gray-600/50 shadow-sm" />
                         ))}
                      </div>
                      <span className={`text-xs font-medium block truncate ${isActive ? 'text-white' : 'text-gray-400'}`}>{theme.label}</span>
                    </button>
                  );
                })}
             </div>
             
             <div className="flex items-center gap-3">
                 <label className="text-xs text-gray-500 whitespace-nowrap">Custom Palette:</label>
                 <input 
                    type="text"
                    value={colorPalette}
                    onChange={(e) => setColorPalette(e.target.value)}
                    className="flex-1 bg-gray-900 border border-gray-600 rounded px-3 py-1.5 text-white text-sm focus:ring-1 focus:ring-yellow-500 focus:outline-none font-mono"
                    placeholder="#000000, #FFFFFF, #FF0000 (Custom Hex Codes)"
                  />
             </div>
           </div>
         )}
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-8 pb-20">
        {slides.map((slide, index) => {
          const isCover = index === 0;
          const isEnding = index === slides.length - 1 && slides.length > 1;

          return (
            <div key={slide.id} className={`bg-gray-800 border ${isCover ? 'border-purple-500/30 bg-purple-900/10' : isEnding ? 'border-blue-500/30 bg-blue-900/10' : 'border-gray-700'} rounded-xl p-6 shadow-lg group hover:border-gray-600 transition-all`}>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-700/50">
                 <div className="flex items-center gap-4 w-full">
                   <span className={`text-sm font-mono w-8 h-8 flex items-center justify-center rounded-full shrink-0 ${isCover ? 'bg-purple-600 text-white font-bold' : isEnding ? 'bg-blue-600 text-white font-bold' : 'bg-gray-700 text-gray-300'}`}>
                     {index + 1}
                   </span>
                   <div className="flex-1">
                      {isCover && <span className="text-[10px] uppercase tracking-wider text-purple-400 font-bold mb-1 block">Cover Page</span>}
                      {isEnding && <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold mb-1 block">Ending / Summary</span>}
                      <input 
                        type="text" 
                        value={slide.title}
                        onChange={(e) => handleUpdateSlide(slide.id, 'title', e.target.value)}
                        className={`bg-transparent border-none font-bold text-white focus:ring-0 w-full placeholder-gray-500 focus:bg-gray-900/50 rounded px-2 ${isCover ? 'text-2xl' : 'text-xl'}`}
                        placeholder="Slide Title"
                      />
                   </div>
                 </div>
                 <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => handleMove(index, 'up')} className="p-2 hover:bg-gray-700 rounded text-gray-400" title="Move Up"><MoveUp className="w-4 h-4"/></button>
                   <button onClick={() => handleMove(index, 'down')} className="p-2 hover:bg-gray-700 rounded text-gray-400" title="Move Down"><MoveDown className="w-4 h-4"/></button>
                   <button 
                    type="button"
                    onClick={(e) => handleDelete(e, slide.id)} 
                    className="p-2 hover:bg-red-900/50 hover:text-red-400 rounded text-gray-400 ml-2 cursor-pointer transition-colors" 
                    title="Delete"
                   >
                     <Trash2 className="w-4 h-4"/>
                   </button>
                 </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {isCover ? (
                    // Cover Page Specific Editor
                    <>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col">
                                <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
                                Subtitle
                                </label>
                                <textarea 
                                value={slide.contentPoints[0] || ''}
                                onChange={(e) => handleUpdateSubtitle(slide.id, e.target.value)}
                                className="w-full flex-1 bg-gray-900/30 border border-gray-700 rounded-lg p-4 text-base text-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 focus:outline-none min-h-[120px] resize-y leading-relaxed shadow-inner"
                                placeholder="Presentation subtitle or summary..."
                                />
                            </div>
                            
                            <div className="flex flex-col">
                                <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
                                Title Style
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button 
                                        onClick={() => handleCoverStyle(slide.id, 'modern')}
                                        className="flex flex-col items-center justify-center p-3 rounded border border-gray-700 hover:bg-gray-700 hover:border-gray-500 transition-all text-gray-400 hover:text-white"
                                    >
                                        <AlignLeft className="w-4 h-4 mb-1" />
                                        <span className="text-[10px]">Modern Left</span>
                                    </button>
                                    <button 
                                        onClick={() => handleCoverStyle(slide.id, 'elegant')}
                                        className="flex flex-col items-center justify-center p-3 rounded border border-gray-700 hover:bg-gray-700 hover:border-gray-500 transition-all text-gray-400 hover:text-white"
                                    >
                                        <div className="flex gap-0.5"><Type className="w-4 h-4 mb-1" /><AlignCenter className="w-4 h-4 mb-1" /></div>
                                        <span className="text-[10px]">Elegant Serif</span>
                                    </button>
                                    <button 
                                        onClick={() => handleCoverStyle(slide.id, 'bold')}
                                        className="flex flex-col items-center justify-center p-3 rounded border border-gray-700 hover:bg-gray-700 hover:border-gray-500 transition-all text-gray-400 hover:text-white"
                                    >
                                        <Bold className="w-4 h-4 mb-1" />
                                        <span className="text-[10px]">Big & Bold</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col">
                             <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">Visual / Layout Notes</label>
                             <textarea
                               value={slide.layoutSuggestion || ''}
                               onChange={(e) => handleUpdateSlide(slide.id, 'layoutSuggestion', e.target.value)}
                               className="w-full flex-1 bg-gray-900/30 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 focus:outline-none min-h-[250px] resize-y leading-relaxed shadow-inner"
                               placeholder="Instructions for the AI designer..."
                             />
                        </div>
                    </>
                ) : isEnding ? (
                    // Ending Page Specific Editor
                    <>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col">
                                <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
                                Closing Message
                                </label>
                                <textarea 
                                value={slide.contentPoints[0] || ''}
                                onChange={(e) => handleUpdateSubtitle(slide.id, e.target.value)}
                                className="w-full flex-1 bg-gray-900/30 border border-gray-700 rounded-lg p-4 text-base text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none min-h-[120px] resize-y leading-relaxed shadow-inner"
                                placeholder="Thank you for your time..."
                                />
                            </div>
                            
                            <div className="flex flex-col">
                                <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">
                                Ending Style
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button 
                                        onClick={() => handleEndingStyle(slide.id, 'minimal')}
                                        className="flex flex-col items-center justify-center p-3 rounded border border-gray-700 hover:bg-gray-700 hover:border-gray-500 transition-all text-gray-400 hover:text-white"
                                    >
                                        <div className="w-4 h-4 border border-gray-400 rounded-sm mb-1" />
                                        <span className="text-[10px]">Minimal</span>
                                    </button>
                                    <button 
                                        onClick={() => handleEndingStyle(slide.id, 'contact')}
                                        className="flex flex-col items-center justify-center p-3 rounded border border-gray-700 hover:bg-gray-700 hover:border-gray-500 transition-all text-gray-400 hover:text-white"
                                    >
                                        <div className="flex gap-0.5"><Layout className="w-4 h-4 mb-1" /></div>
                                        <span className="text-[10px]">Contact Info</span>
                                    </button>
                                    <button 
                                        onClick={() => handleEndingStyle(slide.id, 'brand')}
                                        className="flex flex-col items-center justify-center p-3 rounded border border-gray-700 hover:bg-gray-700 hover:border-gray-500 transition-all text-gray-400 hover:text-white"
                                    >
                                        <div className="w-4 h-4 bg-gray-500 rounded-full mb-1" />
                                        <span className="text-[10px]">Brand Focus</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col">
                             <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">Visual / Layout Notes</label>
                             <textarea
                               value={slide.layoutSuggestion || ''}
                               onChange={(e) => handleUpdateSlide(slide.id, 'layoutSuggestion', e.target.value)}
                               className="w-full flex-1 bg-gray-900/30 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none min-h-[250px] resize-y leading-relaxed shadow-inner"
                               placeholder="Instructions for the AI designer..."
                             />
                        </div>
                    </>
                ) : (
                    // Standard Slide Editor
                    <>
                        <div className="flex flex-col">
                            <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 flex items-center justify-between">
                            Content Points
                            <span className="text-[10px] normal-case opacity-50 bg-gray-700 px-2 py-0.5 rounded">One point per line</span>
                            </label>
                            <textarea 
                            value={slide.contentPoints.join('\n')}
                            onChange={(e) => handleUpdatePoints(slide.id, e.target.value)}
                            className="w-full flex-1 bg-gray-900/30 border border-gray-700 rounded-lg p-4 text-base text-gray-200 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 focus:outline-none min-h-[250px] resize-y leading-relaxed shadow-inner"
                            placeholder="• Point 1&#10;• Point 2&#10;• Point 3"
                            />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold">Layout Preset</label>
                            </div>
                            
                            {/* Standard Slide Presets Grid */}
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                <button onClick={() => handleStandardLayout(slide.id, 'standard')} className="flex flex-col items-center p-2 rounded border border-gray-700 hover:bg-gray-700 text-gray-400 hover:text-white" title="Standard List">
                                    <Layout className="w-3 h-3 mb-1" /> <span className="text-[9px]">Standard</span>
                                </button>
                                <button onClick={() => handleStandardLayout(slide.id, 'split')} className="flex flex-col items-center p-2 rounded border border-gray-700 hover:bg-gray-700 text-gray-400 hover:text-white" title="Comparison">
                                    <Columns className="w-3 h-3 mb-1" /> <span className="text-[9px]">Compare</span>
                                </button>
                                <button onClick={() => handleStandardLayout(slide.id, 'grid')} className="flex flex-col items-center p-2 rounded border border-gray-700 hover:bg-gray-700 text-gray-400 hover:text-white" title="Grid/Cards">
                                    <Grip className="w-3 h-3 mb-1" /> <span className="text-[9px]">Grid</span>
                                </button>
                                <button onClick={() => handleStandardLayout(slide.id, 'timeline')} className="flex flex-col items-center p-2 rounded border border-gray-700 hover:bg-gray-700 text-gray-400 hover:text-white" title="Timeline">
                                    <Calendar className="w-3 h-3 mb-1" /> <span className="text-[9px]">Timeline</span>
                                </button>
                                <button onClick={() => handleStandardLayout(slide.id, 'data')} className="flex flex-col items-center p-2 rounded border border-gray-700 hover:bg-gray-700 text-gray-400 hover:text-white" title="Big Number/Chart">
                                    <BarChart2 className="w-3 h-3 mb-1" /> <span className="text-[9px]">Data</span>
                                </button>
                                <button onClick={() => handleStandardLayout(slide.id, 'quote')} className="flex flex-col items-center p-2 rounded border border-gray-700 hover:bg-gray-700 text-gray-400 hover:text-white" title="Quote/Center">
                                    <Quote className="w-3 h-3 mb-1" /> <span className="text-[9px]">Quote</span>
                                </button>
                            </div>

                            <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2">Visual / Layout Notes</label>
                            <textarea
                            value={slide.layoutSuggestion || ''}
                            onChange={(e) => handleUpdateSlide(slide.id, 'layoutSuggestion', e.target.value)}
                            className="w-full flex-1 bg-gray-900/30 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/20 focus:outline-none min-h-[120px] resize-y leading-relaxed shadow-inner"
                            placeholder="Describe layout ideas (e.g. 'Split screen with image on left') or style instructions..."
                            />
                        </div>
                    </>
                )}
              </div>
            </div>
          );
        })}
        
        <button 
          onClick={handleAddSlide}
          className="w-full py-6 border-2 border-dashed border-gray-700 rounded-xl text-gray-500 hover:text-purple-400 hover:border-purple-500/50 hover:bg-gray-800/50 transition-all flex items-center justify-center gap-3 font-semibold text-lg"
        >
          <Plus className="w-6 h-6" /> Add New Slide
        </button>
      </div>
    </div>
  );
};

export default OutlineEditor;
