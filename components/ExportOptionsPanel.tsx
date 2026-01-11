/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ExportIcon } from './icons';

interface ExportOptionsPanelProps {
  onExport: (format: 'png' | 'jpeg', quality: number, enhance: boolean) => void;
  isLoading: boolean;
}

const ExportOptionsPanel: React.FC<ExportOptionsPanelProps> = ({ onExport, isLoading }) => {
  const { t } = useLanguage();
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [quality, setQuality] = useState(90);
  const [enhance, setEnhance] = useState(false);

  const handleExportClick = () => {
    onExport(format, quality, enhance);
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
        <h3 className="text-sm font-bold text-gray-800">{t('exportPanel.title')}</h3>

        <div className="flex flex-col gap-4">
            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">{t('exportPanel.format')}</label>
                <div className="flex bg-gray-100 rounded-md p-0.5">
                    <button onClick={() => setFormat('png')} disabled={isLoading} className={`flex-1 text-center text-xs font-bold py-1 rounded transition-colors ${format === 'png' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:bg-gray-200'}`}>PNG</button>
                    <button onClick={() => setFormat('jpeg')} disabled={isLoading} className={`flex-1 text-center text-xs font-bold py-1 rounded transition-colors ${format === 'jpeg' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500 hover:bg-gray-200'}`}>JPG</button>
                </div>
            </div>

            {format === 'jpeg' && (
                <div className="animate-fade-in">
                    <label htmlFor="quality-slider" className="block text-xs font-medium text-gray-600 mb-1">{t('exportPanel.quality')}: {quality}</label>
                    <input
                        id="quality-slider"
                        type="range"
                        min="10"
                        max="100"
                        value={quality}
                        onChange={(e) => setQuality(Number(e.target.value))}
                        disabled={isLoading}
                    />
                </div>
            )}
            
            <div className="flex items-center gap-2">
                <input
                    id="enhance-checkbox"
                    type="checkbox"
                    checked={enhance}
                    onChange={(e) => setEnhance(e.target.checked)}
                    disabled={isLoading}
                />
                <label htmlFor="enhance-checkbox" className="text-xs font-medium text-gray-700">{t('exportPanel.enhance')}</label>
            </div>
            
            <button
                onClick={handleExportClick}
                disabled={isLoading}
                className="btn btn-primary w-full"
            >
                <ExportIcon className="w-5 h-5"/>
                {t('exportPanel.exportButton')}
            </button>
        </div>
    </div>
  );
};

export default ExportOptionsPanel;