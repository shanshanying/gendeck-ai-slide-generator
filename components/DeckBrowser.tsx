
import React, { useState, useEffect } from 'react';
import { Search, Clock, FileText, Trash2, X, FolderOpen, Loader2 } from 'lucide-react';
import { deckApi, DeckApi, DatabaseDeck, DatabaseDeckWithSlides, dbSlideToSlideData } from '../services/databaseService';
import { SlideData } from '../types';
import { TRANSLATIONS } from '../constants';
import { getThemeClasses, cx } from '../styles/theme';

interface DeckBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDeck: (deck: {
    id: string;
    topic: string;
    slides: SlideData[];
    colorPalette: string;
  }) => void;
  lang: 'en' | 'zh';
  theme: 'dark' | 'light';
}

const DeckBrowser: React.FC<DeckBrowserProps> = ({ isOpen, onClose, onLoadDeck, lang, theme }) => {
  const [decks, setDecks] = useState<DatabaseDeck[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const th = getThemeClasses(theme);
  const isDark = theme === 'dark';
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (isOpen) {
      loadDecks();
    }
  }, [isOpen]);

  const loadDecks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await deckApi.list();
      setDecks(response.data);
    } catch (err: any) {
      setError(lang === 'zh' ? '无法加载保存的演示文稿' : 'Failed to load saved decks');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadDecks();
      return;
    }
    setLoading(true);
    try {
      const response = await deckApi.search(searchQuery);
      setDecks(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(lang === 'zh' ? '确定要删除这个演示文稿吗？' : 'Are you sure you want to delete this deck?')) {
      return;
    }
    setDeletingId(id);
    try {
      await deckApi.delete(id);
      setDecks(decks.filter(d => d.id !== id));
    } catch (err) {
      alert(lang === 'zh' ? '删除失败' : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleLoad = async (deck: DatabaseDeck) => {
    setLoading(true);
    try {
      const response = await deckApi.get(deck.id);
      const fullDeck = response.data;
      
      onLoadDeck({
        id: fullDeck.id,
        topic: fullDeck.topic,
        slides: fullDeck.slides.map(dbSlideToSlideData),
        colorPalette: fullDeck.color_palette,
      });
      onClose();
    } catch (err) {
      alert(lang === 'zh' ? '加载失败' : 'Failed to load deck');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={cx('absolute inset-0 backdrop-blur-sm', isDark ? 'bg-slate-950/80' : 'bg-gray-900/40')}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={cx(
        'relative w-full max-w-4xl max-h-[80vh] rounded-2xl shadow-2xl border flex flex-col',
        isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-gray-200'
      )}>
        {/* Header */}
        <div className={cx('flex items-center justify-between p-4 border-b', isDark ? 'border-white/5' : 'border-gray-100')}>
          <div className="flex items-center gap-3">
            <div className={cx('w-10 h-10 rounded-xl flex items-center justify-center', isDark ? 'bg-purple-500/10' : 'bg-purple-100')}>
              <FolderOpen className={cx('w-5 h-5', isDark ? 'text-purple-400' : 'text-purple-600')} />
            </div>
            <div>
              <h3 className={cx('text-lg font-semibold', th.text.primary)}>
                {lang === 'zh' ? '保存的演示文稿' : 'Saved Decks'}
              </h3>
              <p className={cx('text-xs', th.text.muted)}>
                {decks.length} {lang === 'zh' ? '个演示文稿' : 'decks'}
              </p>
            </div>
          </div>
          
          <button onClick={onClose} className={cx('p-2 rounded-lg transition-colors', th.button.ghost)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className={cx('p-4 border-b', isDark ? 'border-white/5' : 'border-gray-100')}>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <Search className={cx('absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4', th.text.muted)} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder={lang === 'zh' ? '搜索演示文稿...' : 'Search decks...'}
                className={cx(
                  'w-full pl-10 pr-4 py-2 rounded-lg border text-sm',
                  th.input.bg, th.input.border, th.input.text, th.input.focusBorder
                )}
              />
            </div>
            <button
              onClick={handleSearch}
              className={cx('px-4 py-2 rounded-lg text-sm font-medium transition-colors', th.button.primary)}
            >
              {lang === 'zh' ? '搜索' : 'Search'}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading && decks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className={cx('w-8 h-8 animate-spin mb-3', isDark ? 'text-purple-400' : 'text-purple-600')} />
              <span className={cx('text-sm', th.text.muted)}>{lang === 'zh' ? '加载中...' : 'Loading...'}</span>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className={cx('text-sm', isDark ? 'text-red-400' : 'text-red-600')}>{error}</p>
              <button
                onClick={loadDecks}
                className={cx('mt-3 text-sm px-4 py-2 rounded-lg', th.button.primary)}
              >
                {lang === 'zh' ? '重试' : 'Retry'}
              </button>
            </div>
          ) : decks.length === 0 ? (
            <div className="text-center py-12">
              <FileText className={cx('w-12 h-12 mx-auto mb-3 opacity-30', th.text.muted)} />
              <p className={cx('text-sm', th.text.muted)}>
                {searchQuery 
                  ? (lang === 'zh' ? '未找到匹配的演示文稿' : 'No decks found')
                  : (lang === 'zh' ? '还没有保存的演示文稿' : 'No saved decks yet')
                }
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {decks.map((deck) => (
                <div
                  key={deck.id}
                  onClick={() => handleLoad(deck)}
                  className={cx(
                    'group flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all',
                    isDark 
                      ? 'bg-slate-800/50 border-white/5 hover:bg-slate-800 hover:border-purple-500/30' 
                      : 'bg-gray-50 border-gray-200 hover:bg-white hover:border-purple-300'
                  )}
                >
                  <div className={cx(
                    'w-12 h-12 rounded-lg flex items-center justify-center text-lg font-bold',
                    isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-600'
                  )}>
                    {deck.slide_count}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className={cx('font-medium truncate', th.text.primary)}>{deck.topic}</h4>
                    <div className={cx('flex items-center gap-3 text-xs mt-1', th.text.muted)}>
                      {deck.audience && <span>{deck.audience}</span>}
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(deck.updated_at)}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDelete(deck.id, e)}
                    disabled={deletingId === deck.id}
                    className={cx(
                      'p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all',
                      isDark 
                        ? 'hover:bg-red-500/10 hover:text-red-400' 
                        : 'hover:bg-red-50 hover:text-red-600'
                    )}
                    title={lang === 'zh' ? '删除' : 'Delete'}
                  >
                    {deletingId === deck.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeckBrowser;
