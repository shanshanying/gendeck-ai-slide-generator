
import React, { useState, ChangeEvent, useEffect, useMemo, useCallback } from 'react';
import { FileText, Upload, Sparkles, Settings, Users, Key, Target, XCircle, AlertTriangle, Eye, Edit3, FileUp, Wand2, CheckSquare, Square } from 'lucide-react';
import { parseExportedHtml, ImportResult } from '../services/importService';
import { analyzeContent, ContentAnalysis } from '../services/geminiService';
import { PresentationConfig, ApiSettings, ApiProvider } from '../types';
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

const InputForm: React.FC<InputFormProps> = ({ onGenerate, onCancel, isGenerating, t, theme, onImportHtml }) => {
  // Load initial state from localStorage or defaults
  const [topic, setTopic] = useState(() => loadStr('gendeck_topic', ""));
  const [slideCount, setSlideCount] = useState(() => loadNum('gendeck_count', 8));
  const [content, setContent] = useState(() => loadStr('gendeck_content', SAMPLE_CONTENT));
  const [showSettings, setShowSettings] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [strictMode, setStrictMode] = useState(() => loadJson('gendeck_strict_mode', false));
  const [inputMode, setInputMode] = useState<'quick' | 'advanced'>(() =>
    loadStr('gendeck_input_mode', 'quick') === 'advanced' ? 'advanced' : 'quick'
  );
  const [showAdvancedModelOptions, setShowAdvancedModelOptions] = useState(false);

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
  const quickAudience = 'General business team and stakeholders';
  const quickPurpose = 'Clearly communicate and drive decisions';
  
  // Final audience string (custom or from selection)
  const finalAudience = useMemo(() => {
    if (useCustomAudience && customAudience.trim()) {
      return customAudience.trim();
    }
    const category = AUDIENCE_CATEGORIES.find(c => c.id === audienceCategoryId);
    const sub = category?.audiences.find(a => a.id === audienceSubcategoryId);
    return sub?.label || category?.label || '';
  }, [useCustomAudience, customAudience, audienceCategoryId, audienceSubcategoryId]);

  // Final purpose string (custom or from selection)
  const finalPurpose = useMemo(() => {
    if (useCustomPurpose && customPurpose.trim()) {
      return customPurpose.trim();
    }
    const category = PURPOSE_CATEGORIES.find(c => c.id === purposeCategoryId);
    const sub = category?.purposes.find(p => p.id === purposeSubcategoryId);
    return sub?.label || category?.label || '';
  }, [useCustomPurpose, customPurpose, purposeCategoryId, purposeSubcategoryId]);

  // Computed style recommendation based on audience + purpose
  const styleRecommendation = useMemo(() => {
    if (useStyleOverride && overrideStyleId) {
      const preset = getStylePreset(overrideStyleId);
      return {
        presetId: overrideStyleId,
        preset,
        reason: 'User selected style'
      };
    }
    const rec = resolveStyleRecommendation(audienceCategoryId, purposeCategoryId);
    const preset = getStylePreset(rec.presetId);
    return { ...rec, preset };
  }, [audienceCategoryId, purposeCategoryId, useStyleOverride, overrideStyleId]);

  const effectiveAudience = inputMode === 'quick' ? quickAudience : finalAudience;
  const effectivePurpose = inputMode === 'quick' ? quickPurpose : finalPurpose;

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
  const [customModelId, setCustomModelId] = useState(() => loadStr('gendeck_custom_model_id', ''));
  const [baseUrls, setBaseUrls] = useState<Partial<Record<ApiProvider, string>>>(() =>
    loadJson('gendeck_base_urls', {})
  );
  const selectedProvider = useMemo(() => PROVIDERS.find(p => p.id === provider), [provider]);
  const resolvedModelId = provider === 'custom' ? customModelId.trim() : model;
  const resolvedBaseUrl = useMemo(() => {
    const override = (baseUrls[provider] || '').trim();
    if (override) return override;
    return (selectedProvider?.defaultBaseUrl || '').trim();
  }, [baseUrls, provider, selectedProvider]);
  const requiresApiKey = provider !== 'custom';

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
    
    // Step 1/3: Outline Generation
    setProgressMessage(`Step 1/3: ${t('analyzingContent')}`);
    
    const timeout1 = setTimeout(() => {
      setProgressMessage(`Step 1/3: ${t('generatingOutline')}`);
    }, 2000);
    
    const timeout2 = setTimeout(() => {
      setProgressMessage(`Step 1/3: ${t('generating')}`);
    }, 4000);
    
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
    };
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
  useEffect(() => localStorage.setItem('gendeck_custom_model_id', customModelId), [customModelId]);
  useEffect(() => localStorage.setItem('gendeck_base_urls', JSON.stringify(baseUrls)), [baseUrls]);

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
  useEffect(() => localStorage.setItem('gendeck_input_mode', inputMode), [inputMode]);

  // ========== HTML IMPORT ==========
  const handleHtmlImport = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImportHtml) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const htmlContent = event.target?.result as string;
        const result = parseExportedHtml(htmlContent);
        onImportHtml(result);
      } catch (error) {
        alert('Import failed: Could not parse HTML file');
      }
    };
    reader.readAsText(file);
  };

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
      setErrorMsg('Please enter content to analyze');
      return;
    }

    if (requiresApiKey && (!apiKeys[provider] || apiKeys[provider]!.trim() === '')) {
      setShowSettings(true);
      setErrorMsg(`Missing API Key for: ${PROVIDERS.find(p => p.id === provider)?.name || provider}. Please enter it in Model Settings.`);
      return;
    }
    if (!resolvedModelId) {
      setShowSettings(true);
      setErrorMsg('Please set a model ID.');
      return;
    }
    if (provider !== 'google' && !resolvedBaseUrl) {
      setShowSettings(true);
      setShowAdvancedModelOptions(true);
      setErrorMsg('Please set a Base URL.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    setAnalysisResult(null);

    try {
      const apiSettings: ApiSettings = {
        apiKeys: apiKeys,
        model: {
          provider: provider,
          modelId: resolvedModelId,
          baseUrl: provider === 'google' ? undefined : resolvedBaseUrl
        }
      };

      const result = await analyzeContent(content, apiSettings);
      const { audience: suggestedAudience, purpose: suggestedPurpose, reasoning } = result.data;
      
      // Find best matching audience category and subcategory
      let matchedAudienceCat: string | null = null;
      let matchedAudienceSub: string | null = null;
      let matchedPurposeCat: string | null = null;
      let matchedPurposeSub: string | null = null;

      // Match audience
      const audLower = suggestedAudience.toLowerCase();
      for (const cat of AUDIENCE_CATEGORIES) {
        for (const aud of cat.audiences) {
          if (audLower.includes(aud.label.toLowerCase()) ||
              aud.label.toLowerCase().includes(audLower)) {
            matchedAudienceCat = cat.id;
            matchedAudienceSub = aud.id;
            break;
          }
        }
        if (matchedAudienceCat) break;
      }

      // Match purpose
      const purLower = suggestedPurpose.toLowerCase();
      for (const cat of PURPOSE_CATEGORIES) {
        for (const pur of cat.purposes) {
          if (purLower.includes(pur.label.toLowerCase()) ||
              pur.label.toLowerCase().includes(purLower)) {
            matchedPurposeCat = cat.id;
            matchedPurposeSub = pur.id;
            break;
          }
        }
        if (matchedPurposeCat) break;
      }

      // Update state
      if (matchedAudienceCat && matchedAudienceSub) {
        setAudienceCategoryId(matchedAudienceCat);
        setAudienceSubcategoryId(matchedAudienceSub);
        setUseCustomAudience(false);
      } else {
        setUseCustomAudience(true);
        setCustomAudience(suggestedAudience);
      }
      if (matchedPurposeCat && matchedPurposeSub) {
        setPurposeCategoryId(matchedPurposeCat);
        setPurposeSubcategoryId(matchedPurposeSub);
        setUseCustomPurpose(false);
      } else {
        setUseCustomPurpose(true);
        setCustomPurpose(suggestedPurpose);
      }
      
      setAnalysisResult({
        suggestedAudienceCat: matchedAudienceCat || undefined,
        suggestedAudienceSub: matchedAudienceSub || undefined,
        suggestedPurposeCat: matchedPurposeCat || undefined,
        suggestedPurposeSub: matchedPurposeSub || undefined,
        reasoning
      });
      
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        setErrorMsg(error?.message || ('Analysis failed, please try again'));
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  // ========== SUBMIT HANDLER ==========
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (requiresApiKey && (!apiKeys[provider] || apiKeys[provider]!.trim() === '')) {
      setShowSettings(true);
      setErrorMsg(`Missing API Key for: ${PROVIDERS.find(p => p.id === provider)?.name || provider}. Please enter it in Model Settings.`);
      return;
    }
    if (!resolvedModelId) {
      setShowSettings(true);
      setErrorMsg('Please set a model ID.');
      return;
    }
    if (provider !== 'google' && !resolvedBaseUrl) {
      setShowSettings(true);
      setShowAdvancedModelOptions(true);
      setErrorMsg('Please set a Base URL.');
      return;
    }

    if (inputMode === 'advanced' && !finalAudience.trim()) {
      setErrorMsg('Please select or enter target audience');
      return;
    }

    if (inputMode === 'advanced' && !finalPurpose.trim()) {
      setErrorMsg('Please select or enter presentation purpose');
      return;
    }

    const apiSettings: ApiSettings = {
      apiKeys: apiKeys,
      model: {
        provider: provider,
        modelId: resolvedModelId,
        baseUrl: provider === 'google' ? undefined : resolvedBaseUrl
      }
    };

    onGenerate({ 
      topic: topic || ('Untitled Presentation'), 
      audience: effectiveAudience,
      purpose: effectivePurpose,
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
        <div className="flex items-center gap-2">
          <div className={cx('flex items-center rounded-lg border p-0.5', th.input.bg, th.border.secondary)}>
            <button
              type="button"
              onClick={() => setInputMode('quick')}
              className={cx(
                'px-2.5 py-1 text-xs rounded-md font-medium transition-all',
                inputMode === 'quick' ? cx(th.bg.tertiary, th.text.primary, 'shadow-sm') : cx(th.text.muted, 'hover:text-current')
              )}
            >
              {'Quick'}
            </button>
            <button
              type="button"
              onClick={() => setInputMode('advanced')}
              className={cx(
                'px-2.5 py-1 text-xs rounded-md font-medium transition-all',
                inputMode === 'advanced' ? cx(th.bg.tertiary, th.text.primary, 'shadow-sm') : cx(th.text.muted, 'hover:text-current')
              )}
            >
              {'Advanced'}
            </button>
          </div>
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

            <div className={cx('p-4 rounded-lg border space-y-4', 'bg-slate-900/50 border-white/5')}>
              <label className="block text-xs font-bold text-purple-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> {t('aiModel')}
              </label>

              <div>
                <label className={cx('block text-xs mb-1.5', th.text.tertiary)}>{t('provider')}</label>
                <select
                  value={provider}
                  onChange={(e) => {
                    const newProvider = e.target.value as ApiProvider;
                    setProvider(newProvider);
                    if (newProvider !== 'custom') {
                      const defaultModel = PROVIDERS.find(p => p.id === newProvider)?.models[0].id || '';
                      setModel(defaultModel);
                    }
                  }}
                  className={cx(
                    'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all',
                    th.input.bg, th.input.border, th.input.text, th.input.focusBorder
                  )}
                >
                  {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              <div>
                <label className={cx('block text-xs mb-1.5', th.text.tertiary)}>{t('model')}</label>
                {provider === 'custom' ? (
                  <input
                    type="text"
                    value={customModelId}
                    onChange={(e) => setCustomModelId(e.target.value)}
                    placeholder={'e.g. qwen2.5:14b or gpt-4o-mini'}
                    className={cx(
                      'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all',
                      th.input.bg, th.input.border, th.input.text, th.input.focusBorder
                    )}
                  />
                ) : (
                  <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className={cx(
                      'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all',
                      th.input.bg, th.input.border, th.input.text, th.input.focusBorder
                    )}
                  >
                    {selectedProvider?.models.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className={cx(
                  'block text-xs mb-1.5',
                  requiresApiKey && !apiKeys[provider] ? 'text-orange-400 font-semibold' : th.text.tertiary
                )}>
                  <Key className="w-3 h-3 inline mr-1" />
                  {selectedProvider?.name} API Key {requiresApiKey && !apiKeys[provider] ? '*' : ''}
                </label>
                <input
                  type="password"
                  value={apiKeys[provider] || ''}
                  onChange={(e) => setApiKeys(prev => ({ ...prev, [provider]: e.target.value }))}
                  placeholder={selectedProvider?.placeholderKey || 'Enter API Key'}
                  className={cx(
                    'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all',
                    th.input.bg, th.input.border, th.input.text, th.input.focusBorder
                  )}
                />
                {requiresApiKey && !apiKeys[provider] && (
                  <p className="text-[11px] mt-1 text-orange-300">
                    {'API key is required for the selected provider.'}
                  </p>
                )}
              </div>

              <div className={cx('pt-2 border-t space-y-3', th.border.divider)}>
                <button
                  type="button"
                  onClick={() => setShowAdvancedModelOptions(v => !v)}
                  className={cx('text-xs underline decoration-dotted underline-offset-2', th.text.muted)}
                >
                  {showAdvancedModelOptions
                    ? ('Hide advanced options')
                    : ('Advanced options')}
                </button>

                {showAdvancedModelOptions && (
                  <div>
                    <label className={cx('block text-xs mb-1.5', th.text.tertiary)}>
                      Base URL {provider === 'google' ? `(${'Not required for Google'})` : ''}
                    </label>
                    <input
                      type="text"
                      value={baseUrls[provider] ?? selectedProvider?.defaultBaseUrl ?? ''}
                      onChange={(e) => setBaseUrls(prev => ({ ...prev, [provider]: e.target.value }))}
                      placeholder={selectedProvider?.defaultBaseUrl || ('Enter API Base URL')}
                      disabled={provider === 'google'}
                      className={cx(
                        'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all',
                        provider === 'google' ? 'opacity-60 cursor-not-allowed' : '',
                        th.input.bg, th.input.border, th.input.text, th.input.focusBorder
                      )}
                    />
                    {provider !== 'google' && (
                      <p className={cx('text-[11px] mt-1', th.text.muted)}>
                        {`Effective value: ${resolvedBaseUrl || 'Not set'}`}
                      </p>
                    )}
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {inputMode === 'quick' && (
          <div className={cx('p-3 rounded-lg border text-sm', 'bg-blue-500/10 border-blue-500/20 text-blue-200')}>
            {'Quick mode flow: 1) Generate outline, 2) Review outline/layout, 3) Render and download HTML deck.'}
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

          {inputMode === 'advanced' && (
            <>
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
                      {'AI Auto Analysis'}
                    </div>
                    <div className={cx('text-xs', th.text.muted)}>
                      {'Analyze content to recommend audience and purpose'}
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
                      {'Analyzing...'}
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      {"I'm Feeling Lucky"}
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
                    {'AI Analysis Result:'}
                  </div>
                  <div className={cx('text-xs opacity-80', 'text-green-300')}>
                    {analysisResult.reasoning}
                  </div>
                </div>
              )}
            </>
          )}

          {inputMode === 'advanced' && (
          <>
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
                  {'Target Audience'}
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
                  {'Custom Audience'}
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
                  placeholder={'Enter custom audience...'}
                />
              ) : (
                <>
                  {/* Category Selection */}
                  <div>
                    <label className={cx('block text-xs mb-1.5', th.text.muted)}>
                      {'Category'}
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
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <p className={cx('text-[10px] mt-1', th.text.muted)}>
                      {AUDIENCE_CATEGORIES.find(c => c.id === audienceCategoryId)?.description}
                    </p>
                  </div>

                  {/* Subcategory Selection */}
                  <div>
                    <label className={cx('block text-xs mb-1.5', th.text.muted)}>
                      {'Specific Audience'}
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
                          {aud.label}
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
                <span className="opacity-70">{'Current:'}</span>{' '}
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
                  {'Presentation Purpose'}
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
                  {'Custom Purpose'}
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
                  placeholder={'Enter custom purpose...'}
                />
              ) : (
                <>
                  {/* Category Selection */}
                  <div>
                    <label className={cx('block text-xs mb-1.5', th.text.muted)}>
                      {'Category'}
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
                          {cat.label}
                        </option>
                      ))}
                    </select>
                    <p className={cx('text-[10px] mt-1', th.text.muted)}>
                      {PURPOSE_CATEGORIES.find(c => c.id === purposeCategoryId)?.description}
                    </p>
                  </div>

                  {/* Subcategory Selection */}
                  <div>
                    <label className={cx('block text-xs mb-1.5', th.text.muted)}>
                      {'Specific Purpose'}
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
                          {pur.label}
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
                <span className="opacity-70">{'Current:'}</span>{' '}
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
                  {'Style Configuration'}
                </h3>
                <span className={cx('text-xs px-2 py-0.5 rounded-full', 'bg-amber-500/20 text-amber-400')}>
                  {'Auto-recommended'}
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
                  {'Override'}
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
                  <option value="">{'Select style...'}</option>
                  {STYLE_PRESETS.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.label} — {preset.description}
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
                  {'Recommended Style'}
                </div>
                <div className={cx('font-semibold text-sm', th.text.primary)}>
                  {styleRecommendation.preset?.label}
                </div>
                <div className={cx('text-[10px] mt-1 opacity-70', th.text.muted)}>
                  {styleRecommendation.reason}
                </div>
              </div>

              {/* Theme */}
              {recommendedTheme && (
                <div className={cx(
                  'p-3 rounded-lg border',
                  'bg-black/20 border-white/10'
                )}>
                  <div className={cx('text-[10px] uppercase tracking-wider mb-1.5', th.text.muted)}>
                    {'Theme'}
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
                  {'Typography'}
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
                  {'Density'}
                </div>
                <div className={cx('font-medium', th.text.secondary)}>
                  {styleRecommendation.preset?.visualDensity === 'minimal' ? ('Minimal') :
                   styleRecommendation.preset?.visualDensity === 'dense' ? ('Dense') :
                   ('Balanced')}
                </div>
              </div>
            </div>
          </div>
          </>
          )}

          {/* Source Content */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className={cx('block text-sm font-medium', th.text.secondary)}>
                {t('sourceLabel')}
              </label>
              <div className="flex items-center gap-2">
                {/* Import HTML Button */}
                {onImportHtml && (
                  <label className={cx(
                    'cursor-pointer text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all border',
                    'bg-purple-900/50 hover:bg-purple-800/50 text-purple-200 border-purple-500/30 hover:border-purple-500/50'
                  )} title={'Import previously generated HTML deck'}>
                    <FileUp className="w-3 h-3" />
                    {'Import HTML'}
                    <input type="file" accept=".html,.htm" onChange={handleHtmlImport} className="hidden" />
                  </label>
                )}
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
                  {'Strict Mode'}
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
                    'w-full border rounded-lg px-4 py-3 text-sm overflow-y-auto resize-y min-h-[300px] max-h-[500px] prose prose-invert prose-sm max-w-none',
                    th.input.bg, th.input.border
                  )}
                  dangerouslySetInnerHTML={{ 
                    __html: content
                      // Headers
                      .replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-slate-200 mt-4 mb-2">$1</h3>')
                      .replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-slate-200 mt-5 mb-3">$1</h2>')
                      .replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-slate-100 mt-6 mb-4">$1</h1>')
                      // Bold and Italic
                      .replace(/\*\*\*(.*?)\*\*\*/g, '<strong><em>$1</em></strong>')
                      .replace(/\*\*(.*?)\*\*/g, '<strong class="text-slate-200">$1</strong>')
                      .replace(/\*(.*?)\*/g, '<em>$1</em>')
                      .replace(/__(.*?)__/g, '<strong class="text-slate-200">$1</strong>')
                      .replace(/_(.*?)_/g, '<em>$1</em>')
                      // Code
                      .replace(/`([^`]+)`/g, '<code class="bg-slate-800 px-1.5 py-0.5 rounded text-purple-300 text-xs">$1</code>')
                      // Lists
                      .replace(/^\s*[-*+]\s+(.*$)/gim, '<li class="ml-4 text-slate-300">$1</li>')
                      .replace(/^\s*\d+\.\s+(.*$)/gim, '<li class="ml-4 text-slate-300 list-decimal">$1</li>')
                      // Blockquotes
                      .replace(/^>\s*(.*$)/gim, '<blockquote class="border-l-4 border-purple-500 pl-4 py-1 my-2 text-slate-400 italic">$1</blockquote>')
                      // Links
                      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-400 hover:underline" target="_blank">$1</a>')
                      // Line breaks and paragraphs
                      .replace(/\n\n/g, '</p><p class="mb-3 text-slate-300">')
                      .replace(/\n/g, '<br/>')
                      // Wrap in paragraph if not already wrapped
                      .replace(/^(.+)$/gim, '<p class="mb-3 text-slate-300">$1</p>')
                      // Clean up empty paragraphs
                      .replace(/<p class="mb-3 text-slate-300"><\/p>/g, '')
                      // Fix nested paragraphs in lists
                      .replace(/<li class="ml-4 text-slate-300"><p class="mb-3 text-slate-300">(.*?)<\/p><\/li>/g, '<li class="ml-4 text-slate-300">$1</li>')
                  }}
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
