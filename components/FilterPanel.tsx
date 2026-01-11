/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { StarsIcon } from './icons';
import Spinner from './Spinner';
import { AspectRatio, ImageModel } from '../types';

interface FilterPanelProps {
  onApplyFilter: (prompt: string, aspectRatio?: AspectRatio, model?: ImageModel) => void;
  isLoading: boolean;
  cost: number;
  onEnhancePrompt: (prompt: string) => Promise<string>;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onApplyFilter, isLoading, cost, onEnhancePrompt }) => {
  const { t } = useLanguage();
  const [selectedPresetPrompt, setSelectedPresetPrompt] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio | 'preserve'>('preserve');
  const [model, setModel] = useState<ImageModel>('gemini-3-pro-image-preview');

  const presets = [
    { name: t('filterPanel.presetSynthwave'), prompt: 'Apply a vibrant 80s synthwave aesthetic with neon magenta and cyan glows, and subtle scan lines.' },
    { name: t('filterPanel.presetAnime'), prompt: 'Give the image a vibrant Japanese anime style, with bold outlines, cel-shading, and saturated colors.' },
    { name: t('filterPanel.presetLomo'), prompt: 'Apply a Lomography-style cross-processing film effect with high-contrast, oversaturated colors, and dark vignetting.' },
    { name: t('filterPanel.presetGlitch'), prompt: 'Transform the image into a futuristic holographic projection with digital glitch effects and chromatic aberration.' },
  ];
  
  const activePrompt = selectedPresetPrompt || customPrompt;

  const handlePresetClick = (prompt: string) => {
    setSelectedPresetPrompt(prompt);
    setCustomPrompt('');
  };
  
  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomPrompt(e.target.value);
    setSelectedPresetPrompt(null);
  };

  const handleApply = () => {
    if (activePrompt) {
        const ar = aspectRatio === 'preserve' ? undefined : aspectRatio;
        onApplyFilter(activePrompt, ar, model);
    }
  };

  const handleEnhanceClick = async () => {
      const promptToEnhance = customPrompt || selectedPresetPrompt;
      if (!promptToEnhance || isEnhancing || isLoading) return;

      setIsEnhancing(true);
      const enhancedPrompt = await onEnhancePrompt(promptToEnhance);
      setCustomPrompt(enhancedPrompt);
      setSelectedPresetPrompt(null);
      setIsEnhancing(false);
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <h3 className="text-sm font-bold text-gray-800 dark:text-white">{t('filterPanel.title')}</h3>
      
      <div className="grid grid-cols-2 gap-2">
        {presets.map(preset => (
          <button
            key={preset.name}
            onClick={() => handlePresetClick(preset.prompt)}
            disabled={isLoading}
            className={`w-full text-center bg-gray-100 border text-gray-700 font-medium py-2 px-2 rounded-md transition-all duration-200 ease-in-out hover:bg-gray-200 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700 ${selectedPresetPrompt === preset.prompt ? 'border-blue-500 ring-1 ring-blue-500 dark:border-blue-400 dark:ring-blue-400' : 'border-gray-300'}`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <div className="relative w-full">
        <input
          type="text"
          value={customPrompt}
          onChange={handleCustomChange}
          placeholder={t('filterPanel.placeholder')}
          className="form-input pr-10"
          disabled={isLoading || isEnhancing}
        />
        <button
          type="button"
          onClick={handleEnhanceClick}
          disabled={isLoading || isEnhancing || !activePrompt}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-purple-600 hover:bg-purple-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:text-purple-400 dark:hover:bg-purple-900/30"
          data-tooltip={t('tooltip.enhancePrompt')}
        >
          {isEnhancing ? <Spinner className="!h-5 !w-5 !mx-0" /> : <StarsIcon className="w-5 h-5" />}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-300">{t('generator.aspectRatio')}</label>
            <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio | 'preserve')} className="form-select text-xs py-1.5" disabled={isLoading}>
                <option value="preserve">{t('aspectRatio.preserve')}</option>
                <option value="1:1">{t('aspectRatio.square')}</option>
                <option value="9:16">{t('aspectRatio.portrait9_16')}</option>
                <option value="3:4">{t('aspectRatio.poster3_4')}</option>
                <option value="2:3">{t('aspectRatio.social2_3')}</option>
                <option value="4:3">{t('aspectRatio.photo4_3')}</option>
                <option value="16:9">{t('aspectRatio.landscape16_9')}</option>
            </select>
        </div>
        <div>
            <label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-300">Model</label>
            <select value={model} onChange={(e) => setModel(e.target.value as ImageModel)} className="form-select text-xs py-1.5" disabled={isLoading}>
                <option value="gemini-3-pro-image-preview">Nano Banana Pro</option>
                <option value="gemini-2.5-flash-image">Nano Banana</option>
            </select>
        </div>
      </div>
      
      {activePrompt && (
        <div className="animate-fade-in flex flex-col gap-4 pt-2">
          <button
            onClick={handleApply}
            className="btn btn-primary w-full"
            disabled={isLoading || !activePrompt.trim()}
          >
            {t('filterPanel.applyButton')} ({t('credits.costLabel', { cost: String(cost) })})
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;