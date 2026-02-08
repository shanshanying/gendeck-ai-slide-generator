
import React, { useState, useEffect } from 'react';
import { SlideData, Language } from '../types';
import type { Theme } from '../styles/theme';
import { Trash2, Plus, MoveUp, MoveDown, ArrowRight, ArrowLeft, PaintBucket, Type, AlignLeft, AlignCenter, Bold, Layout, FileDown, Columns, Grip, Calendar, BarChart2, Quote, Check } from 'lucide-react';
import { TRANSLATIONS, COLOR_THEMES } from '../constants';
import { getThemeClasses, cx } from '../styles/theme';

interface OutlineEditorProps {
  slides: SlideData[];
  onUpdateSlides: (slides: SlideData[]) => void;
  onConfirm: (colorPalette: string) => void;
  onCancel: () => void;
  lang: Language;
  t: (key: keyof typeof TRANSLATIONS['en']) => string;
  theme: Theme;
  colorPalette?: string;
}

const OutlineEditor: React.FC<OutlineEditorProps> = ({ 
  slides, 
  onUpdateSlides, 
  onConfirm, 
  onCancel,
  lang,
  t,
  theme,
  colorPalette: initialPalette
}) => {
  // Initialize with provided palette or default to first theme
  const [selectedPalette, setSelectedPalette] = useState(() => {
    if (initialPalette) return initialPalette;
    return COLOR_THEMES[0].colors.join(',');
  });
  
  // Use centralized theme classes
  const th = getThemeClasses(theme);
    
  // Update if prop changes
  useEffect(() => {
    if (initialPalette) {
      setSelectedPalette(initialPalette);
    }
  }, [initialPalette]);
  
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
    <div className={cx('w-full max-w-[95%] mx-auto p-6 h-full flex flex-col', th.bg.secondary)}>
      <div className="flex justify-between items-center mb-6 shrink-0">
        <div>
          <h2 className={cx('text-2xl font-bold', th.text.primary)}>{t('reviewStyle')}</h2>
          <p className={cx('text-sm', th.text.muted)}>{t('refineStructure')}</p>
        </div>
        <div className="flex gap-3">
           <button 
             onClick={handleDownloadOutline}
             className={cx('px-3 py-2 rounded-lg transition-all flex items-center gap-2 border', th.button.primary)}
             title={t('exportOutline')}
           >
             <FileDown className="w-4 h-4" />
           </button>
           <button 
             onClick={onCancel}
             className={cx('px-4 py-2 rounded-lg transition-all flex items-center gap-2 border', th.button.primary)}
           >
             <ArrowLeft className="w-4 h-4" /> {t('back')}
           </button>
           <button 
             onClick={() => onConfirm(selectedPalette)}
             className="px-6 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white font-bold shadow-lg shadow-purple-500/25 transition-all active:scale-95 flex items-center gap-2"
           >
             {t('generateSlidesBtn')} <ArrowRight className="w-4 h-4" />
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 space-y-8 pb-8">
        {slides.map((slide, index) => {
          const isCover = index === 0;
          const isEnding = index === slides.length - 1 && slides.length > 1;

          // Get slide-specific background styles
          const getSlideBg = () => {
            if (isCover) return 'bg-purple-500/5 border-purple-500/20';
            if (isEnding) return 'bg-blue-500/5 border-blue-500/20';
            return cx('bg-slate-900/50 border-white/5 shadow-black/10', 'group hover:border-white/10');
          };

          // Get slide number badge styles
          const getBadgeStyles = () => {
            if (isCover) return 'bg-purple-600 text-white font-bold shadow-lg shadow-purple-500/25';
            if (isEnding) return 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-500/25';
            return 'bg-slate-800 text-slate-300 ring-1 ring-white/10';
          };

          // Get label color (Cover/Ending)
          const getLabelColor = () => {
            if (isCover) return 'text-purple-400';
            if (isEnding) return 'text-blue-400';
            return '';
          };

          return (
            <div key={slide.id} className={cx('backdrop-blur rounded-xl p-6 shadow-lg transition-all', getSlideBg())}>
              <div className={cx('flex items-center justify-between mb-6 pb-4 border-b', 'border-gray-700/50')}>
                 <div className="flex items-center gap-4 w-full">
                   <span className={cx('text-sm font-mono w-8 h-8 flex items-center justify-center rounded-lg shrink-0', getBadgeStyles())}>
                     {index + 1}
                   </span>
                   <div className="flex-1">
                      {isCover && <span className={cx('text-[10px] uppercase tracking-wider font-bold mb-1 block', getLabelColor())}>{t('coverPage')}</span>}
                      {isEnding && <span className={cx('text-[10px] uppercase tracking-wider font-bold mb-1 block', getLabelColor())}>{t('endingPage')}</span>}
                      <input 
                        type="text" 
                        value={slide.title}
                        onChange={(e) => handleUpdateSlide(slide.id, 'title', e.target.value)}
                        className={cx(
                          'bg-transparent border-none font-bold focus:ring-0 w-full rounded px-2',
                          th.input.text, th.input.placeholder,
                          'focus:bg-slate-950/50',
                          isCover ? 'text-2xl' : 'text-xl'
                        )}
                        placeholder={t('slideTitlePlaceholder')}
                      />
                   </div>
                 </div>
                 <div className="flex items-center gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => handleMove(index, 'up')} className={cx('p-2 rounded-lg transition-colors', th.button.ghost)} title="Move Up"><MoveUp className="w-4 h-4"/></button>
                   <button onClick={() => handleMove(index, 'down')} className={cx('p-2 rounded-lg transition-colors', th.button.ghost)} title="Move Down"><MoveDown className="w-4 h-4"/></button>
                   <button 
                    type="button"
                    onClick={(e) => handleDelete(e, slide.id)} 
                    className={cx('p-2 hover:bg-red-500/10 hover:text-red-400 rounded-lg ml-2 cursor-pointer transition-colors', th.text.tertiary)} 
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
                                <label className={cx('block text-xs uppercase tracking-wider font-semibold mb-2', th.text.tertiary)}>
                                {t('subtitle')}
                                </label>
                                <textarea 
                                value={slide.contentPoints[0] || ''}
                                onChange={(e) => handleUpdateSubtitle(slide.id, e.target.value)}
                                className={cx(
                                  'w-full flex-1 rounded-lg p-4 text-base focus:ring-1 focus:outline-none min-h-[120px] resize-y leading-relaxed shadow-inner border',
                                  'bg-gray-900/30 border-gray-700 text-gray-200 focus:border-purple-500 focus:ring-purple-500/20'
                                )}
                                placeholder={t('subtitlePlaceholder')}
                                />
                            </div>
                            
                            <div className="flex flex-col">
                                <label className={cx('block text-xs uppercase tracking-wider font-semibold mb-2', th.text.tertiary)}>
                                {t('titleStyle')}
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button 
                                        onClick={() => handleCoverStyle(slide.id, 'modern')}
                                        className={cx('flex flex-col items-center justify-center p-3 rounded border transition-all', th.button.ghost)}
                                    >
                                        <AlignLeft className="w-4 h-4 mb-1" />
                                        <span className="text-[10px]">Modern Left</span>
                                    </button>
                                    <button 
                                        onClick={() => handleCoverStyle(slide.id, 'elegant')}
                                        className={cx('flex flex-col items-center justify-center p-3 rounded border transition-all', th.button.ghost)}
                                    >
                                        <div className="flex gap-0.5"><Type className="w-4 h-4 mb-1" /><AlignCenter className="w-4 h-4 mb-1" /></div>
                                        <span className="text-[10px]">Elegant Serif</span>
                                    </button>
                                    <button 
                                        onClick={() => handleCoverStyle(slide.id, 'bold')}
                                        className={cx('flex flex-col items-center justify-center p-3 rounded border transition-all', th.button.ghost)}
                                    >
                                        <Bold className="w-4 h-4 mb-1" />
                                        <span className="text-[10px]">Big & Bold</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col">
                             <label className={cx('block text-xs uppercase tracking-wider font-semibold mb-2', th.text.tertiary)}>{t('visualNotes')}</label>
                             <textarea
                               value={slide.layoutSuggestion || ''}
                               onChange={(e) => handleUpdateSlide(slide.id, 'layoutSuggestion', e.target.value)}
                               className={cx(
                                 'w-full flex-1 rounded-lg p-4 text-sm focus:ring-1 focus:outline-none min-h-[250px] resize-y leading-relaxed shadow-inner border',
                                 'bg-gray-900/30 border-gray-700 text-gray-300 focus:border-purple-500 focus:ring-purple-500/20'
                               )}
                               placeholder={t('visualNotesPlaceholder')}
                             />
                        </div>
                    </>
                ) : isEnding ? (
                    // Ending Page Specific Editor
                    <>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-col">
                                <label className={cx('block text-xs uppercase tracking-wider font-semibold mb-2', th.text.tertiary)}>
                                {t('closingMessage')}
                                </label>
                                <textarea 
                                value={slide.contentPoints[0] || ''}
                                onChange={(e) => handleUpdateSubtitle(slide.id, e.target.value)}
                                className={cx(
                                  'w-full flex-1 rounded-lg p-4 text-base focus:ring-1 focus:outline-none min-h-[120px] resize-y leading-relaxed shadow-inner border',
                                  'bg-gray-900/30 border-gray-700 text-gray-200 focus:border-blue-500 focus:ring-blue-500/20'
                                )}
                                placeholder={t('closingPlaceholder')}
                                />
                            </div>
                            
                            <div className="flex flex-col">
                                <label className={cx('block text-xs uppercase tracking-wider font-semibold mb-2', th.text.tertiary)}>
                                {t('endingStyle')}
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    <button 
                                        onClick={() => handleEndingStyle(slide.id, 'minimal')}
                                        className={cx('flex flex-col items-center justify-center p-3 rounded border transition-all', th.button.ghost)}
                                    >
                                        <div className="w-4 h-4 border border-gray-400 rounded-sm mb-1" />
                                        <span className="text-[10px]">Minimal</span>
                                    </button>
                                    <button 
                                        onClick={() => handleEndingStyle(slide.id, 'contact')}
                                        className={cx('flex flex-col items-center justify-center p-3 rounded border transition-all', th.button.ghost)}
                                    >
                                        <div className="flex gap-0.5"><Layout className="w-4 h-4 mb-1" /></div>
                                        <span className="text-[10px]">Contact Info</span>
                                    </button>
                                    <button 
                                        onClick={() => handleEndingStyle(slide.id, 'brand')}
                                        className={cx('flex flex-col items-center justify-center p-3 rounded border transition-all', th.button.ghost)}
                                    >
                                        <div className="w-4 h-4 bg-gray-500 rounded-full mb-1" />
                                        <span className="text-[10px]">Brand Focus</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex flex-col">
                             <label className={cx('block text-xs uppercase tracking-wider font-semibold mb-2', th.text.tertiary)}>{t('visualNotes')}</label>
                             <textarea
                               value={slide.layoutSuggestion || ''}
                               onChange={(e) => handleUpdateSlide(slide.id, 'layoutSuggestion', e.target.value)}
                               className={cx(
                                 'w-full flex-1 rounded-lg p-4 text-sm focus:ring-1 focus:outline-none min-h-[250px] resize-y leading-relaxed shadow-inner border',
                                 'bg-gray-900/30 border-gray-700 text-gray-300 focus:border-blue-500 focus:ring-blue-500/20'
                               )}
                               placeholder={t('visualNotesPlaceholder')}
                             />
                        </div>
                    </>
                ) : (
                    // Standard Slide Editor
                    <>
                        <div className="flex flex-col">
                            <label className={cx('block text-xs uppercase tracking-wider font-semibold mb-2 flex items-center justify-between', th.text.tertiary)}>
                            {t('contentPoints')}
                            <span className={cx('text-[10px] normal-case opacity-50 px-2 py-0.5 rounded', 'bg-gray-700')}>{t('onePointPerLine')}</span>
                            </label>
                            <textarea 
                            value={slide.contentPoints.join('\n')}
                            onChange={(e) => handleUpdatePoints(slide.id, e.target.value)}
                            className={cx(
                              'w-full flex-1 rounded-lg p-4 text-base focus:ring-1 focus:outline-none min-h-[250px] resize-y leading-relaxed shadow-inner border',
                              'bg-gray-900/30 border-gray-700 text-gray-200 focus:border-purple-500 focus:ring-purple-500/20'
                            )}
                            placeholder={t('pointsPlaceholder')}
                            />
                        </div>
                        <div className="flex flex-col">
                            <div className="flex justify-between items-center mb-2">
                                <label className={cx('block text-xs uppercase tracking-wider font-semibold', th.text.tertiary)}>{t('layoutPreset')}</label>
                            </div>
                            
                            {/* Standard Slide Presets Grid */}
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                <button onClick={() => handleStandardLayout(slide.id, 'standard')} className={cx('flex flex-col items-center p-2 rounded border', th.button.ghost)} title="Standard List">
                                    <Layout className="w-3 h-3 mb-1" /> <span className="text-[9px]">Standard</span>
                                </button>
                                <button onClick={() => handleStandardLayout(slide.id, 'split')} className={cx('flex flex-col items-center p-2 rounded border', th.button.ghost)} title="Comparison">
                                    <Columns className="w-3 h-3 mb-1" /> <span className="text-[9px]">Compare</span>
                                </button>
                                <button onClick={() => handleStandardLayout(slide.id, 'grid')} className={cx('flex flex-col items-center p-2 rounded border', th.button.ghost)} title="Grid/Cards">
                                    <Grip className="w-3 h-3 mb-1" /> <span className="text-[9px]">Grid</span>
                                </button>
                                <button onClick={() => handleStandardLayout(slide.id, 'timeline')} className={cx('flex flex-col items-center p-2 rounded border', th.button.ghost)} title="Timeline">
                                    <Calendar className="w-3 h-3 mb-1" /> <span className="text-[9px]">Timeline</span>
                                </button>
                                <button onClick={() => handleStandardLayout(slide.id, 'data')} className={cx('flex flex-col items-center p-2 rounded border', th.button.ghost)} title="Big Number/Chart">
                                    <BarChart2 className="w-3 h-3 mb-1" /> <span className="text-[9px]">Data</span>
                                </button>
                                <button onClick={() => handleStandardLayout(slide.id, 'quote')} className={cx('flex flex-col items-center p-2 rounded border', th.button.ghost)} title="Quote/Center">
                                    <Quote className="w-3 h-3 mb-1" /> <span className="text-[9px]">Quote</span>
                                </button>
                            </div>

                            <label className={cx('block text-xs uppercase tracking-wider font-semibold mb-2', th.text.tertiary)}>{t('visualNotes')}</label>
                            <textarea
                            value={slide.layoutSuggestion || ''}
                            onChange={(e) => handleUpdateSlide(slide.id, 'layoutSuggestion', e.target.value)}
                            className={cx(
                              'w-full flex-1 rounded-lg p-4 text-sm focus:ring-1 focus:outline-none min-h-[120px] resize-y leading-relaxed shadow-inner border',
                              'bg-gray-900/30 border-gray-700 text-gray-300 focus:border-purple-500 focus:ring-purple-500/20'
                            )}
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
          className={cx(
            'w-full py-6 border-2 border-dashed rounded-xl transition-all flex items-center justify-center gap-3 font-semibold text-lg',
            'border-gray-700 text-gray-500 hover:text-purple-400 hover:border-purple-500/50 hover:bg-gray-800/50'
          )}
        >
          <Plus className="w-6 h-6" /> {t('addNewSlide')}
        </button>
        
        {/* Theme Hint - Selection moved to Deck Preview */}
        <div className={cx('mt-8 p-4 rounded-lg border text-center', 'bg-slate-900/50 border-white/10')}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <PaintBucket className={cx('w-4 h-4', 'text-yellow-400')} />
            <span className={cx('text-sm font-medium', th.text.secondary)}>{t('themeSelectionHint')}</span>
          </div>
          <p className={cx('text-xs', th.text.muted)}>{t('themeSelectionHintDesc')}</p>
        </div>
      </div>
    </div>
  );
};

export default OutlineEditor;
