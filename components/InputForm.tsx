
import React, { useState, ChangeEvent, useEffect } from 'react';
import { FileText, Upload, Sparkles, Settings, Users, Layers, Image as ImageIcon, Key, Target, XCircle, AlertTriangle, Eye, Edit3 } from 'lucide-react';
import { PresentationConfig, ApiSettings, ApiProvider, Language, Theme } from '../types';
import { PROVIDERS, AUDIENCE_PRESETS, PRESENTATION_PURPOSES, SAMPLE_CONTENT, TRANSLATIONS } from '../constants';
import { getThemeClasses, cx } from '../styles/theme';

interface InputFormProps {
  onGenerate: (config: PresentationConfig) => void;
  onCancel: () => void;
  isGenerating: boolean;
  lang: Language;
  t: (key: keyof typeof TRANSLATIONS['en']) => string;
  theme: Theme;
}

// Helper to safely load from local storage
const loadStr = (key: string, defaultVal: string) => localStorage.getItem(key) || defaultVal;
const loadNum = (key: string, defaultVal: number) => {
  const val = localStorage.getItem(key);
  return val ? parseInt(val, 10) : defaultVal;
};
const loadJson = <T,>(key: string, defaultVal: T): T => {
  const val = localStorage.getItem(key);
  try {
    return val ? JSON.parse(val) : defaultVal;
  } catch (e) {
    return defaultVal;
  }
};

