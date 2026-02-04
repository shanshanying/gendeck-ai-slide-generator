
import React, { useState, useEffect } from 'react';
import { History, X, RotateCcw, Clock, ChevronLeft, ChevronRight, FileCode } from 'lucide-react';
import { slideApi, SlideHistoryItem, dbSlideToSlideData } from '../services/databaseService';
import { SlideData } from '../types';
import { TRANSLATIONS } from '../constants';
import { getThemeClasses, cx } from '../styles/theme';

interface SlideHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  slideId: string | null;
  slideIndex: number;
  slideTitle: string;
  onRestore: (slide: SlideData) => void;
  lang: 'en' | 'zh';
  theme: 'dark' | 'light';
}

const SlideHistory: React.FC<SlideHistoryProps> = ({
  isOpen,
  onClose,
  slideId,
  slideIndex,
  slideTitle,
  onRestore,
  lang,
  theme,
}) => {
  const [history, setHistory] = useState<SlideHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<SlideHistoryItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const th = getThemeClasses(theme);
  const isDark = theme === 'dark';
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (isOpen && slideId) {
      loadHistory();
    } else {
      setHistory([]);
      setSelectedVersion(null);
    }
  }, [isOpen, slideId]);

  const loadHistory = async () => {
    if (!slideId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await slideApi.getHistory(slideId, 50);
      setHistory(response.data);
      if (response.data.length > 0) {
        setSelectedVersion(response.data[0]);
      }
    } catch (err: any) {
      setError(lang === 'zh' ? '无法加载历史版本' : 'Failed to load history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!slideId || !selectedVersion) return;
    
    setRestoring(true);
    try {
      const response = await slideApi.restore(slideId, selectedVersion.id);
      const restoredSlide = dbSlideToSlideData(response.data);
      onRestore(restoredSlide);
      onClose();
    } catch (err) {
      alert(lang === 'zh' ? '恢复失败' : 'Restore failed');
    } finally {
      setRestoring(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString(lang === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const handlePrevVersion = () => {
    if (!selectedVersion) return;
    const currentIndex = history.findIndex(h => h.id === selectedVersion.id);
    if (currentIndex < history.length - 1) {
      setSelectedVersion(history[currentIndex + 1]);
    }
  };

  const handleNextVersion = () => {
    if (!selectedVersion) return;
    const currentIndex = history.findIndex(h => h.id === selectedVersion.id);
    if (currentIndex > 0) {
      setSelectedVersion(history[currentIndex - 1]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={cx('absolute inset-0 backdrop-blur-sm', isDark ? 'bg-slate-950/80' : 'bg-gray-900/40')}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={cx(
        'relative w-full max-w-6xl h-[85vh] rounded-2xl shadow-2xl border flex flex-col',
        isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-gray-200'
      )}>
        {/* Header */}
        <div className={cx('flex items-center justify-between p-4 border-b', isDark ? 'border-white/5' : 'border-gray-100')}>
          <div className="flex items-center gap-3">
            <div className={cx('w-10 h-10 rounded-xl flex items-center justify-center', isDark ? 'bg-purple-500/10' : 'bg-purple-100')}>
              <History className={cx('w-5 h-5', isDark ? 'text-purple-400' : 'text-purple-600')} />
            </div>
            <div>
              <h3 className={cx('text-lg font-semibold', th.text.primary)}>
                {lang === 'zh' ? '幻灯片历史' : 'Slide History'}
              </h3>
              <p className={cx('text-xs', th.text.muted)}>
                #{slideIndex + 1}: {slideTitle}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {selectedVersion && (
              <span className={cx('text-xs px-3 py-1 rounded-full border', isDark ? 'bg-slate-800 border-white/10' : 'bg-gray-100 border-gray-200')}>
                {lang === 'zh' ? '版本' : 'Version'} {selectedVersion.version}
              </span>
            )}
            <button onClick={onClose} className={cx('p-2 rounded-lg transition-colors', th.button.ghost)}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Version List */}
          <div className={cx('w-72 border-r overflow-y-auto', isDark ? 'border-white/5 bg-slate-900/50' : 'border-gray-100 bg-gray-50/50')}>
            {loading ? (
              <div className="p-4 text-center">
                <div className={cx('w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto', th.text.muted)} />
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <p className={cx('text-xs', isDark ? 'text-red-400' : 'text-red-600')}>{error}</p>
              </div>
            ) : history.length === 0 ? (
              <div className="p-4 text-center">
                <p className={cx('text-xs', th.text.muted)}>
                  {lang === 'zh' ? '暂无历史版本' : 'No history yet'}
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {history.map((item, idx) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedVersion(item)}
                    className={cx(
                      'w-full text-left p-3 rounded-lg border transition-all',
                      selectedVersion?.id === item.id
                        ? (isDark ? 'bg-purple-500/10 border-purple-500/30' : 'bg-purple-50 border-purple-300')
                        : (isDark ? 'border-transparent hover:bg-slate-800' : 'border-transparent hover:bg-gray-100')
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cx('text-xs font-mono', isDark ? 'text-purple-400' : 'text-purple-600')}>
                        v{item.version}
                      </span>
                      {idx === 0 && (
                        <span className={cx('text-[10px] px-1.5 py-0.5 rounded', isDark ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-100 text-emerald-600')}>
                          {lang === 'zh' ? '当前' : 'Current'}
                        </span>
                      )}
                    </div>
                    <div className={cx('flex items-center gap-1 text-xs', th.text.muted)}>
                      <Clock className="w-3 h-3" />
                      {formatDate(item.saved_at)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main - Preview */}
          <div className="flex-1 flex flex-col">
            {selectedVersion ? (
              <>
                {/* Preview Toolbar */}
                <div className={cx('flex items-center justify-between p-3 border-b', isDark ? 'border-white/5' : 'border-gray-100')}>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrevVersion}
                      disabled={history.findIndex(h => h.id === selectedVersion.id) >= history.length - 1}
                      className={cx('p-1.5 rounded-lg transition-colors disabled:opacity-30', th.button.ghost)}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className={cx('text-xs', th.text.muted)}>
                      {history.findIndex(h => h.id === selectedVersion.id) + 1} / {history.length}
                    </span>
                    <button
                      onClick={handleNextVersion}
                      disabled={history.findIndex(h => h.id === selectedVersion.id) <= 0}
                      className={cx('p-1.5 rounded-lg transition-colors disabled:opacity-30', th.button.ghost)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={handleRestore}
                    disabled={restoring || history.findIndex(h => h.id === selectedVersion.id) === 0}
                    className={cx(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      history.findIndex(h => h.id === selectedVersion.id) === 0
                        ? 'opacity-50 cursor-not-allowed'
                        : 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white shadow-lg shadow-purple-500/20'
                    )}
                  >
                    {restoring ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        {lang === 'zh' ? '恢复中...' : 'Restoring...'}
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        {lang === 'zh' ? '恢复此版本' : 'Restore This Version'}
                      </>
                    )}
                  </button>
                </div>

                {/* Preview Content */}
                <div className="flex-1 overflow-auto p-4 bg-black/5">
                  <div 
                    className={cx(
                      'mx-auto rounded-lg overflow-hidden shadow-2xl',
                      isDark ? 'bg-[var(--c-bg)]' : 'bg-white'
                    )}
                    style={{
                      width: '100%',
                      maxWidth: '960px',
                      aspectRatio: '16/9',
                    }}
                  >
                    {selectedVersion.html_content ? (
                      <div 
                        className="w-full h-full"
                        style={{ 
                          transform: 'scale(0.5)',
                          transformOrigin: 'top left',
                          width: '1920px',
                          height: '1080px',
                        }}
                        dangerouslySetInnerHTML={{ 
                          __html: selectedVersion.html_content 
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <FileCode className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p className="text-sm">{lang === 'zh' ? '无预览' : 'No preview'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className={cx('p-4 border-t', isDark ? 'border-white/5 bg-slate-900/50' : 'border-gray-100 bg-gray-50/50')}>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className={cx('text-xs block mb-1', th.text.muted)}>{lang === 'zh' ? '标题' : 'Title'}</span>
                      <span className={th.text.primary}>{selectedVersion.title}</span>
                    </div>
                    <div>
                      <span className={cx('text-xs block mb-1', th.text.muted)}>{lang === 'zh' ? '布局' : 'Layout'}</span>
                      <span className={th.text.primary}>{selectedVersion.layout_suggestion || 'Standard'}</span>
                    </div>
                    {selectedVersion.content_points && selectedVersion.content_points.length > 0 && (
                      <div className="col-span-2">
                        <span className={cx('text-xs block mb-1', th.text.muted)}>{lang === 'zh' ? '内容要点' : 'Content Points'}</span>
                        <ul className={cx('text-xs space-y-1', th.text.secondary)}>
                          {selectedVersion.content_points.slice(0, 5).map((point, i) => (
                            <li key={i} className="flex items-start gap-2">
                              <span className="text-purple-400">•</span>
                              <span className="truncate">{point}</span>
                            </li>
                          ))}
                          {selectedVersion.content_points.length > 5 && (
                            <li className={th.text.muted}>+{selectedVersion.content_points.length - 5} more...</li>
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className={cx('text-sm', th.text.muted)}>
                  {lang === 'zh' ? '选择一个版本查看' : 'Select a version to view'}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideHistory;
