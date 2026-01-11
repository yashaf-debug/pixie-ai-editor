/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { AspectRatio } from '../types';

interface GenerationSettingsProps {
    model: string;
    setModel: (model: string) => void;
    aspectRatio: AspectRatio;
    setAspectRatio: (ratio: AspectRatio) => void;
    disabled?: boolean;
    compact?: boolean;
}

const GenerationSettings: React.FC<GenerationSettingsProps> = ({
    model,
    setModel,
    aspectRatio,
    setAspectRatio,
    disabled,
    compact = false
}) => {
    const { t } = useLanguage();

    return (
        <div className={`grid ${compact ? 'grid-cols-1 gap-2' : 'grid-cols-1 sm:grid-cols-2 gap-4'} mb-4 animate-fade-in`}>
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 dark:text-gray-400">Model</label>
                <select
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="form-select text-xs py-1.5"
                    disabled={disabled}
                >
                    <option value="gemini-3-pro-image-preview">Nano Banana Pro (Quality)</option>
                    <option value="gemini-2.5-flash-image">Nano Banana (Speed)</option>
                </select>
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-500 mb-1 dark:text-gray-400">{t('generator.aspectRatio')}</label>
                <select
                    value={aspectRatio}
                    onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
                    className="form-select text-xs py-1.5"
                    disabled={disabled}
                >
                    <option value="1:1">{t('aspectRatio.square')}</option>
                    <option value="9:16">{t('aspectRatio.portrait9_16')}</option>
                    <option value="3:4">{t('aspectRatio.poster3_4')}</option>
                    <option value="2:3">{t('aspectRatio.social2_3')}</option>
                    <option value="4:3">{t('aspectRatio.photo4_3')}</option>
                    <option value="16:9">{t('aspectRatio.landscape16_9')}</option>
                </select>
            </div>
        </div>
    );
};

export default GenerationSettings;