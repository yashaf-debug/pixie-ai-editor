/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { BriefcaseIcon, CalendarIcon, UndoIcon, CameraIcon } from './icons';

interface BusinessToolsHubProps {
    onNavigate: (mode: 'adCreativeStudio' | 'contentPlanGenerator' | 'productStudio') => void;
    onBack: () => void;
}

const BusinessToolsHub: React.FC<BusinessToolsHubProps> = ({ onNavigate, onBack }) => {
    const { t } = useLanguage();

    return (
        <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-6 animate-fade-in p-4">
            <button onClick={onBack} data-tooltip={t('tooltip.back')} className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors">
                <UndoIcon className="w-5 h-5" />
            </button>
            <div className="text-center mt-12">
                <h1 className="text-4xl md:text-5xl font-bold text-gray-900">{t('businessHub.title')}</h1>
                <p className="text-gray-600 mt-2 max-w-2xl">{t('businessHub.subtitle')}</p>
            </div>

            <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                <button
                    onClick={() => onNavigate('adCreativeStudio')}
                    className="bg-white p-6 rounded-xl border border-gray-200 text-left hover:border-blue-500 hover:ring-2 hover:ring-blue-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col items-start h-full"
                >
                    <div className="bg-purple-100 p-3 rounded-lg mb-4">
                        <BriefcaseIcon className="w-8 h-8 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{t('businessHub.adCreative.title')}</h3>
                    <p className="text-gray-600 flex-grow mb-4">{t('businessHub.adCreative.desc')}</p>
                    <span className="text-blue-600 font-semibold flex items-center gap-1 group-hover:underline">
                        {t('businessHub.launchStudio')}
                        <span className="text-lg">→</span>
                    </span>
                </button>

                <button
                    onClick={() => onNavigate('productStudio')}
                    className="bg-white p-6 rounded-xl border border-gray-200 text-left hover:border-blue-500 hover:ring-2 hover:ring-blue-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col items-start h-full"
                >
                    <div className="bg-red-100 p-3 rounded-lg mb-4">
                        <CameraIcon className="w-8 h-8 text-red-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{t('businessHub.productStudio.title')}</h3>
                    <p className="text-gray-600 flex-grow mb-4">{t('businessHub.productStudio.desc')}</p>
                    <span className="text-blue-600 font-semibold flex items-center gap-1 group-hover:underline">
                        {t('businessHub.launchProductStudio')}
                        <span className="text-lg">→</span>
                    </span>
                </button>

                <button
                    onClick={() => onNavigate('contentPlanGenerator')}
                    className="bg-white p-6 rounded-xl border border-gray-200 text-left hover:border-blue-500 hover:ring-2 hover:ring-blue-200 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col items-start h-full"
                >
                    <div className="bg-green-100 p-3 rounded-lg mb-4">
                        <CalendarIcon className="w-8 h-8 text-green-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">{t('businessHub.contentPlan.title')}</h3>
                    <p className="text-gray-600 flex-grow mb-4">{t('businessHub.contentPlan.desc')}</p>
                    <span className="text-blue-600 font-semibold flex items-center gap-1 group-hover:underline">
                        {t('businessHub.generatePlan')}
                        <span className="text-lg">→</span>
                    </span>
                </button>
            </div>
        </div>
    );
};

export default BusinessToolsHub;