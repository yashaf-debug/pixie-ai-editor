/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { BackgroundRemoveIcon } from './icons';

interface BackgroundPanelProps {
  onRemoveBackground: () => void;
  isLoading: boolean;
  cost: number;
}

const BackgroundPanel: React.FC<BackgroundPanelProps> = ({ onRemoveBackground, isLoading, cost }) => {
  const { t } = useLanguage();

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <h3 className="text-sm font-bold text-gray-800">{t('bgRemovePanel.title')}</h3>
      <p className="text-sm text-gray-500 -mt-3">{t('bgRemovePanel.description')}</p>

      <button
        onClick={onRemoveBackground}
        disabled={isLoading}
        className="btn btn-primary w-full"
      >
        <BackgroundRemoveIcon className="w-5 h-5" />
        {t('bgRemovePanel.removeButton')} ({t('credits.costLabel', { cost: String(cost) })})
      </button>
    </div>
  );
};

export default BackgroundPanel;