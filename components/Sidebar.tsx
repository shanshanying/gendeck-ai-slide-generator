import React from 'react';
import { SlideData } from '../types';
import { Layout, CheckCircle, CircleDashed } from 'lucide-react';

interface SidebarProps {
  slides: SlideData[];
  currentSlideId: string | null;
  onSelectSlide: (id: string) => void;
  isGeneratingAll: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ slides, currentSlideId, onSelectSlide, isGeneratingAll }) => {
  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 flex flex-col h-full">
      <div className="p-4 border-b border-gray-800 bg-gray-900 z-10">
        <h2 className="text-sm font-bold text-gray-100 uppercase tracking-wider flex items-center gap-2">
          <Layout className="w-4 h-4 text-purple-500" />
          Slides ({slides.length})
        </h2>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => onSelectSlide(slide.id)}
            className={`w-full text-left p-3 rounded-lg border transition-all duration-200 group relative ${
              currentSlideId === slide.id 
                ? 'bg-purple-900/30 border-purple-500/50 shadow-md' 
                : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800 hover:border-gray-600'
            }`}
          >
            <div className="flex items-start justify-between mb-1">
              <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${currentSlideId === slide.id ? 'bg-purple-500 text-white' : 'bg-gray-700 text-gray-400'}`}>
                #{index + 1}
              </span>
              {slide.htmlContent ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : (
                <CircleDashed className={`w-3 h-3 ${isGeneratingAll ? 'animate-spin text-yellow-500' : 'text-gray-600'}`} />
              )}
            </div>
            <h3 className={`text-sm font-medium line-clamp-2 ${currentSlideId === slide.id ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
              {slide.title}
            </h3>
            {slide.layoutSuggestion && (
               <p className="text-[10px] text-gray-500 mt-1 truncate">{slide.layoutSuggestion}</p>
            )}
          </button>
        ))}
        {slides.length === 0 && (
          <div className="text-center p-4 mt-10">
            <p className="text-xs text-gray-600 italic">No slides yet. Configure and generate to start.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
