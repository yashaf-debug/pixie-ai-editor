/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { UploadIcon, StarsIcon, VideoIcon, BriefcaseIcon, BatchIcon, ChatIcon, ModelsIcon, TryOnIcon, MagicWandIcon, PaletteIcon, SunIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';
import { CREDIT_COSTS } from '../App';
import HeroVisuals from './HeroVisuals';

interface StartScreenProps {
  onFileSelect: (files: FileList | null) => void;
  onGenerateClick: () => void;
  onGenerateVideoClick: () => void;
  onBusinessClick: () => void;
  onBatchGenerateClick: () => void;
  onAIAssistantClick: () => void;
  onMyModelsClick: () => void;
  onVirtualTryOnClick: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onFileSelect, onGenerateClick, onGenerateVideoClick, onBusinessClick, onBatchGenerateClick, onAIAssistantClick, onMyModelsClick, onVirtualTryOnClick }) => {
  const { t } = useLanguage();
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
  };

  const features = [
    {
      icon: <MagicWandIcon className="w-7 h-7" />,
      title: t('startScreen.feature1Title'),
      desc: t('startScreen.feature1Desc'),
      image: 'https://images.pexels.com/photos/2088205/pexels-photo-2088205.jpeg?auto=compress&cs=tinysrgb&w=600',
      color: 'text-blue-500 bg-blue-100',
    },
    {
      icon: <PaletteIcon className="w-7 h-7" />,
      title: t('startScreen.feature2Title'),
      desc: t('startScreen.feature2Desc'),
      image: 'https://images.pexels.com/photos/2693212/pexels-photo-2693212.jpeg?auto=compress&cs=tinysrgb&w=600',
      color: 'text-purple-500 bg-purple-100',
    },
    {
      icon: <SunIcon className="w-7 h-7" />,
      title: t('startScreen.feature3Title'),
      desc: t('startScreen.feature3Desc'),
      image: 'https://images.pexels.com/photos/1287145/pexels-photo-1287145.jpeg?auto=compress&cs=tinysrgb&w=600',
      color: 'text-amber-500 bg-amber-100',
    },
    {
      icon: <BriefcaseIcon className="w-7 h-7" />,
      title: t('startScreen.feature4Title'),
      desc: t('startScreen.feature4Desc'),
      image: 'https://images.pexels.com/photos/3184418/pexels-photo-3184418.jpeg?auto=compress&cs=tinysrgb&w=600',
      color: 'text-emerald-500 bg-emerald-100',
    },
  ];

  const creatorTools = [
    { onClick: onAIAssistantClick, icon: <ChatIcon className="w-5 h-5" />, label: t('startScreen.aiAssistantButton'), cost: CREDIT_COSTS.CHAT, className: "btn-subtle" },
    { onClick: onGenerateVideoClick, icon: <VideoIcon className="w-5 h-5" />, label: t('startScreen.generateVideoButton'), cost: CREDIT_COSTS.GENERATE_VIDEO, className: "btn-subtle" },
    { onClick: onVirtualTryOnClick, icon: <TryOnIcon className="w-5 h-5" />, label: t('startScreen.virtualTryOnButton'), cost: 1, className: "btn-subtle" },
  ];

  const proTools = [
    { onClick: onMyModelsClick, icon: <ModelsIcon className="w-5 h-5" />, label: t('startScreen.myModelsButton'), cost: 1, className: "btn-subtle" },
    { onClick: onBatchGenerateClick, icon: <BatchIcon className="w-5 h-5" />, label: t('startScreen.batchButton'), cost: CREDIT_COSTS.BATCH_PER_IMAGE, className: "btn-subtle" },
    { onClick: onBusinessClick, icon: <BriefcaseIcon className="w-5 h-5" />, label: t('startScreen.businessButton'), cost: 1, className: "btn-subtle" },
  ];

  return (
    <div className="w-full min-h-full overflow-y-auto pb-safe">
      <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-24">

        {/* Hero Section */}
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
          <div className="animate-fade-in text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight !leading-tight">
              {t('startScreen.title1')}
              <span className="hero-title-gradient block mt-2">{t('startScreen.title2')}</span>
            </h1>
            <p className="max-w-xl mx-auto md:mx-0 mt-4 sm:mt-6 text-base sm:text-lg md:text-xl text-gray-600 dark:text-gray-400">
              {t('startScreen.subtitle')}
            </p>

            {/* CTA Buttons */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center md:justify-start">
              <button onClick={onGenerateClick} className="btn btn-accent-gradient h-12 sm:h-auto text-base sm:text-sm">
                <StarsIcon className="w-5 h-5" />
                {t('startScreen.generateButton')}
              </button>
              <label htmlFor="file-upload-secondary" className="btn btn-subtle h-12 sm:h-auto text-base sm:text-sm cursor-pointer">
                <UploadIcon className="w-5 h-5" />
                {t('startScreen.uploadButton')}
              </label>
              <input id="file-upload-secondary" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            </div>
          </div>

          {/* Hero Visual - Hidden on mobile */}
          <div className="hidden md:block w-full aspect-square relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <HeroVisuals />
            </div>
          </div>
        </div>

        {/* Tools Section */}
        <div className="mt-12 sm:mt-16 md:mt-24 lg:mt-32">
          <div className="text-center mb-6">
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">More Tools</h3>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:flex lg:flex-wrap lg:justify-center">
            {creatorTools.map(tool => (
              <button
                key={tool.label}
                onClick={tool.onClick}
                className={`btn ${tool.className} flex-col gap-2 h-auto py-4 px-2 text-center items-center justify-center bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all rounded-xl`}
              >
                <div className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm text-blue-600 dark:text-blue-400">
                  {tool.icon}
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">{tool.label}</span>
              </button>
            ))}
            {proTools.map(tool => (
              <button
                key={tool.label}
                onClick={tool.onClick}
                className={`btn ${tool.className} flex-col gap-2 h-auto py-4 px-2 text-center items-center justify-center bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 hover:shadow-md transition-all rounded-xl`}
              >
                <div className="p-2 bg-white dark:bg-gray-700 rounded-full shadow-sm text-purple-600 dark:text-purple-400">
                  {tool.icon}
                </div>
                <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-200">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-12 sm:mt-16 md:mt-24 lg:mt-32">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group relative bg-white dark:bg-gray-800 p-5 sm:p-6 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow">
                <div className="relative z-10">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${feature.color} dark:opacity-90`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white mt-4">{feature.title}</h3>
                  <p className="text-gray-600 dark:text-gray-400 mt-1 sm:mt-2 text-sm">{feature.desc}</p>
                </div>
                <img
                  src={feature.image}
                  alt={feature.title}
                  className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-10 dark:group-hover:opacity-5 transition-opacity duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StartScreen;