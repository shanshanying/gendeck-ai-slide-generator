
import React, { useState, useRef, useEffect } from 'react';
import { SlideData, Language } from '../types';
import type { Theme } from '../styles/theme';
import { RefreshCw, Code, ZoomIn, ZoomOut, Maximize, Monitor, CheckCircle, AlertTriangle, PaintBucket, ChevronRight } from 'lucide-react';
import { TRANSLATIONS, COLOR_THEMES } from '../constants';
import { getThemeClasses, cx } from '../styles/theme';



interface SlidePreviewProps {
  slide: SlideData | undefined;
  onRegenerate: (id: string, customPrompt?: string) => void;
  colorPalette: string;
  onColorPaletteChange?: (palette: string) => void;
  lang: Language;
  t: (key: keyof typeof TRANSLATIONS['en']) => string;
  theme: Theme;
}

const DESIGN_CONSTRAINTS = [
  "Dimensions: 1920x1080px (Strict)",
  "Theme: CSS Variables for consistent branding",
  "Assets: Inline SVGs only (No bitmaps)",
  "Layout: Unique styles for Cover/Ending"
];

const QUICK_ACTIONS = [
  {
    id: 'executive',
    label: { en: 'More executive', zh: '更高管化' },
    instruction: {
      en: 'Rewrite with executive tone: concise, outcome-first, and decision-oriented wording.',
      zh: '改写为高管风格：更精炼、结论先行、强调决策价值。'
    }
  },
  {
    id: 'concise',
    label: { en: 'More concise', zh: '更精炼' },
    instruction: {
      en: 'Reduce text density. Keep only core message and shortest supporting points.',
      zh: '降低文字密度，仅保留核心结论与最关键支持点。'
    }
  },
  {
    id: 'data',
    label: { en: 'More data-focused', zh: '更数据化' },
    instruction: {
      en: 'Emphasize metrics and quantitative evidence. Use data cards/charts where applicable.',
      zh: '强化指标与量化证据，优先使用数据卡片或图表示意。'
    }
  },
  {
    id: 'story',
    label: { en: 'More storytelling', zh: '更叙事化' },
    instruction: {
      en: 'Restructure into story flow: context, tension, and resolution with clearer narrative progression.',
      zh: '改为叙事结构：背景、问题张力、解决方案，增强故事推进感。'
    }
  }
];

// Group themes by category
const THEME_CATEGORIES = [
  { id: 'business', label: 'Business', labelZh: '商务', themeIds: ['classic-navy', 'classic-navy-light', 'modern-graphite', 'modern-graphite-light', 'finance-emerald', 'finance-emerald-light'] },
  { id: 'government', label: 'Government', labelZh: '政企', themeIds: ['government-red', 'government-red-light', 'soe-navy', 'soe-navy-light', 'executive-gray', 'executive-gray-light'] },
  { id: 'tech', label: 'Tech Internet', labelZh: '科技互联网', themeIds: ['cyber-electric', 'cyber-electric-light', 'aurora-violet', 'aurora-violet-light', 'neuron-orange', 'neuron-orange-light', 'google', 'google-light', 'tesla', 'tesla-light', 'alibaba', 'alibaba-light', 'huawei', 'huawei-light', 'apple', 'apple-light', 'microsoft', 'microsoft-light', 'meta', 'meta-light', 'netflix', 'netflix-light', 'bytedance', 'bytedance-light', 'tencent', 'tencent-light'] },
  { id: 'minimalist', label: 'Minimalist', labelZh: '极简', themeIds: ['paper-white', 'paper-white-light', 'concrete-gray', 'concrete-gray-light', 'cream-minimal', 'cream-minimal-light'] },
  { id: 'artistic', label: 'Artistic', labelZh: '艺术', themeIds: ['morandi', 'morandi-light', 'bauhaus', 'bauhaus-light', 'vintage-film', 'vintage-film-light', 'marvel', 'marvel-light', 'maillard', 'maillard-light', 'lotus-pink', 'lotus-pink-light'] },
  { id: 'feminine', label: 'Feminine Power', labelZh: '女性力量', themeIds: ['burgundy-power', 'burgundy-power-light', 'pearl-oldmoney', 'pearl-oldmoney-light', 'violet-rebellion', 'violet-rebellion-light', 'terracotta-earth', 'terracotta-earth-light', 'cyber-femme', 'cyber-femme-light'] },
];

