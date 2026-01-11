/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { EraserIcon, StarsIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';
import Spinner from './Spinner';

interface ErasePanelProps {
  onApplyEdit: (prompt: string) => void;
  onClearMask: () => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  isLoading: boolean;
  isMaskEmpty: boolean;
  cost: number;
  onEnhancePrompt: (prompt: string) => Promise<string>;
}

const ErasePanel: React.FC<ErasePanelProps> = ({
  onApplyEdit,
  onClearMask,
  brushSize,
  onBrushSizeChange,
  isLoading,
  isMaskEmpty,
  cost,
  onEnhancePrompt
}) => {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  const handleEnhanceClick = async () => {
      if (!prompt || isEnhancing || isLoading) return;

      setIsEnhancing(true);
      const enhancedPrompt = await onEnhancePrompt(prompt);
      setPrompt(enhancedPrompt);
      setIsEnhancing(false);
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
        <h3 className="text-sm font-bold text-gray-800">{t('erasePanel.title')}</h3>
        <p className="text-sm text-gray-500 -mt-3">{t('erasePanel.description')}</p>
      
      <div className="w-full flex flex-col items-center justify-center gap-4">
        <div className="w-full flex flex-col gap-2">
            <label htmlFor="brush-size" className="text-xs font-medium text-gray-600">{t('erasePanel.brushSize')}: {brushSize}</label>
            <input
                id="brush-size"
                type="range"
                min="5"
                max="100"
                value={brushSize}
                onChange={(e) => onBrushSizeChange(Number(e.target.value))}
                disabled={isLoading}
            />
        </div>
        
        <div className="relative w-full">
            <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder={t('erasePanel.placeholder')}
                className="form-input pr-10"
                disabled={isLoading || isEnhancing}
            />
            <button
              type="button"
              onClick={handleEnhanceClick}
              disabled={isLoading || isEnhancing || !prompt}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-purple-600 hover:bg-purple-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              data-tooltip={t('tooltip.enhancePrompt')}
            >
              {isEnhancing ? <Spinner className="!h-5 !w-5 !mx-0" /> : <StarsIcon className="w-5 h-5" />}
            </button>
        </div>


        <div className="w-full flex items-center gap-2">
            <button
                onClick={onClearMask}
                disabled={isLoading || isMaskEmpty}
                className="btn btn-subtle w-full"
                data-tooltip={t('tooltip.clearMask')}
            >
                {t('erasePanel.clearButton')}
            </button>
            
            <button
                onClick={() => onApplyEdit(prompt)}
                disabled={isLoading || isMaskEmpty}
                className="btn btn-primary w-full"
                data-tooltip={t('tooltip.generate')}
            >
                <EraserIcon className="w-4 h-4" />
                {t('erasePanel.eraseButton')} ({t('credits.costLabel', { cost: String(cost) })})
            </button>
        </div>
      </div>
    </div>
  );
};

export default ErasePanel;