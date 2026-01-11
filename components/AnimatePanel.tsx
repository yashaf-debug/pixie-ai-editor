/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { PlayIcon, StarsIcon } from './icons';
import Spinner from './Spinner';

interface AnimatePanelProps {
  onAnimate: (prompt: string) => void;
  isLoading: boolean;
  onEnhancePrompt: (prompt: string) => Promise<string>;
}

const AnimatePanel: React.FC<AnimatePanelProps> = ({ onAnimate, isLoading, onEnhancePrompt }) => {
  const { t } = useLanguage();
  const [prompt, setPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);

  const handleGenerate = () => {
    if (prompt.trim()) {
      onAnimate(prompt);
    }
  };
  
  const handleEnhanceClick = async () => {
      if (!prompt || isEnhancing || isLoading) return;

      setIsEnhancing(true);
      const enhancedPrompt = await onEnhancePrompt(prompt);
      setPrompt(enhancedPrompt);
      setIsEnhancing(false);
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <h3 className="text-sm font-bold text-gray-800">{t('animatePanel.title')}</h3>
      <p className="text-sm text-gray-500 -mt-3">{t('animatePanel.description')}</p>
      
      <div className="relative w-full">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t('animatePanel.promptPlaceholder')}
          className="form-textarea pr-10"
          rows={4}
          disabled={isLoading || isEnhancing}
        />
        <button
          type="button"
          onClick={handleEnhanceClick}
          disabled={isLoading || isEnhancing || !prompt}
          className="absolute top-2 right-2 p-1 rounded-full text-purple-600 hover:bg-purple-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          data-tooltip={t('tooltip.enhancePrompt')}
        >
          {isEnhancing ? <Spinner className="!h-5 !w-5 !mx-0" /> : <StarsIcon className="w-5 h-5" />}
        </button>
      </div>
      
      <button
        onClick={handleGenerate}
        disabled={isLoading || !prompt.trim()}
        className="btn btn-primary w-full"
      >
        <PlayIcon className="w-5 h-5" />
        {t('animatePanel.button')}
      </button>
    </div>
  );
};

export default AnimatePanel;