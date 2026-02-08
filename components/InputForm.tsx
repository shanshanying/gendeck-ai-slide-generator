
import React, { useState, ChangeEvent, useEffect, useMemo, useCallback } from 'react';
import { FileText, Upload, Sparkles, Settings, Users, Key, Target, XCircle, AlertTriangle, Eye, Edit3, FileUp, Wand2, CheckSquare, Square } from 'lucide-react';
import { parseExportedHtml, ImportResult } from '../services/importService';
import { analyzeContent, ContentAnalysis } from '../services/geminiService';
import { PresentationConfig, ApiSettings, ApiProvider, Language } from '../types';
import type { Theme } from '../styles/theme';
import { 
  PROVIDERS, 
  SAMPLE_CONTENT, 
  TRANSLATIONS, 
  COLOR_THEMES,
  AUDIENCE_CATEGORIES,
  PURPOSE_CATEGORIES,
  STYLE_PRESETS,
  getStylePreset,
  resolveStyleRecommendation,
  type AudienceCategory,
  type PurposeCategory
} from '../constants';
import { getThemeClasses, cx } from '../styles/theme';

interface InputFormProps {
  onGenerate: (config: PresentationConfig) => void;
  onCancel: () => void;
  isGenerating: boolean;
  lang: Language;
  t: (key: keyof typeof TRANSLATIONS['en']) => string;
  theme: Theme;
  onImportHtml?: (result: ImportResult) => void;
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

const InputForm: React.FC<InputFormProps> = ({ onGenerate, onCancel, isGenerating, lang, t, theme, onImportHtml }) => {
  // Load initial state from localStorage or defaults
  const [topic, setTopic] = useState(() => loadStr('gendeck_topic', ""));
  const [slideCount, setSlideCount] = useState(() => loadNum('gendeck_count', 8));
  const [content, setContent] = useState(() => loadStr('gendeck_content', SAMPLE_CONTENT));
  const [showSettings, setShowSettings] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [strictMode, setStrictMode] = useState(() => loadJson('gendeck_strict_mode', false));

  // ========== AUDIENCE SELECTION STATE ==========
  const [audienceCategoryId, setAudienceCategoryId] = useState<string>(() => 
    loadStr('gendeck_audience_category', AUDIENCE_CATEGORIES[0].id)
  );
  const [audienceSubcategoryId, setAudienceSubcategoryId] = useState<string>(() => 
    loadStr('gendeck_audience_subcategory', AUDIENCE_CATEGORIES[0].audiences[0].id)
  );
  const [customAudience, setCustomAudience] = useState<string>(() => 
    loadStr('gendeck_custom_audience', '')
  );
  const [useCustomAudience, setUseCustomAudience] = useState(() => 
    loadJson('gendeck_use_custom_audience', false)
  );

  // ========== PURPOSE SELECTION STATE ==========
  const [purposeCategoryId, setPurposeCategoryId] = useState<string>(() => 
    loadStr('gendeck_purpose_category', PURPOSE_CATEGORIES[0].id)
  );
  const [purposeSubcategoryId, setPurposeSubcategoryId] = useState<string>(() => 
    loadStr('gendeck_purpose_subcategory', PURPOSE_CATEGORIES[0].purposes[0].id)
  );
  const [customPurpose, setCustomPurpose] = useState<string>(() => 
    loadStr('gendeck_custom_purpose', '')
  );
  const [useCustomPurpose, setUseCustomPurpose] = useState(() => 
    loadJson('gendeck_use_custom_purpose', false)
  );

  // ========== STYLE OVERRIDE STATE ==========
  const [overrideStyleId, setOverrideStyleId] = useState<string>(() => 
    loadStr('gendeck_override_style', '')
  );
  const [useStyleOverride, setUseStyleOverride] = useState(() => 
    loadJson('gendeck_use_style_override', false)
  );

  // ========== COMPUTED VALUES ==========
  
  // Final audience string (custom or from selection)
  const finalAudience = useMemo(() => {
    if (useCustomAudience && customAudience.trim()) {
      return customAudience.trim();
    }
    const category = AUDIENCE_CATEGORIES.find(c => c.id === audienceCategoryId);
    const sub = category?.audiences.find(a => a.id === audienceSubcategoryId);
    return sub?.label[lang] || category?.label[lang] || '';
  }, [useCustomAudience, customAudience, audienceCategoryId, audienceSubcategoryId, lang]);

  // Final purpose string (custom or from selection)
  const finalPurpose = useMemo(() => {
    if (useCustomPurpose && customPurpose.trim()) {
      return customPurpose.trim();
    }
    const category = PURPOSE_CATEGORIES.find(c => c.id === purposeCategoryId);
    const sub = category?.purposes.find(p => p.id === purposeSubcategoryId);
    return sub?.label[lang] || category?.label[lang] || '';
  }, [useCustomPurpose, customPurpose, purposeCategoryId, purposeSubcategoryId, lang]);

  // Computed style recommendation based on audience + purpose
  const styleRecommendation = useMemo(() => {
    if (useStyleOverride && overrideStyleId) {
      const preset = getStylePreset(overrideStyleId);
      return {
        presetId: overrideStyleId,
        preset,
        reason: { en: 'User selected style', zh: '用户选择的风格' }
      };
    }
    const rec = resolveStyleRecommendation(audienceCategoryId, purposeCategoryId, lang);
    const preset = getStylePreset(rec.presetId);
    return { ...rec, preset };
  }, [audienceCategoryId, purposeCategoryId, useStyleOverride, overrideStyleId, lang]);

  // ========== SETTINGS STATE ==========
  const [apiKeys, setApiKeys] = useState<Partial<Record<ApiProvider, string>>>(() =>
    loadJson('gendeck_api_keys', {})
  );
  const [provider, setProvider] = useState<ApiProvider>(() =>
    loadStr('gendeck_provider', 'google') as ApiProvider
  );
  const [model, setModel] = useState(() =>
    loadStr('gendeck_model', PROVIDERS.find(p=>p.id==='google')?.models[0].id || '')
  );

  // Progress and analysis state
  const [progressMessage, setProgressMessage] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    suggestedAudienceCat?: string;
    suggestedAudienceSub?: string;
    suggestedPurposeCat?: string;
    suggestedPurposeSub?: string;
    reasoning?: string;
  } | null>(null);

