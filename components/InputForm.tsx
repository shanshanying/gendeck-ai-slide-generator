
import React, { useState, ChangeEvent, useEffect } from 'react';
import { FileText, Upload, Sparkles, Settings, Users, Layers, Image as ImageIcon, Key, Target } from 'lucide-react';
import { PresentationConfig, ApiSettings, ApiProvider } from '../types';
import { PROVIDERS, AUDIENCE_PRESETS, PRESENTATION_PURPOSES, SAMPLE_CONTENT } from '../constants';

interface InputFormProps {
  onGenerate: (config: PresentationConfig) => void;
  isGenerating: boolean;
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

const InputForm: React.FC<InputFormProps> = ({ onGenerate, isGenerating }) => {
  // Load initial state from localStorage or defaults
  const [topic, setTopic] = useState(() => loadStr('gendeck_topic', "Gemini 1.5 Pro Overview"));
  const [audience, setAudience] = useState(() => loadStr('gendeck_audience', AUDIENCE_PRESETS[0]));
  const [purpose, setPurpose] = useState(() => loadStr('gendeck_purpose', PRESENTATION_PURPOSES[0]));
  const [slideCount, setSlideCount] = useState(() => loadNum('gendeck_count', 8));
  const [content, setContent] = useState(() => loadStr('gendeck_content', SAMPLE_CONTENT));
  const [showSettings, setShowSettings] = useState(false);

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


  // Helper to handle key changes
  const handleKeyChange = (provider: ApiProvider, value: string) => {
    setApiKeys(prev => ({ ...prev, [provider]: value }));
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
    <div className="max-w-5xl mx-auto p-6 bg-gray-800 rounded-xl shadow-2xl border border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-400" />
          Create New Deck
        </h2>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className={`transition-colors flex items-center gap-2 px-3 py-1.5 rounded-lg border ${showSettings ? 'bg-purple-900/50 border-purple-500 text-white' : 'border-gray-700 text-gray-400 hover:text-white hover:bg-gray-700'}`}
          title="Configure AI Model"
        >
          <Settings className="w-4 h-4" />
          <span className="text-xs font-medium">Model Settings</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Advanced Model Configuration Panel */}
        {showSettings && (
          <div className="p-5 bg-gray-900/80 rounded-lg border border-purple-500/30 mb-6 animate-in fade-in slide-in-from-top-2 space-y-6">
            
            {/* 1. API Keys Section */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                 <Key className="w-3 h-3" /> API Credentials
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {PROVIDERS.filter(p => p.id !== 'google' && p.id !== 'custom').map(p => (
                  <div key={p.id}>
                    <label className="block text-xs text-gray-500 mb-1">{p.name} API Key</label>
                    <input 
                      type="password"
                      value={apiKeys[p.id] || ''}
                      onChange={(e) => handleKeyChange(p.id, e.target.value)}
                      placeholder={p.placeholderKey}
                      className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-white text-xs focus:border-purple-500 outline-none"
                    />
                  </div>
                ))}
                <div>
                   <label className="block text-xs text-gray-500 mb-1">Google Gemini API Key</label>
                   <div className="w-full bg-gray-800/50 border border-gray-700 rounded px-3 py-1.5 text-gray-500 text-xs italic">
                     Managed via system environment
                   </div>
                </div>
              </div>
            </div>

            <div className="h-px bg-gray-800 w-full" />

            {/* 2. Model Selection Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Outline Config */}
              <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                 <label className="block text-xs font-bold text-blue-400 mb-2 flex items-center gap-1">
                    <Layers className="w-3 h-3" /> Step 1: Outline Generation
                 </label>
                 <div className="space-y-3">
                   <div>
                     <label className="block text-[10px] text-gray-500 mb-1">Provider</label>
                     <select 
                        value={outlineProvider}
                        onChange={(e) => handleProviderChange('outline', e.target.value as ApiProvider)}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                     >
                       {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="block text-[10px] text-gray-500 mb-1">Model</label>
                     <select 
                        value={outlineModel}
                        onChange={(e) => setOutlineModel(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                     >
                       {PROVIDERS.find(p => p.id === outlineProvider)?.models.map(m => (
                         <option key={m.id} value={m.id}>{m.name}</option>
                       ))}
                       {outlineProvider === 'custom' && <option value="custom">Custom Model</option>}
                     </select>
                   </div>
                 </div>
              </div>

              {/* Slide Config */}
              <div className="bg-gray-800/50 p-3 rounded border border-gray-700">
                 <label className="block text-xs font-bold text-green-400 mb-2 flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" /> Step 2: Slide Code Generation
                 </label>
                 <div className="space-y-3">
                   <div>
                     <label className="block text-[10px] text-gray-500 mb-1">Provider</label>
                     <select 
                        value={slideProvider}
                        onChange={(e) => handleProviderChange('slides', e.target.value as ApiProvider)}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                     >
                       {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                     </select>
                   </div>
                   <div>
                     <label className="block text-[10px] text-gray-500 mb-1">Model</label>
                     <select 
                        value={slideModel}
                        onChange={(e) => setSlideModel(e.target.value)}
                        className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs text-white"
                     >
                       {PROVIDERS.find(p => p.id === slideProvider)?.models.map(m => (
                         <option key={m.id} value={m.id}>{m.name}</option>
                       ))}
                        {slideProvider === 'custom' && <option value="custom">Custom Model</option>}
                     </select>
                   </div>
                 </div>
              </div>
            </div>

          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Context */}
          <div className="space-y-6">
            
            {/* Topic */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Topic / Title</label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-gray-900 border border-gray-600 rounded-md px-4 py-2 text-white focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                placeholder="e.g. Q3 Business Review"
                required
              />
            </div>

            {/* Slide Count */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-sm font-medium text-gray-300">Number of Slides</label>
                <span className="text-sm font-bold text-purple-400">{slideCount}</span>
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

            {/* Audience Selection */}
            <div>
               <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                 <Users className="w-4 h-4 text-purple-400"/> Target Audience
               </label>
               <div className="flex flex-wrap gap-2 mb-2">
                 {AUDIENCE_PRESETS.map((aud) => (
                   <button
                    key={aud}
                    type="button"
                    onClick={() => setAudience(aud)}
                    className={`px-3 py-1 text-xs rounded-full border transition-all ${
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
                  placeholder="Or type custom audience..."
                />
            </div>

            {/* Purpose Selection */}
            <div>
               <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                 <Target className="w-4 h-4 text-blue-400"/> Presentation Goal
               </label>
               <div className="grid grid-cols-2 gap-2">
                 {PRESENTATION_PURPOSES.map((p) => (
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

          </div>

          {/* Right Column: Content */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Source Document
                <span className="text-xs text-gray-500 ml-2">(Paste text or upload .txt/.md)</span>
              </label>
              <div className="relative h-full">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={16}
                  className="w-full h-full min-h-[300px] bg-gray-900 border border-gray-600 rounded-md px-4 py-2 text-sm text-gray-300 focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all font-mono"
                  placeholder="Paste your document content here..."
                />
                <div className="absolute bottom-3 right-3">
                  <label className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1 rounded-md flex items-center gap-1 transition-colors border border-gray-500">
                    <Upload className="w-3 h-3" />
                    Upload File
                    <input type="file" accept=".txt,.md,.json" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isGenerating || !content.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 px-6 rounded-lg shadow-lg flex items-center justify-center gap-3 transform transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        >
          {isGenerating ? (
            <>
              <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Thinking...
            </>
          ) : (
            <>
              <FileText className="w-6 h-6" />
              Generate Outline
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default InputForm;
