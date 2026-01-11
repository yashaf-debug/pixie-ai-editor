/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
// Fix: Import ContentPlanItem type directly from the types file.
import { generateContentPlan } from '../services/geminiService';
import { ContentPlanItem } from '../types';
import Spinner from './Spinner';
import { UndoIcon, StarsIcon } from './icons';

interface ContentPlanGeneratorProps {
    onBack: () => void;
    onGenerateVisual: (prompt: string) => void;
}

const ContentPlanGenerator: React.FC<ContentPlanGeneratorProps> = ({ onBack, onGenerateVisual }) => {
    const { t, language } = useLanguage();
    const [topic, setTopic] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [plan, setPlan] = useState<ContentPlanItem[] | null>(null);

    const handleGenerate = async () => {
        if (!topic.trim()) return;
        setIsLoading(true);
        setError(null);
        setPlan(null);
        try {
            const result = await generateContentPlan(topic, language);
            setPlan(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(t('app.errorFailedToGenerateContentPlan', { errorMessage }));
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleStartOver = () => {
        setTopic('');
        setPlan(null);
        setError(null);
    };

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-6 animate-fade-in p-4">
            <button onClick={onBack} data-tooltip={t('tooltip.back')} className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors">
                <UndoIcon className="w-5 h-5" />
            </button>
            <div className="text-center mt-12">
                <h1 className="text-4xl font-bold text-gray-900">{t('contentPlan.title')}</h1>
                <p className="text-gray-600 mt-2 max-w-2xl">{t('contentPlan.subtitle')}</p>
            </div>

            {!plan && (
                <div className="w-full max-w-xl bg-white p-6 rounded-lg border border-gray-200 flex flex-col gap-4 animate-fade-in">
                    <input
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder={t('contentPlan.placeholder')}
                        className="form-input"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleGenerate}
                        disabled={isLoading || !topic.trim()}
                        className="w-full bg-blue-600 text-white font-bold py-3 rounded-lg transition-colors hover:bg-blue-700 disabled:bg-blue-300"
                    >
                        {isLoading ? t('contentPlan.generating') : t('contentPlan.generateButton')}
                    </button>
                </div>
            )}
            
            <div className="w-full">
                {isLoading && <div className="flex justify-center mt-4"><Spinner /></div>}
                {error && (
                    <div className="text-center bg-red-100 border border-red-300 p-4 rounded-lg max-w-xl mx-auto">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}
                {plan && (
                    <div className="w-full animate-fade-in">
                        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200 shadow-sm">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('contentPlan.columnDay')}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('contentPlan.columnTopic')}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('contentPlan.columnVisual')}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('contentPlan.columnText')}</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{t('contentPlan.columnHashtags')}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {plan.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.day}</td>
                                            <td className="px-4 py-4 whitespace-normal text-sm text-gray-800 font-semibold max-w-xs">{item.topic}</td>
                                            <td className="px-4 py-4 whitespace-normal text-sm text-gray-600 max-w-sm">
                                                <p>{item.visualIdea}</p>
                                                <button onClick={() => onGenerateVisual(item.visualIdea)} data-tooltip={t('tooltip.generateVisual')} className="mt-2 flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800">
                                                    <StarsIcon className="w-3 h-3"/> {t('contentPlan.generateVisual')}
                                                </button>
                                            </td>
                                            <td className="px-4 py-4 whitespace-normal text-sm text-gray-600 max-w-sm">{item.sampleText}</td>
                                            <td className="px-4 py-4 whitespace-normal text-sm text-blue-700 max-w-xs">{item.hashtags}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="text-center mt-6">
                            <button onClick={handleStartOver} className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-6 rounded-md transition-colors">{t('contentPlan.startOver')}</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ContentPlanGenerator;