  const th = getThemeClasses(theme);
  
  // Update progress message when generating state changes
  useEffect(() => {
    if (!isGenerating) {
      setProgressMessage('');
      return;
    }
    
    // Cycle through progress messages for better UX
    const messages = [
      t('analyzingContent'),
      t('generatingOutline'),
      t('generating')
    ];
    let index = 0;
    setProgressMessage(messages[index]);
    
    const interval = setInterval(() => {
      index = (index + 1) % messages.length;
      setProgressMessage(messages[index]);
    }, 2000);
    
    return () => clearInterval(interval);
  }, [isGenerating, t]);

  // ========== PERSISTENCE EFFECTS ==========
  useEffect(() => localStorage.setItem('gendeck_topic', topic), [topic]);
  useEffect(() => localStorage.setItem('gendeck_count', slideCount.toString()), [slideCount]);
  useEffect(() => localStorage.setItem('gendeck_content', content), [content]);
  useEffect(() => localStorage.setItem('gendeck_strict_mode', JSON.stringify(strictMode)), [strictMode]);
  useEffect(() => localStorage.setItem('gendeck_api_keys', JSON.stringify(apiKeys)), [apiKeys]);
  useEffect(() => {
    localStorage.setItem('gendeck_provider', provider);
    localStorage.setItem('gendeck_model', model);
  }, [provider, model]);

  // Audience persistence
  useEffect(() => localStorage.setItem('gendeck_audience_category', audienceCategoryId), [audienceCategoryId]);
  useEffect(() => localStorage.setItem('gendeck_audience_subcategory', audienceSubcategoryId), [audienceSubcategoryId]);
  useEffect(() => localStorage.setItem('gendeck_custom_audience', customAudience), [customAudience]);
  useEffect(() => localStorage.setItem('gendeck_use_custom_audience', JSON.stringify(useCustomAudience)), [useCustomAudience]);

