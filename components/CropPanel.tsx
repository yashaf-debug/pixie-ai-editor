/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface CropPanelProps {
  onApplyCrop: () => void;
  isLoading: boolean;
  aspect: number | undefined;
  onAspectChange: (aspect: number | undefined) => void;
}

const CropPanel: React.FC<CropPanelProps> = ({ onApplyCrop, isLoading, aspect, onAspectChange }) => {
  const { t } = useLanguage();

  const aspectOptions = [
    { label: t('aspectRatio.free'), value: undefined },
    { label: t('aspectRatio.square'), value: 1 / 1 },
    { label: t('aspectRatio.landscape16_9'), value: 16 / 9 },
    { label: t('aspectRatio.portrait9_16'), value: 9 / 16 },
    { label: t('aspectRatio.photo4_3'), value: 4 / 3 },
    { label: t('aspectRatio.poster3_4'), value: 3 / 4 },
  ];
  
  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <h3 className="text-sm font-bold text-gray-800">{t('cropPanel.title')}</h3>
      <p className="text-sm text-gray-500 -mt-3">{t('cropPanel.description')}</p>

      <div className="grid grid-cols-3 gap-2">
        {aspectOptions.map(opt => (
          <button
            key={opt.label}
            onClick={() => onAspectChange(opt.value)}
            disabled={isLoading}
            className={`w-full text-center bg-gray-100 border text-gray-700 font-medium py-2 px-2 rounded-md transition-all duration-200 ease-in-out hover:bg-gray-200 active:scale-95 text-sm disabled:opacity-50 ${aspect === opt.value ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300'}`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      
      <button
        onClick={onApplyCrop}
        disabled={isLoading}
        className="btn btn-primary w-full"
      >
        {t('cropPanel.applyButton')}
      </button>
    </div>
  );
};

export default CropPanel;