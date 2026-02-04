
import React, { useState } from 'react';
import { SlideData, Language, Theme } from '../types';
import { Trash2, Plus, MoveUp, MoveDown, ArrowRight, ArrowLeft, PaintBucket, ChevronDown, ChevronUp, Type, AlignLeft, AlignCenter, Bold, Layout, FileDown, Columns, Grip, Calendar, BarChart2, Quote } from 'lucide-react';
import { COLOR_THEMES, TRANSLATIONS } from '../constants';

interface OutlineEditorProps {
  slides: SlideData[];
  onUpdateSlides: (slides: SlideData[]) => void;
  onConfirm: (colorPalette: string) => void;
  onCancel: () => void;
  lang: Language;
  t: (key: keyof typeof TRANSLATIONS['en']) => string;
  theme: Theme;
}

const OutlineEditor: React.FC<OutlineEditorProps> = ({ 
  slides, 
  onUpdateSlides, 
  onConfirm, 
  onCancel,
  lang,
  t,
  theme
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
      title: lang === 'zh' ? "新幻灯片" : "New Slide",
      contentPoints: [lang === 'zh' ? "在此添加内容" : "Add your content here"],
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
    <div className={`w-full max-w-[95%] mx-auto p-6 h-full flex flex-col ${theme === 'dark' ? 'bg-slate-900' : 'bg-white'}`}>
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{t('reviewStyle')}</h2>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-gray-500'}`}>{t('refineStructure')}</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={handleDownloadOutline}
             className={`px-3 py-2 rounded-lg transition-all flex items-center gap-2 ${theme === 'dark' ? 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-white/10 hover:border-white/20' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 hover:border-gray-300'}`}
             title={t('exportOutline')}
           >
             <FileDown className="w-4 h-4" />
           </button>
           <button 
             onClick={onCancel}
             className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 ${theme === 'dark' ? 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-white/10 hover:border-white/20' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 hover:border-gray-300'}`}
           >
             <ArrowLeft className="w-4 h-4" /> {t('back')}
           </button>
           <button 
             onClick={() => onConfirm(colorPalette)}
             className="px-6 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-purple-500/25 transition-all active:scale-95 flex items-center gap-2"
           >
             {t('generateSlidesBtn')} <ArrowRight className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* Theme Selection Section - Collapsible */}
      <div className={`mb-8 backdrop-blur rounded-xl overflow-hidden shrink-0 transition-all duration-300 ${theme === 'dark' ? 'bg-slate-900/50 border border-white/10' : 'bg-gray-50 border border-gray-200'}`}>
         <button 
           onClick={() => setIsPaletteOpen(!isPaletteOpen)}
           className={`w-full px-6 py-4 flex items-center justify-between transition-all ${theme === 'dark' ? 'bg-slate-900/50 hover:bg-slate-800/50' : 'bg-gray-50 hover:bg-gray-100'}`}
         >
            <h3 className={`text-sm font-semibold flex items-center gap-2 ${theme === 'dark' ? 'text-slate-300' : 'text-gray-700'}`}>
               <PaintBucket className="w-4 h-4 text-yellow-400"/> {t('selectPalette')}
            </h3>
            {isPaletteOpen ? <ChevronUp className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`} /> : <ChevronDown className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`} />}
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
                      className={`p-3 rounded-lg border text-left transition-all ${isActive ? (theme === 'dark' ? 'bg-slate-800 border-yellow-500/50 ring-1 ring-yellow-500/50 shadow-lg shadow-yellow-500/10' : 'bg-gray-100 border-yellow-500/50 ring-1 ring-yellow-500/50 shadow-lg shadow-yellow-500/10') : (theme === 'dark' ? 'bg-slate-950 border-white/5 hover:bg-slate-900 hover:border-white/10' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300')}`}
                    >
                      <div className="flex gap-1.5 mb-2">
                         {theme.colors.map((c, i) => (
                           <div key={i} style={{backgroundColor: c}} className="w-4 h-4 rounded-full border border-gray-600/50 shadow-sm" />
                         ))}
                      </div>
                      <span className={`text-xs font-medium block truncate ${isActive ? (theme === 'dark' ? 'text-white' : 'text-gray-900') : (theme === 'dark' ? 'text-slate-400' : 'text-gray-500')}`}>{theme.label}</span>
                    </button>
                  );
                })}
             </div>
             
             <div className="flex items-center gap-3">
                 <label className={`text-xs whitespace-nowrap ${theme === 'dark' ? 'text-slate-500' : 'text-gray-500'}`}>{t('customPalette')}</label>
                 <input 
                    type="text"
                    value={colorPalette}
                    onChange={(e) => setColorPalette(e.target.value)}
                    className={`flex-1 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 font-mono transition-all ${theme === 'dark' ? 'bg-slate-950 border border-white/10 text-white focus:border-yellow-500/50 focus:ring-yellow-500/20' : 'bg-white border border-gray-200 text-gray-900 focus:border-yellow-500/50 focus:ring-yellow-500/20'}`}
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
            <div key={slide.id} className={`backdrop-blur rounded-xl p-6 shadow-lg transition-all ${theme === 'dark' ? (isCover ? 'bg-purple-500/5 border-purple-500/20' : isEnding ? 'bg-blue-500/5 border-blue-500/20' : 'bg-slate-900/50 border-white/5 shadow-black/10') + ' group hover:border-white/10' : (isCover ? 'bg-purple-50 border-purple-200' : isEnding ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 shadow-gray-200/50') + ' group hover:border-gray-300'}`}>
              <div className={`flex items-center justify-between mb-6 pb-4 border-b ${theme === 'dark' ? 'border-gray-700/50' : 'border-gray-200'}`}>
                 <div className="flex items-center gap-4 w-full">
                   <span className={`text-sm font-mono w-8 h-8 flex items-center justify-center rounded-lg shrink-0 ${isCover ? 'bg-purple-600 text-white font-bold shadow-lg shadow-purple-500/25' : isEnding ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/25' : theme === 'dark' ? 'bg-slate-800 text-slate-300 ring-1 ring-white/10' : 'bg-gray-100 text-gray-600 ring-1 ring-gray-200'}`}>
                     {index + 1}
                   </span>
                   <div className="flex-1">
                      {isCover && <span className="text-[10px] uppercase tracking-wider text-purple-400 font-bold mb-1 block">{t('coverPage')}</span>}
                      {isEnding && <span className="text-[10px] uppercase tracking-wider text-blue-400 font-bold mb-1 block">{t('endingPage')}</span>}
                      <input 
                        type="text" 
                        value={slide.title}
                        onChange={(e) => handleUpdateSlide(slide.id, 'title', e.target.value)}
                        className={`bg-transparent border-none font-bold focus:ring-0 w-full rounded px-2 ${theme === 'dark' ? 'text-white placeholder-slate-500 focus:bg-slate-950/50' : 'text-gray-900 placeholder-gray-400 focus:bg-gray-50'} ${isCover ? 'text-2xl' : 'text-xl'}`}
                        placeholder={t('slideTitlePlaceholder')}
                      />
                   </div>
                 </div>
                 <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => handleMove(index, 'up')} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`} title="Move Up"><MoveUp className="w-4 h-4"/></button>
                   <button onClick={() => handleMove(index, 'down')} className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`} title="Move Down"><MoveDown className="w-4 h-4"/></button>
                   <button 
                    type="button"
                    onClick={(e) => handleDelete(e, slide.id)} 
                    className={`p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg ml-2 cursor-pointer transition-colors ${theme === 'dark' ? 'text-slate-400' : 'text-gray-400'}`} 
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
                                <label className={`block text-xs uppercase tracking-wider font-semibold mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {t('subtitle')}
                                </label>
                                <textarea 
                                value={slide.contentPoints[0] || ''}
                                onChange={(e) => handleUpdateSubtitle(slide.id, e.target.value)}
                                className={`w-full flex-1 rounded-lg p-4 text-base focus:ring-1 focus:outline-none min-h-[120px] resize-y leading-relaxed shadow-inner ${theme === 'dark' ? 'bg-gray-900/30 border border-gray-700 text-gray-200 focus:border-purple-500 focus:ring-purple-500/20' : 'bg-gray-50 border border-gray-200 text-gray-700 focus:border-purple-500 focus:ring-purple-500/20'}`}
                                placeholder={t('subtitlePlaceholder')}
                                />
                            </div>
                            
                            <div className="flex flex-col">
                                <label className={`block text-xs uppercase tracking-wider font-semibold mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {t('titleStyle')}
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button 
                                        onClick={() => handleCoverStyle(slide.id, 'modern')}
                                        className={`flex flex-col items-center justify-center p-3 rounded border transition-all ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700 hover:border-gray-500 text-gray-400 hover:text-white' : 'border-gray-200 hover:bg-gray-100 hover:border-gray-300 text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <AlignLeft className="w-4 h-4 mb-1" />
                                        <span className="text-[10px]">Modern Left</span>
                                    </button>
                                    <button 
                                        onClick={() => handleCoverStyle(slide.id, 'elegant')}
                                        className={`flex flex-col items-center justify-center p-3 rounded border transition-all ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700 hover:border-gray-500 text-gray-400 hover:text-white' : 'border-gray-200 hover:bg-gray-100 hover:border-gray-300 text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <div className="flex gap-0.5"><Type className="w-4 h-4 mb-1" /><AlignCenter className="w-4 h-4 mb-1" /></div>
                                        <span className="text-[10px]">Elegant Serif</span>
                                    </button>
                                    <button 
                                        onClick={() => handleCoverStyle(slide.id, 'bold')}
                                        className={`flex flex-col items-center justify-center p-3 rounded border transition-all ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700 hover:border-gray-500 text-gray-400 hover:text-white' : 'border-gray-200 hover:bg-gray-100 hover:border-gray-300 text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <Bold className="w-4 h-4 mb-1" />
                                        <span className="text-[10px]">Big & Bold</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col">
                             <label className={`block text-xs uppercase tracking-wider font-semibold mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{t('visualNotes')}</label>
                             <textarea
                               value={slide.layoutSuggestion || ''}
                               onChange={(e) => handleUpdateSlide(slide.id, 'layoutSuggestion', e.target.value)}
                               className={`w-full flex-1 rounded-lg p-4 text-sm focus:ring-1 focus:outline-none min-h-[250px] resize-y leading-relaxed shadow-inner ${theme === 'dark' ? 'bg-gray-900/30 border border-gray-700 text-gray-300 focus:border-purple-500 focus:ring-purple-500/20' : 'bg-gray-50 border border-gray-200 text-gray-600 focus:border-purple-500 focus:ring-purple-500/20'}`}
                               placeholder={t('visualNotesPlaceholder')}
                             />
                        </div>
                    </>
                ) : isEnding ? (
                    // Ending Page Specific Editor
                    <>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col">
                                <label className={`block text-xs uppercase tracking-wider font-semibold mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {t('closingMessage')}
                                </label>
                                <textarea 
                                value={slide.contentPoints[0] || ''}
                                onChange={(e) => handleUpdateSubtitle(slide.id, e.target.value)}
                                className="w-full flex-1 bg-gray-900/30 border border-gray-700 rounded-lg p-4 text-base text-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none min-h-[120px] resize-y leading-relaxed shadow-inner"
                                placeholder={t('closingPlaceholder')}
                                />
                            </div>
                            
                            <div className="flex flex-col">
                                <label className={`block text-xs uppercase tracking-wider font-semibold mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                {t('endingStyle')}
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button 
                                        onClick={() => handleEndingStyle(slide.id, 'minimal')}
                                        className={`flex flex-col items-center justify-center p-3 rounded border transition-all ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700 hover:border-gray-500 text-gray-400 hover:text-white' : 'border-gray-200 hover:bg-gray-100 hover:border-gray-300 text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <div className="w-4 h-4 border border-gray-400 rounded-sm mb-1" />
                                        <span className="text-[10px]">Minimal</span>
                                    </button>
                                    <button 
                                        onClick={() => handleEndingStyle(slide.id, 'contact')}
                                        className={`flex flex-col items-center justify-center p-3 rounded border transition-all ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700 hover:border-gray-500 text-gray-400 hover:text-white' : 'border-gray-200 hover:bg-gray-100 hover:border-gray-300 text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <div className="flex gap-0.5"><Layout className="w-4 h-4 mb-1" /></div>
                                        <span className="text-[10px]">Contact Info</span>
                                    </button>
                                    <button 
                                        onClick={() => handleEndingStyle(slide.id, 'brand')}
                                        className={`flex flex-col items-center justify-center p-3 rounded border transition-all ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700 hover:border-gray-500 text-gray-400 hover:text-white' : 'border-gray-200 hover:bg-gray-100 hover:border-gray-300 text-gray-500 hover:text-gray-700'}`}
                                    >
                                        <div className="w-4 h-4 bg-gray-500 rounded-full mb-1" />
                                        <span className="text-[10px]">Brand Focus</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col">
                             <label className={`block text-xs uppercase tracking-wider font-semibold mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{t('visualNotes')}</label>
                             <textarea
                               value={slide.layoutSuggestion || ''}
                               onChange={(e) => handleUpdateSlide(slide.id, 'layoutSuggestion', e.target.value)}
                               className="w-full flex-1 bg-gray-900/30 border border-gray-700 rounded-lg p-4 text-sm text-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 focus:outline-none min-h-[250px] resize-y leading-relaxed shadow-inner"
                               placeholder={t('visualNotesPlaceholder')}
                             />
                        </div>
                    </>
                ) : (
                    // Standard Slide Editor
                    <>
                        <div className="flex flex-col">
                            <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold mb-2 flex items-center justify-between">
                            {t('contentPoints')}
                            <span className={`text-[10px] normal-case opacity-50 px-2 py-0.5 rounded ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>{t('onePointPerLine')}</span>
                            </label>
                            <textarea 
                            value={slide.contentPoints.join('\n')}
                            onChange={(e) => handleUpdatePoints(slide.id, e.target.value)}
                            className={`w-full flex-1 rounded-lg p-4 text-base focus:ring-1 focus:outline-none min-h-[250px] resize-y leading-relaxed shadow-inner ${theme === 'dark' ? 'bg-gray-900/30 border border-gray-700 text-gray-200 focus:border-purple-500 focus:ring-purple-500/20' : 'bg-gray-50 border border-gray-200 text-gray-700 focus:border-purple-500 focus:ring-purple-500/20'}`}
                            placeholder={t('pointsPlaceholder')}
                            />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex justify-between items-center mb-2">
                                <label className="block text-xs uppercase tracking-wider text-gray-400 font-semibold">{t('layoutPreset')}</label>
                            </div>
                            
                            {/* Standard Slide Presets Grid */}
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                <button onClick={() => handleStandardLayout(slide.id, 'standard')} className={`flex flex-col items-center p-2 rounded border ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700 text-gray-400 hover:text-white' : 'border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`} title="Standard List">
                                    <Layout className="w-3 h-3 mb-1" /> <span className="text-[9px]">Standard</span>
                                </button>
                                <button onClick={() => handleStandardLayout(slide.id, 'split')} className={`flex flex-col items-center p-2 rounded border ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700 text-gray-400 hover:text-white' : 'border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`} title="Comparison">
                                    <Columns className="w-3 h-3 mb-1" /> <span className="text-[9px]">Compare</span>
                                </button>
                                <button onClick={() => handleStandardLayout(slide.id, 'grid')} className={`flex flex-col items-center p-2 rounded border ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700 text-gray-400 hover:text-white' : 'border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`} title="Grid/Cards">
                                    <Grip className="w-3 h-3 mb-1" /> <span className="text-[9px]">Grid</span>
                                </button>
                                <button onClick={() => handleStandardLayout(slide.id, 'timeline')} className={`flex flex-col items-center p-2 rounded border ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700 text-gray-400 hover:text-white' : 'border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`} title="Timeline">
                                    <Calendar className="w-3 h-3 mb-1" /> <span className="text-[9px]">Timeline</span>
                                </button>
                                <button onClick={() => handleStandardLayout(slide.id, 'data')} className={`flex flex-col items-center p-2 rounded border ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700 text-gray-400 hover:text-white' : 'border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`} title="Big Number/Chart">
                                    <BarChart2 className="w-3 h-3 mb-1" /> <span className="text-[9px]">Data</span>
                                </button>
                                <button onClick={() => handleStandardLayout(slide.id, 'quote')} className={`flex flex-col items-center p-2 rounded border ${theme === 'dark' ? 'border-gray-700 hover:bg-gray-700 text-gray-400 hover:text-white' : 'border-gray-200 hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`} title="Quote/Center">
                                    <Quote className="w-3 h-3 mb-1" /> <span className="text-[9px]">Quote</span>
                                </button>
                            </div>

                            <label className={`block text-xs uppercase tracking-wider font-semibold mb-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{t('visualNotes')}</label>
                            <textarea
                            value={slide.layoutSuggestion || ''}
                            onChange={(e) => handleUpdateSlide(slide.id, 'layoutSuggestion', e.target.value)}
                            className={`w-full flex-1 rounded-lg p-4 text-sm focus:ring-1 focus:outline-none min-h-[120px] resize-y leading-relaxed shadow-inner ${theme === 'dark' ? 'bg-gray-900/30 border border-gray-700 text-gray-300 focus:border-purple-500 focus:ring-purple-500/20' : 'bg-gray-50 border border-gray-200 text-gray-600 focus:border-purple-500 focus:ring-purple-500/20'}`}
                            placeholder={t('visualNotesPlaceholder')}
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
          className={`w-full py-6 border-2 border-dashed rounded-xl transition-all flex items-center justify-center gap-3 font-semibold text-lg ${theme === 'dark' ? 'border-gray-700 text-gray-500 hover:text-purple-400 hover:border-purple-500/50 hover:bg-gray-800/50' : 'border-gray-300 text-gray-400 hover:text-purple-500 hover:border-purple-500/50 hover:bg-purple-50/50'}`}
        >
          <Plus className="w-6 h-6" /> {t('addNewSlide')}
        </button>
      </div>
    </div>
  );
};

export default OutlineEditor;