  // Purpose persistence
  useEffect(() => localStorage.setItem('gendeck_purpose_category', purposeCategoryId), [purposeCategoryId]);
  useEffect(() => localStorage.setItem('gendeck_purpose_subcategory', purposeSubcategoryId), [purposeSubcategoryId]);
  useEffect(() => localStorage.setItem('gendeck_custom_purpose', customPurpose), [customPurpose]);
  useEffect(() => localStorage.setItem('gendeck_use_custom_purpose', JSON.stringify(useCustomPurpose)), [useCustomPurpose]);

  // Style persistence
  useEffect(() => localStorage.setItem('gendeck_override_style', overrideStyleId), [overrideStyleId]);
  useEffect(() => localStorage.setItem('gendeck_use_style_override', JSON.stringify(useStyleOverride)), [useStyleOverride]);

  // ========== HELPERS ==========
  const handleCategoryChange = useCallback((newCategoryId: string) => {
    setAudienceCategoryId(newCategoryId);
    const category = AUDIENCE_CATEGORIES.find(c => c.id === newCategoryId);
    if (category) {
      setAudienceSubcategoryId(category.audiences[0].id);
    }
  }, []);

  const handlePurposeCategoryChange = useCallback((newCategoryId: string) => {
    setPurposeCategoryId(newCategoryId);
    const category = PURPOSE_CATEGORIES.find(c => c.id === newCategoryId);
    if (category) {
      setPurposeSubcategoryId(category.purposes[0].id);
    }
  }, []);

