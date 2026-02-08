
import React, { useState } from 'react';
import { X, AlertTriangle, Sparkles } from 'lucide-react';
import { PROVIDERS } from '../constants';
import { ApiProvider } from '../types';
import { getThemeClasses, cx, type Theme } from '../styles/theme';

interface ProviderSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (provider: ApiProvider, modelId: string) => void;
  lang: 'en' | 'zh';
  theme: Theme;
}

const ProviderSelector: React.FC<ProviderSelectorProps> = ({
  isOpen,
  onClose,
  onSelect,
  lang,
  theme,
}) => {
  const [selectedProvider, setSelectedProvider] = useState<ApiProvider>('google');
  const [selectedModel, setSelectedModel] = useState('');

  const th = getThemeClasses(theme);
  
  // Get default model when provider changes
  React.useEffect(() => {
    const provider = PROVIDERS.find(p => p.id === selectedProvider);
    if (provider && provider.models.length > 0) {
      setSelectedModel(provider.models[0].id);
    }
  }, [selectedProvider]);

  const handleConfirm = () => {
    if (selectedProvider && selectedModel) {
      onSelect(selectedProvider, selectedModel);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={cx('absolute inset-0 backdrop-blur-sm', 'bg-slate-950/80')}
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className={cx(
        'relative w-full max-w-md rounded-2xl shadow-2xl border',
        'bg-slate-900 border-white/10'
      )}>
        {/* Header */}
        <div className={cx('flex items-center gap-3 p-5 border-b', 'border-white/5')}>
          <div className={cx('w-10 h-10 rounded-xl flex items-center justify-center', 'bg-amber-500/10')}>
            <AlertTriangle className={cx('w-5 h-5', 'text-amber-400')} />
          </div>
          <div>
            <h3 className={cx('text-lg font-semibold', th.text.primary)}>
              {lang === 'zh' ? '选择AI模型' : 'Select AI Model'}
            </h3>
            <p className={cx('text-xs', th.text.muted)}>
              {lang === 'zh' 
                ? '此演示文稿未保存模型信息，请选择用于重新生成的模型' 
                : 'No model info saved with this deck. Select a model for regeneration.'}
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Provider Selection */}
          <div>
            <label className={cx('block text-sm font-medium mb-2', th.text.secondary)}>
              {lang === 'zh' ? 'AI提供商' : 'AI Provider'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PROVIDERS.map(provider => (
                <button
                  key={provider.id}
                  onClick={() => setSelectedProvider(provider.id as ApiProvider)}
                  className={cx(
                    'px-3 py-2 rounded-lg text-xs font-medium border transition-all text-left',
                    selectedProvider === provider.id
                      ? ('bg-purple-500/20 border-purple-500/50 text-purple-200')
                      : ('bg-slate-800 border-white/10 text-slate-300 hover:border-white/20')
                  )}
                >
                  {provider.name}
                </button>
              ))}
            </div>
          </div>

          {/* Model Selection */}
          <div>
            <label className={cx('block text-sm font-medium mb-2', th.text.secondary)}>
              {lang === 'zh' ? '模型' : 'Model'}
            </label>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className={cx(
                'w-full px-3 py-2 rounded-lg border text-sm',
                th.input.bg, th.input.border, th.input.text, th.input.focusBorder
              )}
            >
              {PROVIDERS.find(p => p.id === selectedProvider)?.models.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className={cx('flex items-center justify-end gap-3 p-5 border-t', 'border-white/5')}>
          <button
            onClick={onClose}
            className={cx('px-4 py-2 text-sm font-medium rounded-lg transition-all border', th.button.primary)}
          >
            {lang === 'zh' ? '取消' : 'Cancel'}
          </button>
          <button
            onClick={handleConfirm}
            className={cx(
              'px-4 py-2 text-sm font-medium rounded-lg transition-all',
              'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500',
              'text-white shadow-lg shadow-purple-500/25'
            )}
          >
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              {lang === 'zh' ? '继续' : 'Continue'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderSelector;
