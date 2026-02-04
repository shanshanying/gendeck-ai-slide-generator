
import React from 'react';
import { SlideData, Language, Theme } from '../types';
import { Layout, CheckCircle, CircleDashed } from 'lucide-react';
import { TRANSLATIONS } from '../constants';

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
  return (
    <div className={`w-64 backdrop-blur flex flex-col h-full ${theme === 'dark' ? 'bg-slate-950/50 border-r border-white/5' : 'bg-gray-50 border-r border-gray-200'}`}>
      <div className={`p-4 backdrop-blur z-10 ${theme === 'dark' ? 'border-b border-white/5 bg-slate-950/80' : 'border-b border-gray-200 bg-white/80'}`}>
        <h2 className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${theme === 'dark' ? 'text-slate-100' : 'text-gray-900'}`}>
          <Layout className="w-4 h-4 text-purple-400" />
          {t('slidesHeader')} ({slides.length})
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => onSelectSlide(slide.id)}
            className={`w-full text-left p-3 rounded-lg border transition-all duration-200 group relative ${
              currentSlideId === slide.id 
                ? 'bg-purple-500/10 border-purple-500/30 shadow-lg shadow-purple-500/10' 
                : theme === 'dark' ? 'bg-slate-900/50 border-white/5 hover:bg-slate-900 hover:border-white/10' : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
            }`}
          >
            <div className="flex items-start justify-between mb-1">
              <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${currentSlideId === slide.id ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/25' : theme === 'dark' ? 'bg-slate-800 text-slate-400 ring-1 ring-white/5' : 'bg-gray-100 text-gray-500 ring-1 ring-gray-200'}`}>
                #{index + 1}
              </span>
              {slide.htmlContent ? (
                <CheckCircle className="w-3 h-3 text-emerald-400" />
              ) : (
                <CircleDashed className={`w-3 h-3 ${isGeneratingAll ? 'animate-spin text-amber-400' : 'text-slate-600'}`} />
              )}
            </div>
            <h3 className={`text-sm font-medium line-clamp-2 ${currentSlideId === slide.id ? (theme === 'dark' ? 'text-white' : 'text-gray-900') : theme === 'dark' ? 'text-slate-300 group-hover:text-white' : 'text-gray-600 group-hover:text-gray-900'} `}>
              {slide.title}
            </h3>
            {slide.layoutSuggestion && (
               <p className={`text-[10px] mt-1 truncate ${theme === 'dark' ? 'text-slate-500' : 'text-gray-400'}`}>{slide.layoutSuggestion}</p>
            )}
          </button>
        ))}
        {slides.length === 0 && (
          <div className="text-center p-4 mt-10">
            <p className={`text-xs italic ${theme === 'dark' ? 'text-slate-600' : 'text-gray-400'}`}>{t('noSlides')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
