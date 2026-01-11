/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { UploadIcon, ShieldCheckIcon } from './icons';

interface WatermarkPanelProps {
  onApplyWatermark: (watermarkFile: File) => void;
  isLoading: boolean;
  cost: number;
}

const WatermarkPanel: React.FC<WatermarkPanelProps> = ({ onApplyWatermark, isLoading, cost }) => {
  const { t } = useLanguage();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleApply = () => {
    if (file) {
      onApplyWatermark(file);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <h3 className="text-sm font-bold text-gray-800 dark:text-white">{t('watermarkPanel.title')}</h3>
      <p className="text-sm text-gray-500 -mt-3 dark:text-gray-400">{t('watermarkPanel.description')}</p>

      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-gray-700 dark:text-gray-300">{t('watermarkPanel.upload')}</label>
        
        {previewUrl ? (
            <div className="relative w-full aspect-video bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 dark:border-gray-600">
                <img src={previewUrl} alt="Watermark Preview" className="max-w-full max-h-full object-contain" />
                <button 
                    onClick={() => { setFile(null); setPreviewUrl(null); }}
                    className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        ) : (
            <label className="w-full h-32 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors dark:border-gray-600 dark:hover:bg-gray-800">
                <UploadIcon className="w-8 h-8 text-gray-400" />
                <span className="text-xs text-gray-500 mt-2">{t('watermarkPanel.upload')}</span>
                <input type="file" accept="image/png, image/jpeg" onChange={handleFileChange} className="hidden" />
            </label>
        )}
      </div>

      <button
        onClick={handleApply}
        disabled={isLoading || !file}
        className="btn btn-primary w-full mt-2"
      >
        <ShieldCheckIcon className="w-5 h-5" />
        {t('watermarkPanel.apply')} ({t('credits.costLabel', { cost: String(cost) })})
      </button>
    </div>
  );
};

export default WatermarkPanel;