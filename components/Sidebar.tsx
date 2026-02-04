
import React from 'react';
import { SlideData, Language, Theme } from '../types';
import { Layout, CheckCircle, CircleDashed } from 'lucide-react';
import { TRANSLATIONS } from '../constants';
import { getThemeClasses, cx } from '../styles/theme';

interface SidebarProps {
  slides: SlideData[];
  currentSlideId: string | null;
  onSelectSlide: (id: string) => void;
  isGeneratingAll: boolean;
  lang: Language;
  t: (key: keyof typeof TRANSLATIONS['en']) => string;
  theme: Theme;
}

const Sidebar: React.FC<SidebarProps> = ({ slides, currentSlideId, onSelectSlide, isGeneratingAll, t, theme }) => {
  const th = getThemeClasses(theme);
  const isDark = theme === 'dark';

  return (
    <div className={cx('w-64 backdrop-blur flex flex-col h-full border-r', th.bg.sidebar, th.border.primary)}>
      <div className={cx('p-4 backdrop-blur z-10 border-b', th.bg.glassHeader, th.border.primary)}>
        <h2 className={cx('text-sm font-bold uppercase tracking-wider flex items-center gap-2', th.text.primary)}>
          <Layout className="w-4 h-4 text-purple-400" />
          {t('slidesHeader')} ({slides.length})
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {slides.map((slide, index) => {
          const isActive = currentSlideId === slide.id;
          
          return (
            <button
              key={slide.id}
              onClick={() => onSelectSlide(slide.id)}
              className={cx(
                'w-full text-left p-3 rounded-lg border transition-all duration-200 group relative',
                isActive 
                  ? 'bg-purple-500/10 border-purple-500/30 shadow-lg shadow-purple-500/10' 
                  : cx(th.bg.card, th.border.secondary, 'hover:border-white/10')
              )}
            >
              <div className="flex items-start justify-between mb-1">
                <span className={cx(
                  'text-xs font-mono px-1.5 py-0.5 rounded',
                  isActive 
                    ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' 
                    : isDark 
                      ? 'bg-slate-800 text-slate-400 ring-1 ring-white/5' 
                      : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200'
                )}>
                  #{index + 1}
                </span>
                {slide.htmlContent ? (
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                ) : (
                  <CircleDashed className={cx('w-3 h-3', isGeneratingAll ? 'animate-spin text-amber-400' : 'text-slate-600')} />
                )}
              </div>
              <h3 className={cx(
                'text-sm font-medium line-clamp-2',
                isActive 
                  ? th.text.inverse 
                  : cx(th.text.secondary, 'group-hover:text-white')
              )}>
                {slide.title}
              </h3>
              {slide.layoutSuggestion && (
                 <p className={cx('text-[10px] mt-1 truncate', th.text.muted)}>{slide.layoutSuggestion}</p>
              )}
            </button>
          );
        })}
        {slides.length === 0 && (
          <div className="text-center p-4 mt-10">
            <p className={cx('text-xs italic', th.text.muted)}>{t('noSlides')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
