/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface HistoryPanelProps {
  history: string[];
  currentIndex: number;
  onSelectStep: (index: number) => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, currentIndex, onSelectStep }) => {
  const { t } = useLanguage();

  return (
    <div className="w-full flex flex-col gap-2 animate-fade-in">
      <h3 className="text-sm font-bold text-gray-800">{t('toolbar.history')}</h3>
      <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-2">
        {[...history].reverse().map((imageUrl, reverseIndex) => {
          const originalIndex = history.length - 1 - reverseIndex;
          const isActive = originalIndex === currentIndex;
          const label = originalIndex === 0 ? t('historyPanel.original') : t('historyPanel.step', { stepNumber: String(originalIndex) });

          return (
            <button
              key={originalIndex}
              onClick={() => onSelectStep(originalIndex)}
              className={`w-full flex items-center gap-3 p-2 rounded-md transition-colors text-left ${
                isActive
                  ? 'bg-blue-100 ring-1 ring-inset ring-blue-500'
                  : 'hover:bg-gray-100'
              }`}
            >
              <img
                src={imageUrl}
                alt={label}
                className="w-12 h-12 object-cover rounded-md flex-shrink-0 bg-gray-200"
              />
              <span
                className={`text-sm font-semibold ${
                  isActive ? 'text-blue-800' : 'text-gray-700'
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default HistoryPanel;