const InputForm: React.FC<InputFormProps> = ({ onGenerate, onCancel, isGenerating, lang, t, theme }) => {
  // Load initial state from localStorage or defaults
  const [topic, setTopic] = useState(() => loadStr('gendeck_topic', "Gemini 1.5 Pro Overview"));
  const [audience, setAudience] = useState(() => loadStr('gendeck_audience', AUDIENCE_PRESETS[lang][0]));
  const [purpose, setPurpose] = useState(() => loadStr('gendeck_purpose', PRESENTATION_PURPOSES[lang][0]));
  const [slideCount, setSlideCount] = useState(() => loadNum('gendeck_count', 8));
  const [content, setContent] = useState(() => loadStr('gendeck_content', SAMPLE_CONTENT));
  const [showSettings, setShowSettings] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Settings State with Persistence
  const [apiKeys, setApiKeys] = useState<Partial<Record<ApiProvider, string>>>(() =>
    loadJson('gendeck_api_keys', {})
  );

  // Independent Selection with Persistence
  const [outlineProvider, setOutlineProvider] = useState<ApiProvider>(() =>
    loadStr('gendeck_p_outline', 'google') as ApiProvider
  );
  const [outlineModel, setOutlineModel] = useState(() =>
    loadStr('gendeck_m_outline', PROVIDERS.find(p=>p.id==='google')?.models[0].id || '')
  );

  const [slideProvider, setSlideProvider] = useState<ApiProvider>(() =>
    loadStr('gendeck_p_slide', 'google') as ApiProvider
  );
  const [slideModel, setSlideModel] = useState(() =>
    loadStr('gendeck_m_slide', PROVIDERS.find(p=>p.id==='google')?.models[0].id || '')
  );

  // Simulated Progress State
  const [progressMessage, setProgressMessage] = useState("");
  
  // Theme classes
  const th = getThemeClasses(theme);
  const isDark = theme === 'dark';

  // Simple markdown to HTML converter for preview
  const renderMarkdown = (text: string): string => {
    if (!text) return '';
    
    let html = text
      // Escape HTML
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      // Headers
      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>')
      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold mt-5 mb-3">$1</h2>')
      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold mt-6 mb-4">$1</h1>')
      // Bold and Italic
      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/___(.*?)___/g, '<strong><em>$1</em></strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      .replace(/_(.*?)_/g, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-800 text-gray-200 p-3 rounded-lg overflow-x-auto my-3 text-xs font-mono"><code>$1</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-gray-700 text-gray-200 px-1.5 py-0.5 rounded text-xs font-mono">$1</code>')
      // Lists
      .replace(/^\s*- (.*$)/gim, '<li class="ml-4 flex items-start gap-2"><span class="text-purple-400 mt-1.5">•</span><span>$1</span></li>')
      .replace(/^\s*\d+\. (.*$)/gim, '<li class="ml-4 flex items-start gap-2"><span class="text-purple-400 mt-1.5">1.</span><span>$1</span></li>')
      // Blockquotes
      .replace(/^> (.*$)/gim, '<blockquote class="border-l-4 border-purple-500 pl-4 italic my-3 text-gray-400">$1</blockquote>')
      // Horizontal rule
      .replace(/^---$/gim, '<hr class="border-gray-600 my-4" />')
      // Links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-purple-400 hover:underline" target="_blank" rel="noopener">$1</a>')
      // Line breaks
      .replace(/\n/g, '<br />');
    
    // Wrap consecutive list items in ul
    html = html.replace(/(<li[^>]*>.*?<\/li>)(<br \/>)?(<li[^>]*>.*?<\/li>)/g, '$1$3');
    html = html.replace(/(<li[^>]*>.*?<\/li>)(<br \/>)?/g, '<ul class="space-y-1 my-2">$1</ul>');
    
    return html;
  };

  // Persistence Effects
  useEffect(() => localStorage.setItem('gendeck_topic', topic), [topic]);
  useEffect(() => localStorage.setItem('gendeck_audience', audience), [audience]);
  useEffect(() => localStorage.setItem('gendeck_purpose', purpose), [purpose]);
  useEffect(() => localStorage.setItem('gendeck_count', slideCount.toString()), [slideCount]);
  useEffect(() => localStorage.setItem('gendeck_content', content), [content]);
  useEffect(() => localStorage.setItem('gendeck_api_keys', JSON.stringify(apiKeys)), [apiKeys]);

  useEffect(() => {
    localStorage.setItem('gendeck_p_outline', outlineProvider);
    localStorage.setItem('gendeck_m_outline', outlineModel);
  }, [outlineProvider, outlineModel]);

  useEffect(() => {
    localStorage.setItem('gendeck_p_slide', slideProvider);
    localStorage.setItem('gendeck_m_slide', slideModel);
  }, [slideProvider, slideModel]);

  // Simulated Progress Effect
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isGenerating) {
        const stages = lang === 'zh' ? [
            "正在分析文档内容...",
            "正在识别目标受众...",
            "正在构建演示流程...",
            "正在起草幻灯片标题...",
            "正在优化布局建议...",
            "正在完成大纲..."
        ] : [
            "Analyzing document content...",
            "Identifying target audience...",
            "Structuring presentation flow...",
            "Drafting slide titles...",
            "Refining layout suggestions...",
            "Finalizing outline..."
        ];

        let i = 0;
        setProgressMessage(`Stage 1/${stages.length}: ${stages[0]}`);

        interval = setInterval(() => {
            i = (i + 1) % stages.length;
            setProgressMessage(`Stage ${i + 1}/${stages.length}: ${stages[i]}`);
        }, 3000);
    } else {
        setProgressMessage("");
    }
    return () => clearInterval(interval);
  }, [isGenerating, lang]);


  // Helper to handle key changes
  const handleKeyChange = (provider: ApiProvider, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
    if (errorMsg) setErrorMsg(null); // Clear error on edit
  };

  // Helper to update model when provider changes
  const handleProviderChange = (
    type: 'outline' | 'slides',
    providerId: ApiProvider
  ) => {
    const providerConfig = PROVIDERS.find(p => p.id === providerId);
    const defaultModel = providerConfig?.models[0]?.id || '';

    if (type === 'outline') {
      setOutlineProvider(providerId);
      setOutlineModel(defaultModel);
    } else {
      setSlideProvider(providerId);
      setSlideModel(defaultModel);
    }
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        setContent(text);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate API Keys
    const providersToCheck = new Set<ApiProvider>([outlineProvider, slideProvider]);

    const missingKeys: string[] = [];
    providersToCheck.forEach(p => {
        if (!apiKeys[p] || apiKeys[p]!.trim() === '') {
            missingKeys.push(PROVIDERS.find(prov => prov.id === p)?.name || p);
        }
    });

    if (missingKeys.length > 0) {
        setShowSettings(true);
        setErrorMsg(`Missing API Keys for: ${missingKeys.join(', ')}. Please enter them in Model Settings.`);
        return;
    }

    // Construct simplified settings object
    const getBaseUrl = (pId: ApiProvider) => PROVIDERS.find(p => p.id === pId)?.defaultBaseUrl;

    const apiSettings: ApiSettings = {
      apiKeys: apiKeys,
      outline: {
        provider: outlineProvider,
        modelId: outlineModel,
        baseUrl: getBaseUrl(outlineProvider)
      },
      slides: {
        provider: slideProvider,
        modelId: slideModel,
        baseUrl: getBaseUrl(slideProvider)
      }
    };

    onGenerate({ topic, audience, purpose, slideCount, apiSettings, documentContent: content });
  };

  return (
    <div className={cx(
      'max-w-5xl mx-auto p-6 backdrop-blur rounded-2xl shadow-2xl border',
      isDark ? 'bg-slate-900/50 shadow-black/20 border-white/10' : 'bg-white/70 shadow-gray-200/50 border-gray-200'
    )}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-400" />
          {t('createNewDeck')}
        </h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={cx(
            'transition-all flex items-center gap-2 px-3 py-1.5 rounded-lg border',
            showSettings
              ? 'bg-purple-500/20 border-purple-500/50 text-white shadow-lg shadow-purple-500/10'
              : cx('hover:border-white/20', th.button.ghost)
          )}
          title="Configure AI Model"
        >
          <Settings className="w-4 h-4" />
          <span className="text-xs font-medium">{t('modelSettings')}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Advanced Model Configuration Panel */}
        {showSettings && (
          <div className={cx(
            'p-5 backdrop-blur rounded-xl border mb-6 animate-in fade-in slide-in-from-top-2 space-y-6',
            isDark ? 'bg-slate-950/80 border-purple-500/20' : 'bg-gray-50/80 border-purple-200'
          )}>

            {errorMsg && (
                <div className={cx(
                  'border rounded-lg p-3 flex items-start gap-3',
                  isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'
                )}>
                    <AlertTriangle className={cx('w-5 h-5 shrink-0', isDark ? 'text-red-400' : 'text-red-600')} />
                    <p className={cx('text-sm', isDark ? 'text-red-200' : 'text-red-700')}>{errorMsg}</p>
                </div>
            )}

            {/* 1. API Keys Section */}
            <div>
              <h3 className={cx('text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2', th.text.tertiary)}>
                 <Key className="w-3 h-3" /> {t('apiCredentials')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PROVIDERS.map(p => (
                  <div key={p.id}>
                    <label className={cx(
                      'block text-xs mb-1.5',
                      !apiKeys[p.id] && (outlineProvider === p.id || slideProvider === p.id) ? 'text-orange-500 font-bold' : th.text.tertiary
                    )}>
                        {p.name} API Key {(!apiKeys[p.id] && (outlineProvider === p.id || slideProvider === p.id)) ? '*' : ''}
                    </label>
                    <input
                      type="password"
                      value={apiKeys[p.id] || ''}
                      onChange={(e) => handleKeyChange(p.id, e.target.value)}
                      placeholder={p.placeholderKey}
                      className={cx(
                        'w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all',
                        th.input.bg, th.input.border, th.input.text, th.input.focusBorder,
                        !apiKeys[p.id] && errorMsg && (outlineProvider === p.id || slideProvider === p.id) ? 'border-red-500/50 focus:border-red-500' : ''
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className={cx('h-px w-full', th.border.divider)} />

            {/* 2. Model Selection Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Outline Config */}
              <div className={cx(
                'p-3 rounded-lg border',
                isDark ? 'bg-slate-900/50 border-white/5' : 'bg-gray-100/50 border-gray-200'
              )}>
                 <label className="block text-xs font-bold text-blue-400 mb-2 flex items-center gap-1">
                    <Layers className="w-3 h-3" /> {t('step1Outline')}
                 </label>
                 <div className="space-y-3">
                   <div>
                     <label className={cx('block text-[10px] mb-1', th.text.muted)}>{t('provider')}</label>
                     <select
                        value={outlineProvider}
                        onChange={(e) => handleProviderChange('outline', e.target.value as ApiProvider)}
                        className={cx(
                          'w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all',
                          th.input.bg, th.input.border, th.input.text, th.input.focusBorder
                        )}
                     >
                       {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className={cx('block text-[10px] mb-1', th.text.muted)}>{t('model')}</label>
                     <select
                        value={outlineModel}
                        onChange={(e) => setOutlineModel(e.target.value)}
                        className={cx(
                          'w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all',
                          th.input.bg, th.input.border, th.input.text, th.input.focusBorder
                        )}
                     >
                       {PROVIDERS.find(p => p.id === outlineProvider)?.models.map(m => (
                         <option key={m.id} value={m.id}>{m.name}</option>
                       ))}
                     </select>
                   </div>
                 </div>
              </div>

              {/* Slide Config */}
              <div className={cx(
                'p-3 rounded-lg border',
                isDark ? 'bg-slate-900/50 border-white/5' : 'bg-gray-100/50 border-gray-200'
              )}>
                 <label className="block text-xs font-bold text-green-400 mb-2 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" /> {t('step2Slides')}
                 </label>
                 <div className="space-y-3">
                   <div>
                     <label className={cx('block text-[10px] mb-1', th.text.muted)}>{t('provider')}</label>
                     <select
                        value={slideProvider}
                        onChange={(e) => handleProviderChange('slides', e.target.value as ApiProvider)}
                        className={cx(
                          'w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all',
                          th.input.bg, th.input.border, th.input.text, th.input.focusBorder
                        )}
                     >
                       {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className={cx('block text-[10px] mb-1', th.text.muted)}>{t('model')}</label>
                     <select
                        value={slideModel}
                        onChange={(e) => setSlideModel(e.target.value)}
                        className={cx(
                          'w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all',
                          th.input.bg, th.input.border, th.input.text, th.input.focusBorder
                        )}
                     >
                       {PROVIDERS.find(p => p.id === slideProvider)?.models.map(m => (
                         <option key={m.id} value={m.id}>{m.name}</option>
                       ))}
                     </select>
                   </div>
                 </div>
              </div>
            </div>

          </div>
        )}

        {/* Form Fields - Vertical Layout (consistent across all screen sizes) */}
        <div className="space-y-6">

          {/* 1. Topic/Title */}
          <div>
            <label className={cx('block text-sm font-medium mb-2', th.text.secondary)}>{t('topicLabel')}</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className={cx(
                'w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all',
                th.input.bg, th.input.border, th.input.text, th.input.placeholder, th.input.focusBorder
              )}
              placeholder={t('topicPlaceholder')}
              required
            />
          </div>

          {/* 2. Number of Slides */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className={cx('block text-sm font-medium', th.text.secondary)}>{t('slideCountLabel')}</label>
              <span className={cx(
                'text-sm font-bold text-purple-500 px-2 py-0.5 rounded',
                isDark ? 'bg-purple-900/30' : 'bg-purple-100'
              )}>{slideCount}</span>
            </div>
            <input
              type="range"
              min="3"
              max="20"
              value={slideCount}
              onChange={(e) => setSlideCount(parseInt(e.target.value))}
              className={cx(
                'w-full h-2 rounded-lg appearance-none cursor-pointer accent-purple-500',
                isDark ? 'bg-gray-700' : 'bg-gray-300'
              )}
            />
            <div className={cx('flex justify-between text-[10px] mt-1', th.text.muted)}>
              <span>3</span>
              <span>20</span>
            </div>
          </div>

          {/* 3. Target Audience */}
          <div>
             <label className={cx('block text-sm font-medium mb-2 flex items-center gap-2', th.text.secondary)}>
               <Users className="w-4 h-4 text-purple-500"/> {t('audienceLabel')}
             </label>
             <div className="flex flex-wrap gap-2 mb-2">
               {AUDIENCE_PRESETS[lang].map((aud) => (
                 <button
                  key={aud}
                  type="button"
                  onClick={() => setAudience(aud)}
                  className={cx(
                    'px-3 py-1.5 text-xs rounded-full border transition-all',
                    audience === aud
                      ? th.selection.active
                      : cx(th.selection.inactive, 'hover:border-white/20')
                  )}
                 >
                   {aud}
                 </button>
               ))}
             </div>
             <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className={cx(
                  'w-full border rounded-md px-4 py-2 text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none',
                  isDark ? 'bg-gray-900 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'
                )}
                placeholder={t('audiencePlaceholder')}
              />
          </div>

          {/* 4. Presentation Goal */}
          <div>
             <label className={cx('block text-sm font-medium mb-2 flex items-center gap-2', th.text.secondary)}>
               <Target className="w-4 h-4 text-blue-500"/> {t('purposeLabel')}
             </label>
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
               {PRESENTATION_PURPOSES[lang].map((p) => (
                 <button
                  key={p}
                  type="button"
                  onClick={() => setPurpose(p)}
                  className={cx(
                    'px-3 py-2 text-xs rounded-md border text-left transition-all',
                    purpose === p
                      ? 'bg-blue-600/20 border-blue-500 text-blue-700'
                      : cx(th.selection.inactive, 'hover:border-white/20')
                  )}
                 >
                   {p}
                 </button>
               ))}
             </div>
          </div>

          {/* 5. Source Document */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={cx('block text-sm font-medium', th.text.secondary)}>
                {t('sourceLabel')}
                <span className={cx('text-xs ml-2', th.text.muted)}>({t('sourcePlaceholder')})</span>
              </label>
              {/* Edit/Preview Toggle */}
              <div className={cx('flex items-center rounded-lg border p-0.5', th.input.bg, th.border.secondary)}>
                <button
                  type="button"
                  onClick={() => setShowPreview(false)}
                  className={cx(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                    !showPreview 
                      ? cx(th.bg.tertiary, th.text.primary, 'shadow-sm') 
                      : cx(th.text.muted, 'hover:text-current')
                  )}
                >
                  <Edit3 className="w-3 h-3" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => setShowPreview(true)}
                  className={cx(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all',
                    showPreview 
                      ? cx(th.bg.tertiary, th.text.primary, 'shadow-sm') 
                      : cx(th.text.muted, 'hover:text-current')
                  )}
                >
                  <Eye className="w-3 h-3" />
                  Preview
                </button>
              </div>
            </div>
            <div className="relative">
              {showPreview ? (
                // Markdown Preview
                <div
                  className={cx(
                    'w-full border rounded-lg px-4 py-3 text-sm overflow-y-auto resize-y min-h-[300px] max-h-[500px]',
                    th.input.bg, th.input.border, isDark ? 'text-slate-300' : 'text-gray-700'
                  )}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                />
              ) : (
                // Edit Mode
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  className={cx(
                    'w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-mono resize-y',
                    th.input.bg, th.input.border, isDark ? 'text-slate-300' : 'text-gray-700', th.input.placeholder, th.input.focusBorder
                  )}
                  placeholder={t('pastePlaceholder')}
                />
              )}
              <div className="absolute bottom-3 right-3">
                <label className={cx(
                  'cursor-pointer text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all border',
                  isDark ? 'bg-slate-800 hover:bg-slate-700 text-white border-white/10 hover:border-white/20' : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-300 hover:border-gray-400'
                )}>
                  <Upload className="w-3 h-3" />
                  {t('uploadFile')}
                  <input type="file" accept=".txt,.md,.json" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>

        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={isGenerating || !content.trim()}
            className={`flex-1 bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-500 hover:via-purple-500 hover:to-fuchsia-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-purple-500/25 flex items-center justify-center gap-3 transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-lg ${isGenerating ? 'cursor-not-allowed' : ''}`}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="animate-pulse">{progressMessage || t('thinking')}</span>
              </>
            ) : (
              <>
                <FileText className="w-6 h-6" />
                {t('generateBtn')}
              </>
            )}
          </button>

          {isGenerating && (
             <button
                type="button"
                onClick={onCancel}
                className={cx(
                  'border font-bold py-4 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transform transition-all active:scale-95 animate-in fade-in',
                  th.button.danger
                )}
             >
                <XCircle className="w-6 h-6" />
                {t('cancel')}
             </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default InputForm;
