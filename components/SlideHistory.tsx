
import React, { useState, useEffect } from 'react';
import { History, X, RotateCcw, Clock, ChevronLeft, ChevronRight, FileCode } from 'lucide-react';
import { deckApi, DeckHistoryItem } from '../services/databaseService';
import { TRANSLATIONS } from '../constants';
import { getThemeClasses, cx, type Theme } from '../styles/theme';

interface SlideHistoryProps {
  isOpen: boolean;
  onClose: () => void;
  deckId: string | null;
  onRestore: (version: DeckHistoryItem) => void;
  lang: 'en' | 'zh';
  theme: Theme;
}

/** Decode HTML entities so escaped storage (e.g. &lt; &gt;) renders as HTML */
function decodeHtmlEntities(html: string): string {
  if (typeof document === 'undefined') {
    return html.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'");
  }
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.innerHTML;
}

const SlideHistory: React.FC<SlideHistoryProps> = ({
  isOpen,
  onClose,
  deckId,
  onRestore,
  lang,
  theme,
}) => {
  const [history, setHistory] = useState<DeckHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<DeckHistoryItem | null>(null);
  const [loadingFullVersion, setLoadingFullVersion] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const th = getThemeClasses(theme);
    const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (isOpen && deckId) {
      loadHistory();
    } else {
      setHistory([]);
      setSelectedVersion(null);
    }
  }, [isOpen, deckId]);

  const loadHistory = async () => {
    if (!deckId) return;
    setLoading(true);
    setError(null);
    try {
      const response = await deckApi.getVersions(deckId, 50);
      setHistory(response.data);
      if (response.data.length > 0) {
        // List endpoint doesn't include full_html; fetch full version so preview works
        const first = response.data[0];
        setSelectedVersion(first);
        try {
          const full = await deckApi.getVersion(first.id);
          setSelectedVersion(full.data);
        } catch {
          // keep list item if full fetch fails
        }
      }
    } catch (err: any) {
      setError(lang === 'zh' ? '无法加载历史版本' : 'Failed to load history');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load full version details (including full_html) when selecting a version
  const handleSelectVersion = async (version: DeckHistoryItem) => {
    if (selectedVersion?.id === version.id) return;

    setLoadingFullVersion(true);
    try {
      const response = await deckApi.getVersion(version.id);
      setSelectedVersion(response.data);
    } catch (err) {
      console.error('Failed to load version details:', err);
      // Fallback to the list version if fetch fails
      setSelectedVersion(version);
    } finally {
      setLoadingFullVersion(false);
    }
  };

  const handleRestore = async () => {
    if (!selectedVersion) return;

    setRestoring(true);
    try {
      onRestore(selectedVersion);
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
    });
  };

  if (!isOpen) return null;

  return (
    <div className={'text-slate-200'}>
      <div
        className={'fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[400]'}
        onClick={onClose}
      />

      <div className={cx(
        'fixed inset-4 md:inset-10 lg:inset-20 z-[401] rounded-2xl shadow-2xl border flex flex-col overflow-hidden',
        'bg-slate-900 border-white/10'
      )}>
        {/* Header */}
        <div className={cx('flex items-center justify-between p-4 border-b', 'border-white/5')}>
          <div className="flex items-center gap-3">
            <div className={cx('w-10 h-10 rounded-xl flex items-center justify-center', 'bg-purple-500/10')}>
              <History className={cx('w-5 h-5', 'text-purple-400')} />
            </div>
            <div>
              <h3 className={cx('text-lg font-semibold', th.text.primary)}>
                {lang === 'zh' ? '历史版本' : 'Version History'}
              </h3>
              <p className={cx('text-xs', th.text.muted)}>
                {history.length} {lang === 'zh' ? '个版本' : 'versions'}
              </p>
            </div>
          </div>

          <button onClick={onClose} className={cx('p-2 rounded-lg transition-colors hover:bg-white/5', 'text-slate-400')}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar - Version List */}
          <div className={cx('w-72 border-r overflow-y-auto', 'border-white/5 bg-slate-900/30')}>
            {loading ? (
              <div className="p-4 text-center">
                <div className={cx('w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto', th.text.muted)} />
              </div>
            ) : error ? (
              <div className="p-4 text-center">
                <p className={cx('text-xs', 'text-red-400')}>{error}</p>
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
                    onClick={() => handleSelectVersion(item)}
                    className={cx(
                      'w-full text-left p-3 rounded-lg border transition-all',
                      selectedVersion?.id === item.id
                        ? ('bg-purple-500/20 border-purple-500/50')
                        : ('border-transparent hover:bg-slate-800')
                    )}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={cx('text-xs font-mono font-bold', 'text-purple-400')}>
                        v{item.version}
                      </span>
                      {idx === 0 && (
                        <span className={cx('text-[10px] px-1.5 py-0.5 rounded', 'bg-emerald-500/20 text-emerald-400')}>
                          {lang === 'zh' ? '最新' : 'Latest'}
                        </span>
                      )}
                    </div>
                    <div className={cx('text-xs opacity-70')}>
                      {formatDate(item.saved_at)}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Main - Preview */}
          <div className="flex-1 flex flex-col bg-black/5">
            {selectedVersion ? (
              <>
                {/* Toolbar */}
                <div className={cx('flex items-center justify-between p-3 border-b', 'bg-slate-900/50 border-white/5')}>
                  <div className={cx('text-sm font-medium', th.text.secondary)}>
                    {lang === 'zh' ? '版本' : 'Version'} {selectedVersion.version}
                  </div>

                  <button
                    onClick={handleRestore}
                    disabled={restoring || history.findIndex(h => h.id === selectedVersion.id) === 0}
                    className={cx(
                      'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                      history.findIndex(h => h.id === selectedVersion.id) === 0
                        ? 'opacity-50 cursor-not-allowed bg-gray-500/20'
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
                <div className="flex-1 overflow-auto p-4">
                  <div
                    className={cx(
                      'mx-auto rounded-lg overflow-hidden shadow-2xl',
                      'bg-[#111]'
                    )}
                    style={{
                      width: '100%',
                      maxWidth: '960px',
                      aspectRatio: '16/9',
                    }}
                  >
                    {loadingFullVersion ? (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <div className={cx('w-8 h-8 border-2 border-current border-t-transparent rounded-full animate-spin mx-auto mb-3', th.text.muted)} />
                          <p>{lang === 'zh' ? '加载中...' : 'Loading...'}</p>
                        </div>
                      </div>
                    ) : selectedVersion.full_html ? (
                      <iframe
                        title={lang === 'zh' ? '版本预览' : 'Version preview'}
                        className="w-full h-full border-0 rounded-lg bg-white"
                        sandbox="allow-scripts"
                        srcDoc={decodeHtmlEntities(selectedVersion.full_html)}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <div className="text-center">
                          <FileCode className="w-12 h-12 mx-auto mb-2 opacity-30" />
                          <p>{lang === 'zh' ? '无预览' : 'No preview'}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className={cx('p-4 border-t', 'bg-slate-900/50 border-white/5')}>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className={cx('text-xs block mb-1 opacity-60')}>{lang === 'zh' ? '标题' : 'Title'}</span>
                      <span className="font-medium">{selectedVersion.topic}</span>
                    </div>
                    <div>
                      <span className={cx('text-xs block mb-1 opacity-60')}>{lang === 'zh' ? '主题' : 'Theme'}</span>
                      <span className="font-medium">{selectedVersion.color_palette || 'Default'}</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <p className={cx('text-sm opacity-60')}>
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