const SlidePreview: React.FC<SlidePreviewProps> = ({ slide, onRegenerate, colorPalette, onColorPaletteChange, lang, t, theme }) => {
  const [showCode, setShowCode] = useState(false);
  const [customInstruction, setCustomInstruction] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [scale, setScale] = useState(0.5);
  const [showThemePanel, setShowThemePanel] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<string[]>(['corporate', 'tech', 'creative']);
  const [localPalette, setLocalPalette] = useState(colorPalette);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Update local palette when prop changes
  useEffect(() => {
    setLocalPalette(colorPalette);
  }, [colorPalette]);

  const th = getThemeClasses(theme);

  const sanitizeSlideHtml = (unsafeHtml: string): string => {
    if (!unsafeHtml) return '';

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(unsafeHtml, 'text/html');

      doc.querySelectorAll('script, iframe, object, embed, link[rel="import"], meta[http-equiv], base, form').forEach((el) => el.remove());

      const allNodes = doc.querySelectorAll('*');
      allNodes.forEach((el) => {
        const attrs = Array.from(el.attributes);
        attrs.forEach((attr) => {
          const name = attr.name.toLowerCase();
          const value = attr.value.trim();

          if (name.startsWith('on')) {
            el.removeAttribute(attr.name);
            return;
          }

          if ((name === 'href' || name === 'src' || name === 'xlink:href') && /^javascript:/i.test(value)) {
            el.removeAttribute(attr.name);
            return;
          }

          if (name === 'style' && /expression\s*\(|javascript:/i.test(value)) {
            el.removeAttribute(attr.name);
          }
        });
      });

      return doc.body.innerHTML;
    } catch {
      return unsafeHtml
        .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
        .replace(/\son\w+="[^"]*"/gi, '')
        .replace(/\son\w+='[^']*'/gi, '')
        .replace(/javascript:/gi, '');
    }
  };
  
  // Parse palette to CSS variables
  // Format: [bg, bg-soft, bg-glass, bg-invert, text, text-muted, text-faint, text-invert,
  //          border, border-strong, divider, primary, secondary, accent, success, warning, danger, info]
  const colors = colorPalette.split(',').map(c => c.trim());
  
  const themeStyles = {
    /* Background */
    '--c-bg': colors[0] || '#0a0a0a',
    '--c-bg-soft': colors[1] || '#141414',
    '--c-bg-glass': colors[2] || '#0a0a0a80',
    '--c-bg-invert': colors[3] || '#ffffff',
    /* Text */
    '--c-text': colors[4] || '#ffffff',
    '--c-text-muted': colors[5] || '#a1a1aa',
    '--c-text-faint': colors[6] || '#6b7280',
    '--c-text-invert': colors[7] || '#0a0a0a',
    /* Structure */
    '--c-border': colors[8] || '#404040',
    '--c-border-strong': colors[9] || '#525252',
    '--c-divider': colors[10] || '#40404040',
    /* Accent */
    '--c-primary': colors[11] || '#3b82f6',
    '--c-secondary': colors[12] || '#8b5cf6',
    '--c-accent': colors[13] || '#3b82f6',
    /* Semantic */
    '--c-success': colors[14] || '#22c55e',
    '--c-warning': colors[15] || '#f59e0b',
    '--c-danger': colors[16] || '#ef4444',
    '--c-info': colors[17] || '#06b6d4',
  } as React.CSSProperties;
  
  // Helper to ensure slide HTML has proper container styling with actual color values
  const processSlideHtml = (html: string) => {
    if (!html) return html;
    html = sanitizeSlideHtml(html);
    
    // Replace CSS variables with actual color values for preview reliability
    html = html
      .replace(/var\(--c-bg\)/g, colors[0] || '#0a0a0a')
      .replace(/var\(--c-bg-soft\)/g, colors[1] || '#141414')
      .replace(/var\(--c-bg-glass\)/g, colors[2] || '#0a0a0a80')
      .replace(/var\(--c-bg-invert\)/g, colors[3] || '#ffffff')
      .replace(/var\(--c-text\)/g, colors[4] || '#ffffff')
      .replace(/var\(--c-text-muted\)/g, colors[5] || '#a1a1aa')
      .replace(/var\(--c-text-faint\)/g, colors[6] || '#6b7280')
      .replace(/var\(--c-text-invert\)/g, colors[7] || '#0a0a0a')
      .replace(/var\(--c-border\)/g, colors[8] || '#404040')
      .replace(/var\(--c-border-strong\)/g, colors[9] || '#525252')
      .replace(/var\(--c-divider\)/g, colors[10] || '#40404040')
      .replace(/var\(--c-primary\)/g, colors[11] || '#3b82f6')
      .replace(/var\(--c-secondary\)/g, colors[12] || '#8b5cf6')
      .replace(/var\(--c-accent\)/g, colors[13] || '#3b82f6')
      .replace(/var\(--c-success\)/g, colors[14] || '#22c55e')
      .replace(/var\(--c-warning\)/g, colors[15] || '#f59e0b')
      .replace(/var\(--c-danger\)/g, colors[16] || '#ef4444')
      .replace(/var\(--c-info\)/g, colors[17] || '#06b6d4');
    
    // Ensure section element has proper dimensions and background
    if (html.includes('<section')) {
      if (!html.includes('width: 1920px') && !html.includes('width:1920px')) {
        // Add dimensions if missing
        html = html.replace(
          /<section([^>]*)style="([^"]*)"/i,
          `<section$1style="width: 1920px; height: 1080px; $2"`
        );
      }
      if (!html.includes('background-color')) {
        // Add background color if missing
        html = html.replace(
          /<section([^>]*)style="([^"]*)"/i,
          `<section$1style="background-color: ${colors[0] || '#0a0a0a'}; $2"`
        );
      }
    }
    
    return html;
  };

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
        <div className={cx('w-16 h-16 mb-4 rounded-2xl flex items-center justify-center ring-1', 'bg-slate-900/50 ring-white/10')}>
          <Monitor className={cx('w-8 h-8', 'text-slate-600')} />
        </div>
        <p className='text-xl font-medium'>{t('noSlideSelected')}</p>
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

  const applyQuickAction = (actionId: string) => {
    const action = QUICK_ACTIONS.find((a) => a.id === actionId);
    if (!action) return;
    const addition = action.instruction[lang];
    setCustomInstruction((prev) => (prev.trim() ? `${prev.trim()} ${addition}` : addition));
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
          <div className={cx('hidden md:flex items-center rounded-lg border p-1 mx-2', 'bg-slate-950 border-white/10')}>
            <button onClick={handleZoomOut} className={cx('p-1.5 rounded-lg transition-colors', th.button.ghost)} title={t('zoomOut')}><ZoomOut className="w-3.5 h-3.5" /></button>
            <span className={cx('text-[10px] w-10 text-center font-mono', th.text.tertiary)}>{Math.round(scale * 100)}%</span>
            <button onClick={handleZoomIn} className={cx('p-1.5 rounded-lg transition-colors', th.button.ghost)} title={t('zoomIn')}><ZoomIn className="w-3.5 h-3.5" /></button>
            <div className="w-px h-3 bg-white/10 mx-1"></div>
            <button onClick={handleFit} className={cx('p-1.5 rounded-lg transition-colors', th.button.ghost)} title={t('fitToScreen')}><Maximize className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
           {/* Color Theme Button */}
           <button
             onClick={() => setShowThemePanel(!showThemePanel)}
             className={cx(
               'text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 border',
               showThemePanel
                 ? 'bg-yellow-500 text-white shadow-lg shadow-yellow-500/25'
                 : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-white/10'
             )}
           >
             <PaintBucket className="w-3.5 h-3.5" />
             {t('theme')}
           </button>

           <div className={cx('w-px h-4 mx-1', th.border.divider)} />

           <button
             onClick={() => setIsEditing(!isEditing)}
             disabled={slide.isRegenerating}
             className={cx(
               'text-xs px-3 py-1.5 rounded-lg transition-all flex items-center gap-2 border',
               isEditing
                 ? 'bg-slate-600 text-white'
                 : 'bg-slate-800 text-white hover:bg-slate-700 border-white/10'
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
                 : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border-white/10'
             )}
           >
             <Code className="w-3.5 h-3.5" />
             {showCode ? t('previewView') : t('code')}
           </button>
        </div>
      </div>

      {/* Theme Selection Panel */}
      {showThemePanel && (
        <div className={cx('absolute top-14 left-0 right-0 z-30 backdrop-blur-xl border-b p-4 shadow-2xl animate-in fade-in slide-in-from-top-2 max-h-[28rem] overflow-y-auto', 'bg-slate-950/98 border-white/10')}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className={cx('text-sm font-semibold', th.text.primary)}>{t('selectPalette')}</h4>
              <p className={cx('text-[11px] mt-0.5', th.text.muted)}>{t('paletteHint')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const allIds = THEME_CATEGORIES.map(c => c.id);
                  setExpandedCategories(expandedCategories.length === allIds.length ? [] : allIds);
                }}
                className={cx('text-[11px] px-2 py-1 rounded border transition-all', th.button.primary)}
              >
                {expandedCategories.length === THEME_CATEGORIES.length ? (lang === 'zh' ? '折叠' : 'Collapse') : (lang === 'zh' ? '展开' : 'Expand')}
              </button>
              <button 
                onClick={() => setShowThemePanel(false)}
                className={cx('text-xs px-3 py-1.5 rounded-lg border transition-all', th.button.primary)}
              >
                {t('close')}
              </button>
            </div>
          </div>
          
          {/* Theme Categories - Compact Layout */}
          <div className="space-y-2 mb-4">
            {THEME_CATEGORIES.map((category) => {
              const isExpanded = expandedCategories.includes(category.id);
              const categoryThemes = COLOR_THEMES.filter(t => category.themeIds.includes(t.id));
              const hasActiveTheme = categoryThemes.some(t => localPalette === t.colors.join(', '));
              
              return (
                <div key={category.id} className={cx('rounded-lg border overflow-hidden', 'bg-slate-900/40 border-white/5')}>
                  {/* Category Header */}
                  <button
                    onClick={() => {
                      setExpandedCategories(prev => 
                        isExpanded ? prev.filter(id => id !== category.id) : [...prev, category.id]
                      );
                    }}
                    className={cx(
                      'w-full px-3 py-2 flex items-center justify-between transition-colors',
                      'hover:bg-slate-800/60',
                      hasActiveTheme && 'bg-indigo-500/10'
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <span className={cx('text-xs font-semibold', hasActiveTheme ? ('text-indigo-300') : th.text.secondary)}>
                        {lang === 'zh' ? category.labelZh : category.label}
                      </span>
                      <span className={cx('text-[10px] px-1.5 py-0.5 rounded-full', 'bg-slate-800 text-slate-400')}>
                        {categoryThemes.length}
                      </span>
                    </div>
                    <ChevronRight className={cx('w-4 h-4 transition-transform', isExpanded ? 'rotate-90' : '', th.text.muted)} />
                  </button>
                  
                  {/* Theme Grid - Compact */}
                  {isExpanded && (
                    <div className="p-2 grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-1.5">
                      {categoryThemes.map((colorTheme) => {
                        const isActive = localPalette === colorTheme.colors.join(', ');
                        return (
                          <button
                            key={colorTheme.id}
                            type="button"
                            onClick={() => {
                              setLocalPalette(colorTheme.colors.join(', '));
                              onColorPaletteChange?.(colorTheme.colors.join(', '));
                            }}
                            className={cx(
                              'group relative p-1.5 rounded-lg border transition-all duration-150',
                              isActive 
                                ? 'bg-slate-700 border-indigo-500 ring-1 ring-indigo-500/50'
                                : 'bg-slate-800 border-white/10 hover:border-white/20'
                            )}
                            title={colorTheme.label}
                          >
                            {/* Mini Color Preview - Key Colors Only */}
                            <div className="flex gap-px mb-1 rounded overflow-hidden h-5">
                              {/* Show key colors: bg, text, primary, secondary, accent, border */}
                              {[0, 4, 11, 12, 13, 8].map((colorIdx, i) => (
                                <div 
                                  key={i} 
                                  style={{backgroundColor: colorTheme.colors[colorIdx]}} 
                                  className="flex-1"
                                  title={['Background', 'Text', 'Primary', 'Secondary', 'Accent', 'Border'][i]}
                                />
                              ))}
                            </div>
                            <span className={cx(
                              'text-[9px] block truncate text-center',
                              isActive ? ('text-indigo-300') : th.text.secondary
                            )}>{colorTheme.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* Custom Color Input */}
          <div className={cx('p-3 rounded-xl border', 'bg-slate-900/60 border-white/5')}>
            <div className="flex items-center gap-3">
                <label className={cx('text-xs font-medium whitespace-nowrap', th.text.secondary)}>{t('customPalette')}</label>
                <input 
                   type="text"
                   value={localPalette}
                   onChange={(e) => {
                     setLocalPalette(e.target.value);
                     onColorPaletteChange?.(e.target.value);
                   }}
                   className={cx(
                     'flex-1 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 font-mono transition-all border',
                     th.input.bg, th.input.border, th.input.text, th.input.focusBorder
                   )}
                   placeholder="#0a0a0a, #1a1a1a, #ffffff, #a1a1aa, #3b82f6, #8b5cf6, #22c55e, #f59e0b, #ef4444"
                 />
            </div>
            
            {/* Live Color Preview - 18 Color System */}
            <div className="mt-3 pt-3 border-t border-dashed border-gray-500/20">
              <div className="flex items-center gap-2 mb-2">
                <span className={cx('text-[11px] font-medium', th.text.muted)}>{t('livePreview')}</span>
              </div>
              {/* Background Group */}
              <div className="mb-2">
                <div className="flex items-center gap-1 mb-1">
                  {localPalette.split(',').slice(0, 4).map((color, idx) => {
                    const trimmedColor = color.trim();
                    const isValid = /^#([0-9A-Fa-f]{3,4}){1,2}$/i.test(trimmedColor);
                    const labels = [t('cBg'), t('cBgSoft'), t('cBgGlass'), t('cBgInvert')];
                    const fullNames = ['Background', 'Background Soft', 'Background Glass', 'Background Invert'];
                    return (
                      <div key={idx} className="flex flex-col items-center gap-0.5 w-10">
                        <div 
                          className={cx(
                            'w-7 h-7 rounded-md border shadow-sm transition-all',
                            isValid ? 'border-black/10' : 'border-red-400 bg-gray-100 dark:bg-gray-800'
                          )}
                          style={{ backgroundColor: isValid ? trimmedColor : 'transparent' }}
                          title={`${fullNames[idx]}: ${isValid ? trimmedColor : 'Invalid'}`}
                        />
                        <span className={cx('text-[7px] font-medium text-center w-full truncate', th.text.muted)}>
                          {labels[idx] || '-'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Text Group */}
              <div className="mb-2">
                <div className="flex items-center gap-1 mb-1">
                  {localPalette.split(',').slice(4, 8).map((color, idx) => {
                    const trimmedColor = color.trim();
                    const isValid = /^#([0-9A-Fa-f]{3,4}){1,2}$/i.test(trimmedColor);
                    const labels = [t('cText'), t('cTextMuted'), t('cTextFaint'), t('cTextInvert')];
                    const fullNames = ['Text', 'Text Muted', 'Text Faint', 'Text Invert'];
                    return (
                      <div key={idx + 4} className="flex flex-col items-center gap-0.5 w-10">
                        <div 
                          className={cx(
                            'w-7 h-7 rounded-md border shadow-sm transition-all',
                            isValid ? 'border-black/10' : 'border-red-400 bg-gray-100 dark:bg-gray-800'
                          )}
                          style={{ backgroundColor: isValid ? trimmedColor : 'transparent' }}
                          title={`${fullNames[idx]}: ${isValid ? trimmedColor : 'Invalid'}`}
                        />
                        <span className={cx('text-[7px] font-medium text-center w-full truncate', th.text.muted)}>
                          {labels[idx] || '-'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Structure Group */}
              <div className="mb-2">
                <div className="flex items-center gap-1 mb-1">
                  {localPalette.split(',').slice(8, 11).map((color, idx) => {
                    const trimmedColor = color.trim();
                    const isValid = /^#([0-9A-Fa-f]{3,4}){1,2}$/i.test(trimmedColor);
                    const labels = [t('cBorder'), t('cBorderStrong'), t('cDivider')];
                    const fullNames = ['Border', 'Border Strong', 'Divider'];
                    return (
                      <div key={idx + 8} className="flex flex-col items-center gap-0.5 w-10">
                        <div 
                          className={cx(
                            'w-7 h-7 rounded-md border shadow-sm transition-all',
                            isValid ? 'border-black/10' : 'border-red-400 bg-gray-100 dark:bg-gray-800'
                          )}
                          style={{ backgroundColor: isValid ? trimmedColor : 'transparent' }}
                          title={`${fullNames[idx]}: ${isValid ? trimmedColor : 'Invalid'}`}
                        />
                        <span className={cx('text-[7px] font-medium text-center w-full truncate', th.text.muted)}>
                          {labels[idx] || '-'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Accent Group */}
              <div className="mb-2">
                <div className="flex items-center gap-1 mb-1">
                  {localPalette.split(',').slice(11, 14).map((color, idx) => {
                    const trimmedColor = color.trim();
                    const isValid = /^#([0-9A-Fa-f]{3,4}){1,2}$/i.test(trimmedColor);
                    const labels = [t('cPrimary'), t('cSecondary'), t('cAccent')];
                    const fullNames = ['Primary', 'Secondary', 'Accent'];
                    return (
                      <div key={idx + 11} className="flex flex-col items-center gap-0.5 w-10">
                        <div 
                          className={cx(
                            'w-7 h-7 rounded-md border shadow-sm transition-all',
                            isValid ? 'border-black/10' : 'border-red-400 bg-gray-100 dark:bg-gray-800'
                          )}
                          style={{ backgroundColor: isValid ? trimmedColor : 'transparent' }}
                          title={`${fullNames[idx]}: ${isValid ? trimmedColor : 'Invalid'}`}
                        />
                        <span className={cx('text-[7px] font-medium text-center w-full truncate', th.text.muted)}>
                          {labels[idx] || '-'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              {/* Semantic Group */}
              <div>
                <div className="flex items-center gap-1">
                  {localPalette.split(',').slice(14, 18).map((color, idx) => {
                    const trimmedColor = color.trim();
                    const isValid = /^#([0-9A-Fa-f]{3,4}){1,2}$/i.test(trimmedColor);
                    const labels = [t('cSuccess'), t('cWarning'), t('cDanger'), t('cInfo')];
                    const fullNames = ['Success', 'Warning', 'Danger', 'Info'];
                    return (
                      <div key={idx + 14} className="flex flex-col items-center gap-0.5 w-10">
                        <div 
                          className={cx(
                            'w-7 h-7 rounded-md border shadow-sm transition-all',
                            isValid ? 'border-black/10' : 'border-red-400 bg-gray-100 dark:bg-gray-800'
                          )}
                          style={{ backgroundColor: isValid ? trimmedColor : 'transparent' }}
                          title={`${fullNames[idx]}: ${isValid ? trimmedColor : 'Invalid'}`}
                        />
                        <span className={cx('text-[7px] font-medium text-center w-full truncate', th.text.muted)}>
                          {labels[idx] || '-'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Regeneration Input Panel */}
      {isEditing && (
        <div className={cx('absolute top-14 left-0 right-0 z-30 backdrop-blur border-b p-4 shadow-xl animate-in fade-in slide-in-from-top-2', 'bg-slate-900/95 border-white/5 shadow-black/20')}>
          <label className={cx('block text-sm font-medium mb-2', th.text.secondary)}>{t('instructions')}</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.id}
                type="button"
                onClick={() => applyQuickAction(action.id)}
                className={cx(
                  'px-2.5 py-1.5 rounded-full text-[11px] border transition-all',
                  'bg-slate-800/80 border-white/10 text-slate-200 hover:border-violet-400/50 hover:text-white'
                )}
              >
                {action.label[lang]}
              </button>
            ))}
          </div>
          <div className="flex gap-2 mb-4">
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
              className={cx('px-4 py-2 rounded-lg text-sm font-medium transition-all border', th.button.primary)}
            >
              {t('cancel')}
            </button>
          </div>

          {/* Design Checklist */}
          <div className={cx('p-3 rounded-lg border', 'bg-slate-950/50 border-white/5')}>
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
        </div>
      )}

      {/* Overwrite confirmation modal – same style as App New Deck confirm */}
      {showConfirmation && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setShowConfirmation(false)}
        >
          <div className={cx('absolute inset-0 backdrop-blur-sm', 'bg-slate-950/80')} />
          <div className={cx('relative border rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-in fade-in zoom-in-95 duration-200', 'bg-slate-900 border-white/10')}>
            <div className={cx('flex items-center gap-3 px-6 py-5 border-b', 'border-white/5')}> 
              <div className={cx('w-10 h-10 rounded-xl flex items-center justify-center ring-1', 'bg-amber-500/10 ring-amber-500/20')}>
                <AlertTriangle className={cx('w-5 h-5', 'text-amber-400')} />
              </div>
              <div>
                <h3 className={cx('text-lg font-semibold', th.text.primary)}>{t('overwriteConfirm')}</h3>
                <p className={cx('text-sm', th.text.muted)}>{lang === 'zh' ? '将使用新指令重新生成此幻灯片，当前内容将被替换。' : 'This slide will be regenerated with your instruction. Current content will be replaced.'}</p>
              </div>
            </div>
            <div className={cx('flex items-center justify-end gap-3 px-6 py-4 border-t rounded-b-2xl', 'border-white/5 bg-slate-900/50')}> 
              <button
                onClick={() => setShowConfirmation(false)}
                className={cx('px-4 py-2 text-sm font-medium rounded-lg transition-all border', th.button.primary)}
              >
                {t('cancel')}
              </button>
              <button
                onClick={performRegeneration}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-lg transition-all shadow-lg shadow-red-500/20"
              >
                {t('yesRegenerate')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div ref={containerRef} className="flex-1 overflow-hidden relative bg-black/10 w-full h-full">
        {slide.htmlContent ? (
           showCode ? (
             <div className={cx('w-full h-full p-4 overflow-auto', 'bg-slate-950')}>
               <pre className={cx('text-xs font-mono whitespace-pre-wrap font-medium', 'text-emerald-400')}>
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
                    ...themeStyles
                }}
                className="overflow-hidden shadow-2xl"
              >
                  {/* The Dangerous HTML is rendered here. */}
                  <div
                    className="w-full h-full"
                    dangerouslySetInnerHTML={{ __html: processSlideHtml(slide.htmlContent || '') }}
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
