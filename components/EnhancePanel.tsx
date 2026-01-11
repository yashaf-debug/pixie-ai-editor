/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { EnhanceIcon } from './icons';

interface EnhancePanelProps {
  onEnhance: () => void;
  isLoading: boolean;
  cost: number;
}

const EnhancePanel: React.FC<EnhancePanelProps> = ({ onEnhance, isLoading, cost }) => {
  const { t } = useLanguage();

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <h3 className="text-sm font-bold text-gray-800">{t('enhancePanel.title')}</h3>
      <p className="text-sm text-gray-500 -mt-3">{t('enhancePanel.description')}</p>

      <button
        onClick={onEnhance}
        disabled={isLoading}
        className="btn btn-primary w-full"
      >
        <EnhanceIcon className="w-5 h-5" />
        {t('enhancePanel.enhanceButton')} ({t('credits.costLabel', { cost: String(cost) })})
      </button>
    </div>
  );
};

export default EnhancePanel;