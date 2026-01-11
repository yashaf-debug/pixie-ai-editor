/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { StarsIcon, TrashIcon, MagicWandIcon } from './icons';
import Spinner from './Spinner';

interface MagicWandPanelProps {
  onApplyErase: (prompt: string) => void;
  onClearMask: () => void;
  isMaskEmpty: boolean;
  isLoading: boolean;
  cost: number;
  onEnhancePrompt: (prompt: string) => Promise<string>;
}

const MagicWandPanel: React.FC<MagicWandPanelProps> = ({
  onApplyErase,
  onClearMask,
  isMaskEmpty,
  isLoading,
  cost,
  onEnhancePrompt
}) => {
  const { t } = useLanguage();
  const [replacePrompt, setReplacePrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleEnhanceClick = async () => {
    if (!replacePrompt || isEnhancing || isLoading) return;
    setIsEnhancing(true);
    const enhancedPrompt = await onEnhancePrompt(replacePrompt);
    setReplacePrompt(enhancedPrompt);
    setIsEnhancing(false);
  };

  if (isMaskEmpty) {
    return (
      <div className="w-full flex flex-col items-center text-center gap-4 animate-fade-in p-4 bg-gray-50 rounded-lg">
        <MagicWandIcon className="w-10 h-10 text-indigo-500" />
        <div>
          <h3 className="text-sm font-bold text-gray-800">{t('magicWandPanel.title')}</h3>
          <p className="text-sm text-gray-500 mt-1">{t('magicWandPanel.instruction')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <h3 className="text-sm font-bold text-gray-800">{t('magicWandPanel.selectedTitle')}</h3>
      <p className="text-sm text-gray-500 -mt-3">{t('magicWandPanel.selectedInstruction')}</p>
      
      <button
        onClick={() => onApplyErase('remove the selected object completely and fill the space realistically')}
        disabled={isLoading}
        className="btn btn-secondary w-full"
      >
        <TrashIcon className="w-4 h-4" />
        {t('magicWandPanel.removeButton')} ({t('credits.costLabel', { cost: String(cost) })})
      </button>

      <div className="w-full flex flex-col gap-2">
        <div className="relative w-full">
            <input
                type="text"
                value={replacePrompt}
                onChange={(e) => setReplacePrompt(e.target.value)}
                placeholder={t('magicWandPanel.replacePlaceholder')}
                className="form-input pr-10"
                disabled={isLoading || isEnhancing}
            />
            <button
              type="button"
              onClick={handleEnhanceClick}
              disabled={isLoading || isEnhancing || !replacePrompt}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-purple-600 hover:bg-purple-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent"
              data-tooltip={t('tooltip.enhancePrompt')}
            >
              {isEnhancing ? <Spinner className="!h-5 !w-5 !mx-0" /> : <StarsIcon className="w-5 h-5" />}
            </button>
        </div>
        <button
          onClick={() => onApplyErase(replacePrompt)}
          disabled={isLoading || !replacePrompt.trim()}
          className="btn btn-primary w-full"
        >
          {t('magicWandPanel.replaceButton')} ({t('credits.costLabel', { cost: String(cost) })})
        </button>
      </div>
      
      <div className="w-full h-px bg-gray-200 my-1"></div>

      <button
        onClick={onClearMask}
        disabled={isLoading}
        className="btn btn-subtle w-full"
      >
        {t('magicWandPanel.clearButton')}
      </button>
    </div>
  );
};

export default MagicWandPanel;