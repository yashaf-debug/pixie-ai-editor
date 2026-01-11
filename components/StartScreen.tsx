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
    <div className="w-full min-h-full overflow-y-auto">
        <main className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
            
            <div className="grid md:grid-cols-2 gap-16 items-center">
                <div className="animate-fade-in text-center md:text-left">
                    <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight !leading-tight">
                        {t('startScreen.title1')}
                        <span className="hero-title-gradient">{t('startScreen.title2')}</span>
                    </h1>
                    <p className="max-w-xl mx-auto md:mx-0 mt-4 text-lg md:text-xl text-gray-600">
                        {t('startScreen.subtitle')}
                    </p>
                    <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
                         <button onClick={onGenerateClick} className="btn btn-accent-gradient">
                            <StarsIcon className="w-5 h-5" />
                            {t('startScreen.generateButton')}
                        </button>
                        <label htmlFor="file-upload-secondary" className="btn btn-subtle">
                            <UploadIcon className="w-5 h-5" />
                            {t('startScreen.uploadButton')}
                        </label>
                        <input id="file-upload-secondary" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>
                </div>
                <div className="hidden md:block w-full aspect-square relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <HeroVisuals />
                  </div>
                </div>
            </div>

            <div className="mt-20 md:mt-32">
                 <div className="text-center">
                    <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">More Tools</h3>
                </div>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                    {creatorTools.map(tool => (
                        <button key={tool.label} onClick={tool.onClick} className={`btn ${tool.className}`}>
                            {tool.icon}
                            <span>{tool.label}</span>
                        </button>
                    ))}
                    <div className="w-px h-6 bg-gray-300 hidden sm:block mx-2"></div>
                     {proTools.map(tool => (
                        <button key={tool.label} onClick={tool.onClick} className={`btn ${tool.className}`}>
                            {tool.icon}
                            <span>{tool.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="mt-20 md:mt-32">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <div key={index} className="group relative bg-white p-6 rounded-lg border border-gray-200 overflow-hidden">
                            <div className="relative z-10">
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${feature.color}`}>
                                    {feature.icon}
                                </div>
                                <h3 className="text-lg font-bold text-gray-800 mt-4">{feature.title}</h3>
                                <p className="text-gray-600 mt-1 text-sm">{feature.desc}</p>
                            </div>
                            <img src={feature.image} alt={feature.title} className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-10 transition-opacity duration-300"/>
                        </div>
                    ))}
                </div>
            </div>
        </main>
    </div>
  );
};

export default StartScreen;