  // ========== ANALYSIS FUNCTION (试试手气) ==========
  const handleFeelingLucky = async () => {
    if (!content.trim()) {
      setErrorMsg(lang === 'zh' ? '请输入内容以进行分析' : 'Please enter content to analyze');
      return;
    }

    if (!apiKeys[provider] || apiKeys[provider]!.trim() === '') {
      setShowSettings(true);
      setErrorMsg(`Missing API Key for: ${PROVIDERS.find(p => p.id === provider)?.name || provider}. Please enter it in Model Settings.`);
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    setAnalysisResult(null);

    try {
      const getBaseUrl = (pId: ApiProvider) => PROVIDERS.find(p => p.id === pId)?.defaultBaseUrl;
      const apiSettings: ApiSettings = {
        apiKeys: apiKeys,
        model: {
          provider: provider,
          modelId: model,
          baseUrl: getBaseUrl(provider)
        }
      };

      const result = await analyzeContent(content, lang, apiSettings);
      const { audience: suggestedAudience, purpose: suggestedPurpose, reasoning } = result.data;
      
      // Find best matching audience category and subcategory
      let matchedAudienceCat = AUDIENCE_CATEGORIES[0].id;
      let matchedAudienceSub = AUDIENCE_CATEGORIES[0].audiences[0].id;
      let matchedPurposeCat = PURPOSE_CATEGORIES[0].id;
      let matchedPurposeSub = PURPOSE_CATEGORIES[0].purposes[0].id;

      // Match audience
      const audLower = suggestedAudience.toLowerCase();
      for (const cat of AUDIENCE_CATEGORIES) {
        for (const aud of cat.audiences) {
          if (audLower.includes(aud.label.en.toLowerCase()) ||
              audLower.includes(aud.label.zh.toLowerCase()) ||
              aud.label.en.toLowerCase().includes(audLower) ||
              aud.label.zh.toLowerCase().includes(audLower)) {
            matchedAudienceCat = cat.id;
            matchedAudienceSub = aud.id;
            break;
          }
        }
        if (matchedAudienceCat !== AUDIENCE_CATEGORIES[0].id) break;
      }

      // Match purpose
      const purLower = suggestedPurpose.toLowerCase();
      for (const cat of PURPOSE_CATEGORIES) {
        for (const pur of cat.purposes) {
          if (purLower.includes(pur.label.en.toLowerCase()) ||
              purLower.includes(pur.label.zh.toLowerCase()) ||
              pur.label.en.toLowerCase().includes(purLower) ||
              pur.label.zh.toLowerCase().includes(purLower)) {
            matchedPurposeCat = cat.id;
            matchedPurposeSub = pur.id;
            break;
          }
        }
        if (matchedPurposeCat !== PURPOSE_CATEGORIES[0].id) break;
      }

      // Update state
      setAudienceCategoryId(matchedAudienceCat);
      setAudienceSubcategoryId(matchedAudienceSub);
      setPurposeCategoryId(matchedPurposeCat);
      setPurposeSubcategoryId(matchedPurposeSub);
      setUseCustomAudience(false);
      setUseCustomPurpose(false);
      
      setAnalysisResult({
        suggestedAudienceCat: matchedAudienceCat,
        suggestedAudienceSub: matchedAudienceSub,
        suggestedPurposeCat: matchedPurposeCat,
        suggestedPurposeSub: matchedPurposeSub,
        reasoning
      });
      
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        setErrorMsg(error?.message || (lang === 'zh' ? '分析失败，请重试' : 'Analysis failed, please try again'));
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ========== SUBMIT HANDLER ==========
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!apiKeys[provider] || apiKeys[provider]!.trim() === '') {
      setShowSettings(true);
      setErrorMsg(`Missing API Key for: ${PROVIDERS.find(p => p.id === provider)?.name || provider}. Please enter it in Model Settings.`);
      return;
    }

    if (!finalAudience.trim()) {
      setErrorMsg(lang === 'zh' ? '请选择或输入目标受众' : 'Please select or enter target audience');
      return;
    }

    if (!finalPurpose.trim()) {
      setErrorMsg(lang === 'zh' ? '请选择或输入演示目标' : 'Please select or enter presentation purpose');
      return;
    }

    const getBaseUrl = (pId: ApiProvider) => PROVIDERS.find(p => p.id === pId)?.defaultBaseUrl;

    const apiSettings: ApiSettings = {
      apiKeys: apiKeys,
      model: {
        provider: provider,
        modelId: model,
        baseUrl: getBaseUrl(provider)
      }
    };

    onGenerate({ 
      topic: topic || (lang === 'zh' ? '未命名演示' : 'Untitled Presentation'), 
      audience: finalAudience, 
      purpose: finalPurpose, 
      slideCount, 
      apiSettings, 
      documentContent: content, 
      strictMode,
      stylePresetId: styleRecommendation.presetId
    });
  };

  // ========== RENDER ==========
  const recommendedTheme = COLOR_THEMES.find(t => t.id === styleRecommendation.preset?.recommendedThemes[0]);

  return (
    <div className={cx(
      'w-full min-h-full max-w-6xl xl:max-w-7xl 2xl:max-w-[90rem] mx-auto px-6 sm:px-8 lg:px-12 py-8 lg:py-10 backdrop-blur rounded-2xl shadow-2xl border',
      'bg-slate-900/50 shadow-black/20 border-white/10'
    )}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-white flex items-center gap-2">
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
        >
          <Settings className="w-4 h-4" />
          <span className="text-xs font-medium">{t('modelSettings')}</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Model Settings Panel */}
        {showSettings && (
          <div className={cx(
            'p-5 backdrop-blur rounded-xl border mb-6 animate-in fade-in slide-in-from-top-2 space-y-6',
            'bg-slate-950/80 border-purple-500/20'
          )}>
            {errorMsg && (
              <div className={cx(
                'border rounded-lg p-3 flex items-start gap-3',
                'bg-red-500/10 border-red-500/20'
              )}>
                <AlertTriangle className={cx('w-5 h-5 shrink-0', 'text-red-400')} />
                <p className={cx('text-sm', 'text-red-200')}>{errorMsg}</p>
              </div>
            )}

            {/* API Keys */}
            <div>
              <h3 className={cx('text-xs font-semibold uppercase tracking-wider mb-3 flex items-center gap-2', th.text.tertiary)}>
                <Key className="w-3 h-3" /> {t('apiCredentials')}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PROVIDERS.map(p => (
                  <div key={p.id}>
                    <label className={cx(
                      'block text-xs mb-1.5',
                      !apiKeys[p.id] && provider === p.id ? 'text-orange-500 font-bold' : th.text.tertiary
                    )}>
                      {p.name} API Key {(!apiKeys[p.id] && provider === p.id) ? '*' : ''}
                    </label>
                    <input
                      type="password"
                      value={apiKeys[p.id] || ''}
                      onChange={(e) => setApiKeys(prev => ({ ...prev, [p.id]: e.target.value }))}
                      placeholder={p.placeholderKey}
                      className={cx(
                        'w-full border rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all',
                        th.input.bg, th.input.border, th.input.text, th.input.focusBorder
                      )}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className={cx('h-px w-full', th.border.divider)} />

            {/* Model Selection */}
            <div className={cx(
              'p-4 rounded-lg border max-w-md mx-auto',
              'bg-slate-900/50 border-white/5'
            )}>
              <label className="block text-xs font-bold text-purple-400 mb-3 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> {t('aiModel')}
              </label>
              <div className="space-y-3">
                <div>
                  <label className={cx('block text-[10px] mb-1', th.text.muted)}>{t('provider')}</label>
                  <select
                    value={provider}
                    onChange={(e) => {
                      const newProvider = e.target.value as ApiProvider;
                      setProvider(newProvider);
                      const defaultModel = PROVIDERS.find(p => p.id === newProvider)?.models[0].id || '';
                      setModel(defaultModel);
                    }}
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
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className={cx(
                      'w-full border rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all',
                      th.input.bg, th.input.border, th.input.text, th.input.focusBorder
                    )}
                  >
                    {PROVIDERS.find(p => p.id === provider)?.models.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Fields */}
        <div className="space-y-6">
          {/* Topic */}
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
            />
          </div>

          {/* Slide Count */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className={cx('block text-sm font-medium', th.text.secondary)}>{t('slideCountLabel')}</label>
              <span className={cx(
                'text-sm font-bold text-purple-500 px-2 py-0.5 rounded',
                'bg-purple-900/30'
              )}>{slideCount}</span>
            </div>
            <input
              type="range"
              min="3"
              max="30"
              value={slideCount}
              onChange={(e) => setSlideCount(parseInt(e.target.value))}
              className={cx(
                'w-full h-2 rounded-lg appearance-none cursor-pointer accent-purple-500',
                'bg-gray-700'
              )}
            />
            <div className={cx('flex justify-between text-[10px] mt-1', th.text.muted)}>
              <span>3</span>
              <span>30</span>
            </div>
          </div>

          {/* AI Auto Analysis Button */}
          <div className={cx(
            'p-4 rounded-lg border flex items-center justify-between',
            'bg-gradient-to-r from-purple-900/30 to-blue-900/30 border-purple-500/30'
          )}>
            <div className="flex items-center gap-3">
              <div className={cx(
                'w-10 h-10 rounded-full flex items-center justify-center',
                'bg-purple-500/20'
              )}>
                <Wand2 className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <div className={cx('text-sm font-medium', th.text.primary)}>
                  {lang === 'zh' ? 'AI 智能分析' : 'AI Auto Analysis'}
                </div>
                <div className={cx('text-xs', th.text.muted)}>
                  {lang === 'zh' ? '分析内容推荐最佳受众和演示目标' : 'Analyze content to recommend audience and purpose'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={handleFeelingLucky}
              disabled={isAnalyzing || isGenerating || !content.trim()}
              className={cx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2',
                isAnalyzing || isGenerating
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:shadow-lg hover:scale-105',
                'bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-purple-500/25'
              )}
            >
              {isAnalyzing ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {lang === 'zh' ? '分析中...' : 'Analyzing...'}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  {lang === 'zh' ? '试试手气' : "I'm Feeling Lucky"}
                </>
              )}
            </button>
          </div>

          {/* Analysis Result */}
          {analysisResult && (
            <div className={cx(
              'p-3 rounded-lg border text-sm animate-in fade-in slide-in-from-top-2',
              'bg-green-900/20 border-green-500/30 text-green-200'
            )}>
              <div className="flex items-center gap-2 font-medium mb-1">
                <Sparkles className="w-4 h-4" />
                {lang === 'zh' ? 'AI 分析结果：' : 'AI Analysis Result:'}
              </div>
              <div className={cx('text-xs opacity-80', 'text-green-300')}>
                {analysisResult.reasoning}
              </div>
            </div>
          )}

          {/* TWO COLUMN LAYOUT: Audience & Purpose */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AUDIENCE SELECTION */}
            <div className={cx(
              'p-5 rounded-xl border space-y-4',
              'bg-slate-900/50 border-white/10'
            )}>
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-purple-500" />
                <h3 className={cx('text-sm font-semibold', th.text.primary)}>
                  {lang === 'zh' ? '目标受众' : 'Target Audience'}
                </h3>
              </div>

              {/* Custom Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomAudience}
                  onChange={(e) => setUseCustomAudience(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                />
                <span className={cx('text-xs', th.text.secondary)}>
                  {lang === 'zh' ? '自定义受众' : 'Custom Audience'}
                </span>
              </label>

              {useCustomAudience ? (
                <input
                  type="text"
                  value={customAudience}
                  onChange={(e) => setCustomAudience(e.target.value)}
                  className={cx(
                    'w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all',
                    th.input.bg, th.input.border, th.input.text, th.input.placeholder, th.input.focusBorder
                  )}
                  placeholder={lang === 'zh' ? '输入自定义受众...' : 'Enter custom audience...'}
                />
              ) : (
                <>
                  {/* Category Selection */}
                  <div>
                    <label className={cx('block text-xs mb-1.5', th.text.muted)}>
                      {lang === 'zh' ? '受众分类' : 'Category'}
                    </label>
                    <select
                      value={audienceCategoryId}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className={cx(
                        'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all',
                        th.input.bg, th.input.border, th.input.text, th.input.focusBorder
                      )}
                    >
                      {AUDIENCE_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label[lang]}
                        </option>
                      ))}
                    </select>
                    <p className={cx('text-[10px] mt-1', th.text.muted)}>
                      {AUDIENCE_CATEGORIES.find(c => c.id === audienceCategoryId)?.description[lang]}
                    </p>
                  </div>

                  {/* Subcategory Selection */}
                  <div>
                    <label className={cx('block text-xs mb-1.5', th.text.muted)}>
                      {lang === 'zh' ? '具体受众' : 'Specific Audience'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {AUDIENCE_CATEGORIES.find(c => c.id === audienceCategoryId)?.audiences.map((aud) => (
                        <button
                          key={aud.id}
                          type="button"
                          onClick={() => setAudienceSubcategoryId(aud.id)}
                          className={cx(
                            'px-3 py-1.5 text-xs rounded-full border transition-all',
                            audienceSubcategoryId === aud.id
                              ? 'bg-purple-500/20 border-purple-500 text-purple-400'
                              : cx('bg-white/5 border-white/10 text-gray-400', 'hover:border-purple-500/50')
                          )}
                        >
                          {aud.label[lang]}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Selected Audience Display */}
              <div className={cx(
                'p-2 rounded-lg text-xs',
                'bg-purple-500/10 text-purple-300'
              )}>
                <span className="opacity-70">{lang === 'zh' ? '当前:' : 'Current:'}</span>{' '}
                <span className="font-medium">{finalAudience}</span>
              </div>
            </div>

            {/* PURPOSE SELECTION */}
            <div className={cx(
              'p-5 rounded-xl border space-y-4',
              'bg-slate-900/50 border-white/10'
            )}>
              <div className="flex items-center gap-2 mb-4">
                <Target className="w-5 h-5 text-blue-500" />
                <h3 className={cx('text-sm font-semibold', th.text.primary)}>
                  {lang === 'zh' ? '演示目标' : 'Presentation Purpose'}
                </h3>
              </div>

              {/* Custom Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useCustomPurpose}
                  onChange={(e) => setUseCustomPurpose(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className={cx('text-xs', th.text.secondary)}>
                  {lang === 'zh' ? '自定义目标' : 'Custom Purpose'}
                </span>
              </label>

              {useCustomPurpose ? (
                <input
                  type="text"
                  value={customPurpose}
                  onChange={(e) => setCustomPurpose(e.target.value)}
                  className={cx(
                    'w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all',
                    th.input.bg, th.input.border, th.input.text, th.input.placeholder, th.input.focusBorder
                  )}
                  placeholder={lang === 'zh' ? '输入自定义目标...' : 'Enter custom purpose...'}
                />
              ) : (
                <>
                  {/* Category Selection */}
                  <div>
                    <label className={cx('block text-xs mb-1.5', th.text.muted)}>
                      {lang === 'zh' ? '目标分类' : 'Category'}
                    </label>
                    <select
                      value={purposeCategoryId}
                      onChange={(e) => handlePurposeCategoryChange(e.target.value)}
                      className={cx(
                        'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all',
                        th.input.bg, th.input.border, th.input.text, th.input.focusBorder
                      )}
                    >
                      {PURPOSE_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.label[lang]}
                        </option>
                      ))}
                    </select>
                    <p className={cx('text-[10px] mt-1', th.text.muted)}>
                      {PURPOSE_CATEGORIES.find(c => c.id === purposeCategoryId)?.description[lang]}
                    </p>
                  </div>

                  {/* Subcategory Selection */}
                  <div>
                    <label className={cx('block text-xs mb-1.5', th.text.muted)}>
                      {lang === 'zh' ? '具体目标' : 'Specific Purpose'}
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {PURPOSE_CATEGORIES.find(c => c.id === purposeCategoryId)?.purposes.map((pur) => (
                        <button
                          key={pur.id}
                          type="button"
                          onClick={() => setPurposeSubcategoryId(pur.id)}
                          className={cx(
                            'px-3 py-1.5 text-xs rounded-full border transition-all',
                            purposeSubcategoryId === pur.id
                              ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                              : cx('bg-white/5 border-white/10 text-gray-400', 'hover:border-blue-500/50')
                          )}
                        >
                          {pur.label[lang]}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Selected Purpose Display */}
              <div className={cx(
                'p-2 rounded-lg text-xs',
                'bg-blue-500/10 text-blue-300'
              )}>
                <span className="opacity-70">{lang === 'zh' ? '当前:' : 'Current:'}</span>{' '}
                <span className="font-medium">{finalPurpose}</span>
              </div>
            </div>
          </div>

          {/* STYLE CONFIGURATION (Derived from Audience + Purpose) */}
          <div className={cx(
            'p-5 rounded-xl border',
            'bg-gradient-to-r from-amber-900/20 to-orange-900/20 border-amber-500/30'
          )}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className={cx('text-sm font-semibold', th.text.primary)}>
                  {lang === 'zh' ? '风格配置' : 'Style Configuration'}
                </h3>
                <span className={cx('text-xs px-2 py-0.5 rounded-full', 'bg-amber-500/20 text-amber-400')}>
                  {lang === 'zh' ? '自动推荐' : 'Auto-recommended'}
                </span>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={useStyleOverride}
                  onChange={(e) => setUseStyleOverride(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className={cx('text-xs', th.text.secondary)}>
                  {lang === 'zh' ? '覆盖推荐' : 'Override'}
                </span>
              </label>
            </div>

            {/* Style Override Dropdown */}
            {useStyleOverride && (
              <div className="mb-4">
                <select
                  value={overrideStyleId}
                  onChange={(e) => setOverrideStyleId(e.target.value)}
                  className={cx(
                    'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all',
                    th.input.bg, th.input.border, th.input.text, th.input.focusBorder
                  )}
                >
                  <option value="">{lang === 'zh' ? '选择风格...' : 'Select style...'}</option>
                  {STYLE_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label[lang]} — {preset.description[lang]}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Style Preview Grid */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
              {/* Style Name */}
              <div className={cx(
                'p-3 rounded-lg border col-span-2',
                'bg-black/20 border-white/10'
              )}>
                <div className={cx('text-[10px] uppercase tracking-wider mb-1', th.text.muted)}>
                  {lang === 'zh' ? '推荐风格' : 'Recommended Style'}
                </div>
                <div className={cx('font-semibold text-sm', th.text.primary)}>
                  {styleRecommendation.preset?.label[lang]}
                </div>
                <div className={cx('text-[10px] mt-1 opacity-70', th.text.muted)}>
                  {styleRecommendation.reason[lang]}
                </div>
              </div>

              {/* Theme */}
              {recommendedTheme && (
                <div className={cx(
                  'p-3 rounded-lg border',
                  'bg-black/20 border-white/10'
                )}>
                  <div className={cx('text-[10px] uppercase tracking-wider mb-1.5', th.text.muted)}>
                    {lang === 'zh' ? '主题' : 'Theme'}
                  </div>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-5 h-5 rounded border border-white/20"
                      style={{ backgroundColor: recommendedTheme.colors[0] }}
                    />
                    <span className={cx('font-medium truncate', th.text.secondary)}>
                      {recommendedTheme.label}
                    </span>
                  </div>
                </div>
              )}

              {/* Typography */}
              <div className={cx(
                'p-3 rounded-lg border',
                'bg-black/20 border-white/10'
              )}>
                <div className={cx('text-[10px] uppercase tracking-wider mb-1.5', th.text.muted)}>
                  {lang === 'zh' ? '字体' : 'Typography'}
                </div>
                <div className={cx('font-medium', th.text.secondary)}>
                  {styleRecommendation.preset?.typography.titleCase === 'uppercase' ? 'UPPERCASE' : 
                   styleRecommendation.preset?.typography.titleCase === 'title' ? 'Title Case' : 'Sentence'}
                </div>
              </div>

              {/* Density */}
              <div className={cx(
                'p-3 rounded-lg border',
                'bg-black/20 border-white/10'
              )}>
                <div className={cx('text-[10px] uppercase tracking-wider mb-1.5', th.text.muted)}>
                  {lang === 'zh' ? '密度' : 'Density'}
                </div>
                <div className={cx('font-medium', th.text.secondary)}>
                  {styleRecommendation.preset?.visualDensity === 'minimal' ? (lang === 'zh' ? '简洁' : 'Minimal') :
                   styleRecommendation.preset?.visualDensity === 'dense' ? (lang === 'zh' ? '密集' : 'Dense') :
                   (lang === 'zh' ? '平衡' : 'Balanced')}
                </div>
              </div>
            </div>
          </div>

          {/* Source Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={cx('block text-sm font-medium', th.text.secondary)}>
                {t('sourceLabel')}
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStrictMode(!strictMode)}
                  className={cx(
                    'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all border',
                    strictMode
                      ? cx('bg-green-500/20 border-green-500/50 text-green-400')
                      : cx(th.text.muted, th.border.secondary, 'hover:border-white/20')
                  )}
                >
                  {strictMode ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                  {lang === 'zh' ? '严格模式' : 'Strict Mode'}
                </button>
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
            </div>
            <div className="relative">
              {showPreview ? (
                <div
                  className={cx(
                    'w-full border rounded-lg px-4 py-3 text-sm overflow-y-auto resize-y min-h-[300px] max-h-[500px]',
                    th.input.bg, th.input.border, 'text-slate-300'
                  )}
                  dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br/>') }}
                />
              ) : (
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  className={cx(
                    'w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all font-mono resize-y',
                    th.input.bg, th.input.border, 'text-slate-300', th.input.placeholder, th.input.focusBorder
                  )}
                  placeholder={t('pastePlaceholder')}
                />
              )}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isGenerating}
            className={cx(
              'flex-1 py-3 px-6 rounded-xl font-semibold text-white transition-all',
              isGenerating
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02]'
            )}
          >
            {isGenerating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {progressMessage || t('generating')}
              </span>
            ) : (
              t('generateBtn')
            )}
          </button>
          {isGenerating && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 rounded-xl border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-all"
            >
              {t('cancel')}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default InputForm;
