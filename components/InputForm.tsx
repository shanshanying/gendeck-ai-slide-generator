
import React, { useState, ChangeEvent, useEffect } from 'react';
import { FileText, Upload, Sparkles, Settings, Users, Layers, Image as ImageIcon, Key, Target, XCircle, AlertTriangle } from 'lucide-react';
import { PresentationConfig, ApiSettings, ApiProvider, Language } from '../types';
import { PROVIDERS, AUDIENCE_PRESETS, PRESENTATION_PURPOSES, SAMPLE_CONTENT, TRANSLATIONS } from '../constants';

interface InputFormProps {
  onGenerate: (config: PresentationConfig) => void;
  onCancel: () => void;
  isGenerating: boolean;
  lang: Language;
  t: (key: keyof typeof TRANSLATIONS['en']) => string;
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

const InputForm: React.FC<InputFormProps> = ({ onGenerate, onCancel, isGenerating, lang, t }) => {
  // Load initial state from localStorage or defaults
  const [topic, setTopic] = useState(() => loadStr('gendeck_topic', "Gemini 1.5 Pro Overview"));
  const [audience, setAudience] = useState(() => loadStr('gendeck_audience', AUDIENCE_PRESETS[lang][0]));
  const [purpose, setPurpose] = useState(() => loadStr('gendeck_purpose', PRESENTATION_PURPOSES[lang][0]));
  const [slideCount, setSlideCount] = useState(() => loadNum('gendeck_count', 8));
  const [content, setContent] = useState(() => loadStr('gendeck_content', SAMPLE_CONTENT));
  const [showSettings, setShowSettings] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
    <div className="max-w-5xl mx-auto p-6 bg-slate-900/50 backdrop-blur rounded-2xl shadow-2xl shadow-black/20 border border-white/10">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-400" />
          {t('createNewDeck')}
        </h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`transition-all flex items-center gap-2 px-3 py-1.5 rounded-lg border ${showSettings ? 'bg-purple-500/20 border-purple-500/50 text-white shadow-lg shadow-purple-500/10' : 'border-white/10 text-slate-400 hover:text-white hover:bg-white/5 hover:border-white/20'}`}
          title="Configure AI Model"
        >
          <Settings className="w-4 h-4" />
          <span className="text-xs font-medium">{t('modelSettings')}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* Advanced Model Configuration Panel */}
        {showSettings && (
          <div className="p-5 bg-slate-950/80 backdrop-blur rounded-xl border border-purple-500/20 mb-6 animate-in fade-in slide-in-from-top-2 space-y-6">

            {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                    <p className="text-sm text-red-200">{errorMsg}</p>
                </div>
            )}

            {/* 1. API Keys Section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                 <Key className="w-3 h-3" /> {t('apiCredentials')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PROVIDERS.map(p => (
                  <div key={p.id}>
                    <label className={`block text-xs mb-1.5 ${!apiKeys[p.id] && (outlineProvider === p.id || slideProvider === p.id) ? 'text-orange-400 font-bold' : 'text-slate-400'}`}>
                        {p.name} API Key {(!apiKeys[p.id] && (outlineProvider === p.id || slideProvider === p.id)) ? '*' : ''}
                    </label>
                    <input
                      type="password"
                      value={apiKeys[p.id] || ''}
                      onChange={(e) => handleKeyChange(p.id, e.target.value)}
                      placeholder={p.placeholderKey}
                      className={`w-full bg-slate-900 border rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all ${!apiKeys[p.id] && errorMsg && (outlineProvider === p.id || slideProvider === p.id) ? 'border-red-500/50 focus:border-red-500' : 'border-white/10 focus:border-purple-500/50'}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="h-px bg-white/5 w-full" />

            {/* 2. Model Selection Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Outline Config */}
              <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5">
                 <label className="block text-xs font-bold text-blue-400 mb-2 flex items-center gap-1">
                    <Layers className="w-3 h-3" /> {t('step1Outline')}
                 </label>
                 <div className="space-y-3">
                   <div>
                     <label className="block text-[10px] text-gray-500 mb-1">{t('provider')}</label>
                     <select
                        value={outlineProvider}
                        onChange={(e) => handleProviderChange('outline', e.target.value as ApiProvider)}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                     >
                       {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="block text-[10px] text-gray-500 mb-1">{t('model')}</label>
                     <select
                        value={outlineModel}
                        onChange={(e) => setOutlineModel(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                     >
                       {PROVIDERS.find(p => p.id === outlineProvider)?.models.map(m => (
                         <option key={m.id} value={m.id}>{m.name}</option>
                       ))}
                     </select>
                   </div>
                 </div>
              </div>

              {/* Slide Config */}
              <div className="bg-slate-900/50 p-3 rounded-lg border border-white/5">
                 <label className="block text-xs font-bold text-green-400 mb-2 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" /> {t('step2Slides')}
                 </label>
                 <div className="space-y-3">
                   <div>
                     <label className="block text-[10px] text-gray-500 mb-1">{t('provider')}</label>
                     <select
                        value={slideProvider}
                        onChange={(e) => handleProviderChange('slides', e.target.value as ApiProvider)}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
                     >
                       {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="block text-[10px] text-gray-500 mb-1">{t('model')}</label>
                     <select
                        value={slideModel}
                        onChange={(e) => setSlideModel(e.target.value)}
                        className="w-full bg-slate-950 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
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
            <label className="block text-sm font-medium text-slate-300 mb-2">{t('topicLabel')}</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-white placeholder:text-slate-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
              placeholder={t('topicPlaceholder')}
              required
            />
          </div>

          {/* 2. Number of Slides */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-300">{t('slideCountLabel')}</label>
              <span className="text-sm font-bold text-purple-400 bg-purple-900/30 px-2 py-0.5 rounded">{slideCount}</span>
            </div>
            <input
              type="range"
              min="3"
              max="20"
              value={slideCount}
              onChange={(e) => setSlideCount(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1">
              <span>3</span>
              <span>20</span>
            </div>
          </div>

          {/* 3. Target Audience */}
          <div>
             <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
               <Users className="w-4 h-4 text-purple-400"/> {t('audienceLabel')}
             </label>
             <div className="flex flex-wrap gap-2 mb-2">
               {AUDIENCE_PRESETS[lang].map((aud) => (
                 <button
                  key={aud}
                  type="button"
                  onClick={() => setAudience(aud)}
                  className={`px-3 py-1.5 text-xs rounded-full border transition-all ${
                    audience === aud
                    ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-900/50'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                 >
                   {aud}
                 </button>
               ))}
             </div>
             <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-md px-4 py-2 text-white text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none"
                placeholder={t('audiencePlaceholder')}
              />
          </div>

          {/* 4. Presentation Goal */}
          <div>
             <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
               <Target className="w-4 h-4 text-blue-400"/> {t('purposeLabel')}
             </label>
             <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
               {PRESENTATION_PURPOSES[lang].map((p) => (
                 <button
                  key={p}
                  type="button"
                  onClick={() => setPurpose(p)}
                  className={`px-3 py-2 text-xs rounded-md border text-left transition-all ${
                    purpose === p
                    ? 'bg-blue-900/40 border-blue-500 text-blue-100'
                    : 'bg-gray-900 border-gray-700 text-gray-400 hover:border-gray-500'
                  }`}
                 >
                   {p}
                 </button>
               ))}
             </div>
          </div>

          {/* 5. Source Document */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              {t('sourceLabel')}
              <span className="text-xs text-slate-500 ml-2">({t('sourcePlaceholder')})</span>
            </label>
            <div className="relative">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={12}
                className="w-full bg-slate-950 border border-white/10 rounded-lg px-4 py-3 text-sm text-slate-300 placeholder:text-slate-500 focus:border-purple-500/50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-mono resize-y"
                placeholder={t('pastePlaceholder')}
              />
              <div className="absolute bottom-3 right-3">
                <label className="cursor-pointer bg-slate-800 hover:bg-slate-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all border border-white/10 hover:border-white/20">
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
                className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-200 font-bold py-4 px-6 rounded-xl shadow-lg flex items-center justify-center gap-2 transform transition-all active:scale-95 animate-in fade-in"
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
