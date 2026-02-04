
import React, { useState, useEffect } from 'react';
import { Search, Clock, FileText, Trash2, X, FolderOpen, Loader2, Download, ChevronDown, Type, Layout, Presentation } from 'lucide-react';
import { deckApi, DatabaseDeck, DatabaseDeckWithSlides } from '../services/databaseService';
import { TRANSLATIONS } from '../constants';
import { getThemeClasses, cx } from '../styles/theme';

export type LoadStage = 'input' | 'outline' | 'deck';

interface DeckBrowserProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadDeck: (deck: DatabaseDeckWithSlides, stage: LoadStage) => void;
  lang: 'en' | 'zh';
  theme: 'dark' | 'light';
}

const DeckBrowser: React.FC<DeckBrowserProps> = ({ isOpen, onClose, onLoadDeck, lang, theme }) => {
  const [decks, setDecks] = useState<DatabaseDeck[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedDeck, setSelectedDeck] = useState<DatabaseDeck | null>(null);
  const [showLoadOptions, setShowLoadOptions] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<DatabaseDeck | null>(null);

  const th = getThemeClasses(theme);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (isOpen) {
      loadDecks();
      setSelectedDeck(null);
      setShowLoadOptions(false);
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

  const handleDeleteClick = (deck: DatabaseDeck, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeckToDelete(deck);
  };

  const handleDeleteConfirm = async () => {
    if (!deckToDelete) return;
    const id = deckToDelete.id;
    setDeckToDelete(null);
    setDeletingId(id);
    try {
      await deckApi.delete(id);
      setDecks(decks.filter(d => d.id !== id));
      if (selectedDeck?.id === id) {
        setSelectedDeck(null);
        setShowLoadOptions(false);
      }
    } catch (err) {
      alert(lang === 'zh' ? '删除失败' : 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSelectDeck = (deck: DatabaseDeck) => {
    setSelectedDeck(deck);
    setShowLoadOptions(true);
  };

  const handleLoad = async (stage: LoadStage) => {
    if (!selectedDeck) return;
    
    setLoading(true);
    try {
      const response = await deckApi.get(selectedDeck.id);
      const fullDeck = response.data;
      onLoadDeck(fullDeck, stage);
      onClose();
    } catch (err) {
      alert(lang === 'zh' ? '加载失败' : 'Failed to load deck');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (deck: DatabaseDeck, e: React.MouseEvent) => {
    e.stopPropagation();
    setDownloadingId(deck.id);
    try {
      const blob = await deckApi.downloadHtml(deck.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${deck.topic.replace(/\s+/g, '-').toLowerCase()}.html`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(lang === 'zh' ? '下载失败：此演示文稿没有保存完整HTML' : 'Download failed: Full HTML not available');
    } finally {
      setDownloadingId(null);
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
    <>
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={cx('absolute inset-0 backdrop-blur-sm', isDark ? 'bg-slate-950/80' : 'bg-gray-900/40')}
        onClick={onClose}
      />
      
      {/* Delete confirmation modal – same style as App New Deck confirm */}
      {deckToDelete && (
        <div
          className="absolute inset-0 z-[310] flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setDeckToDelete(null)}
        >
          <div className={cx('absolute inset-0 backdrop-blur-sm', isDark ? 'bg-slate-950/80' : 'bg-gray-900/40')} />
          <div className={cx('relative border rounded-2xl shadow-2xl max-w-md w-full transform transition-all animate-in fade-in zoom-in-95 duration-200', isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-gray-200')}>
            <div className={cx('flex items-center gap-3 px-6 py-5 border-b', isDark ? 'border-white/5' : 'border-gray-100')}>
              <div className={cx('w-10 h-10 rounded-xl flex items-center justify-center ring-1', isDark ? 'bg-red-500/10 ring-red-500/20' : 'bg-red-100 ring-red-200')}>
                <Trash2 className={cx('w-5 h-5', isDark ? 'text-red-400' : 'text-red-600')} />
              </div>
              <div>
                <h3 className={cx('text-lg font-semibold', th.text.primary)}>{lang === 'zh' ? '删除演示文稿' : 'Delete deck'}</h3>
                <p className={cx('text-sm', th.text.muted)}>{lang === 'zh' ? '确定要删除这个演示文稿吗？' : 'Are you sure you want to delete this deck?'}</p>
              </div>
            </div>
            <div className="px-6 py-4">
              <p className={cx('text-sm', th.text.secondary)}>
                {lang === 'zh' ? `「${deckToDelete.topic}」将被永久删除，此操作无法撤销。` : `"${deckToDelete.topic}" will be permanently deleted. This cannot be undone.`}
              </p>
            </div>
            <div className={cx('flex items-center justify-end gap-3 px-6 py-4 border-t rounded-b-2xl', isDark ? 'border-white/5 bg-slate-900/50' : 'border-gray-100 bg-gray-50/50')}>
              <button
                onClick={() => setDeckToDelete(null)}
                className={cx('px-4 py-2 text-sm font-medium rounded-lg transition-all border', th.button.primary)}
              >
                {lang === 'zh' ? '取消' : 'Cancel'}
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 rounded-lg transition-all shadow-lg shadow-red-500/20"
              >
                {lang === 'zh' ? '删除' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      <div className={cx(
        'relative w-full max-w-4xl max-h-[85vh] rounded-2xl shadow-2xl border flex flex-col',
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
                  onClick={() => handleSelectDeck(deck)}
                  className={cx(
                    'group p-4 rounded-xl border cursor-pointer transition-all',
                    selectedDeck?.id === deck.id
                      ? (isDark ? 'bg-purple-500/10 border-purple-500/50' : 'bg-purple-50 border-purple-300')
                      : (isDark ? 'bg-slate-800/50 border-white/5 hover:bg-slate-800 hover:border-white/10' : 'bg-gray-50 border-gray-200 hover:bg-white hover:border-gray-300')
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cx(
                        'w-14 h-14 rounded-lg flex items-center justify-center text-lg font-bold',
                        isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-200 text-gray-600'
                      )}>
                        {deck.slide_count}
                      </div>
                      
                      <div>
                        <h4 className={cx('font-medium', th.text.primary)}>{deck.topic}</h4>
                        <div className={cx('flex items-center gap-3 text-xs mt-1', th.text.muted)}>
                          {deck.audience && <span>{deck.audience}</span>}
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(deck.updated_at)}
                          </span>
                        </div>
                        
                        {/* Load Options - show when selected */}
                        {selectedDeck?.id === deck.id && showLoadOptions && (
                          <div className="flex items-center gap-2 mt-3">
                            <span className={cx('text-xs mr-1', th.text.muted)}>
                              {lang === 'zh' ? '加载到:' : 'Load to:'}
                            </span>
                            
                            <button
                              onClick={(e) => { e.stopPropagation(); handleLoad('input'); }}
                              disabled={loading}
                              className={cx(
                                'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                                isDark ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                              )}
                              title={lang === 'zh' ? '加载源文本、目标受众等' : 'Load source text, target audience, etc.'}
                            >
                              <Type className="w-3 h-3" />
                              {lang === 'zh' ? '输入' : 'Input'}
                            </button>
                            
                            <button
                              onClick={(e) => { e.stopPropagation(); handleLoad('outline'); }}
                              disabled={loading}
                              className={cx(
                                'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                                isDark ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300' : 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                              )}
                              title={lang === 'zh' ? '加载大纲和主题' : 'Load outline and themes'}
                            >
                              <Layout className="w-3 h-3" />
                              {lang === 'zh' ? '大纲' : 'Outline'}
                            </button>
                            
                            <button
                              onClick={(e) => { e.stopPropagation(); handleLoad('deck'); }}
                              disabled={loading}
                              className={cx(
                                'flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all',
                                isDark ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                              )}
                              title={lang === 'zh' ? '加载完整演示文稿' : 'Load full deck'}
                            >
                              <Presentation className="w-3 h-3" />
                              {lang === 'zh' ? '演示' : 'Deck'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => handleDownload(deck, e)}
                        disabled={downloadingId === deck.id}
                        className={cx(
                          'p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all',
                          isDark ? 'hover:bg-blue-500/10 hover:text-blue-400' : 'hover:bg-blue-50 hover:text-blue-600'
                        )}
                        title={lang === 'zh' ? '下载HTML' : 'Download HTML'}
                      >
                        {downloadingId === deck.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                      </button>

                      <button
                        onClick={(e) => handleDeleteClick(deck, e)}
                        disabled={deletingId === deck.id}
                        className={cx(
                          'p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-all',
                          isDark ? 'hover:bg-red-500/10 hover:text-red-400' : 'hover:bg-red-50 hover:text-red-600'
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
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
    </>
  );
};

export default DeckBrowser;
