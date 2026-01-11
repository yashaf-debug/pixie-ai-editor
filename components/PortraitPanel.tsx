/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { PortraitIcon, ModelsIcon } from './icons';
import { CREDIT_COSTS } from '../App';

interface PortraitPanelProps {
  onApplyEnhancement: (prompt: string) => void;
  onSaveAsModel: () => void;
  isLoading: boolean;
  cost: number;
}

const PortraitPanel: React.FC<PortraitPanelProps> = ({ onApplyEnhancement, onSaveAsModel, isLoading, cost }) => {
  const { t } = useLanguage();
  const [selectedPresetPrompt, setSelectedPresetPrompt] = useState<string | null>(null);

  const presets = [
    { name: t('portraitPanel.presetNatural'), prompt: 'Perform a subtle and natural portrait retouch. Smooth skin slightly to reduce minor blemishes and wrinkles, but preserve natural skin texture. Brighten eyes subtly and slightly enhance lip color. Do not change facial features or structure.' },
    { name: t('portraitPanel.presetStudio'), prompt: 'Apply professional studio lighting to the portrait. Create a soft key light to illuminate the subject\'s face, a gentle fill light to soften shadows, and a subtle rim light to separate the subject from the background. The result should look like a high-end studio photograph.' },
    { name: t('portraitPanel.presetDramatic'), prompt: 'Enhance the portrait with a dramatic, high-contrast look. Deepen the shadows and increase the highlights (dodging and burning) to sculpt the facial features. Slightly desaturate the colors for a moody, cinematic feel.' },
  ];

  const handlePresetClick = (prompt: string) => {
    setSelectedPresetPrompt(prompt);
  };

  const handleApply = () => {
    if (selectedPresetPrompt) {
      onApplyEnhancement(selectedPresetPrompt);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
        <h3 className="text-sm font-bold text-gray-800">{t('portraitPanel.title')}</h3>
        <p className="text-sm text-gray-500 -mt-3">{t('portraitPanel.description')}</p>
      
      <div className="grid grid-cols-1 gap-2">
        {presets.map(preset => (
          <button
            key={preset.name}
            onClick={() => handlePresetClick(preset.prompt)}
            disabled={isLoading}
            className={`w-full text-center bg-gray-100 border text-gray-700 font-medium py-2 px-2 rounded-md transition-all duration-200 ease-in-out hover:bg-gray-200 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${selectedPresetPrompt === preset.prompt ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300'}`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      {selectedPresetPrompt && (
        <div className="animate-fade-in flex flex-col gap-4 pt-2">
            <button
                onClick={handleApply}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg transition-colors shadow-sm hover:bg-blue-700 active:scale-[0.98] text-sm disabled:bg-blue-300 disabled:shadow-none disabled:cursor-not-allowed"
                disabled={isLoading || !selectedPresetPrompt}
            >
                <PortraitIcon className="w-5 h-5" />
                {t('portraitPanel.applyButton')} ({t('credits.costLabel', { cost: String(cost) })})
            </button>
        </div>
      )}
      <div className="w-full h-px bg-gray-200 my-2"></div>
      <button
        onClick={onSaveAsModel}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 bg-teal-600 text-white font-bold py-2.5 px-4 rounded-lg transition-colors shadow-sm hover:bg-teal-700 active:scale-[0.98] text-sm disabled:bg-teal-300 disabled:shadow-none disabled:cursor-not-allowed"
      >
        <ModelsIcon className="w-5 h-5" />
        {t('portraitPanel.saveAsModelButton')} ({t('credits.costLabel', { cost: String(CREDIT_COSTS.EXTRACT_MODEL) })})
      </button>
    </div>
  );
};

export default PortraitPanel;