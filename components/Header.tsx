
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { GalleryIcon, SunIcon, SettingsIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { AppMode } from '../types';

const SparkleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.624l-.219.874-.219-.874a1.5 1.5 0 00-1.023-1.023l-.874-.219.874-.219a1.5 1.5 0 001.023-1.023l.219-.874.219.874a1.5 1.5 0 001.023 1.023l.874.219-.874.219a1.5 1.5 0 00-1.023 1.023z" />
  </svg>
);

const MoonIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
  </svg>
);

interface HeaderProps {
  onOpenGallery: () => void;
  appMode: AppMode;
  onSwitchMode: (mode: AppMode) => void;
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({
  onOpenGallery, appMode, onSwitchMode, onOpenSettings
}) => {
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="w-full flex-shrink-0 py-2.5 sm:py-2 px-3 sm:px-4 border-b border-gray-200/80 bg-white/95 backdrop-blur-sm sticky top-0 z-50 dark:bg-gray-900/95 dark:border-gray-700 safe-area-top">
      <div className="flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-1.5 rounded-lg shadow-sm dark:from-indigo-600 dark:to-indigo-700">
            <SparkleIcon className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            Pixshop
          </h1>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 sm:p-2 text-gray-600 hover:bg-gray-100 active:bg-gray-200 rounded-lg dark:text-gray-300 dark:hover:bg-gray-800 dark:active:bg-gray-700 transition-colors"
            aria-label="Toggle Theme"
          >
            {theme === 'light' ? <MoonIcon className="w-5 h-5" /> : <SunIcon className="w-5 h-5" />}
          </button>

          {/* Language switcher */}
          <div className="flex items-center bg-gray-100 rounded-lg p-0.5 dark:bg-gray-800 shadow-inner">
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-1 text-xs font-bold rounded-md transition-all ${language === 'en'
                  ? 'bg-white shadow-sm text-gray-800 scale-105 dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:bg-gray-200/50 dark:text-gray-400 dark:hover:bg-gray-700/50'
                }`}
              data-tooltip={t('tooltip.switchToEnglish')}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('ru')}
              className={`px-2.5 sm:px-3 py-1.5 sm:py-1 text-xs font-bold rounded-md transition-all ${language === 'ru'
                  ? 'bg-white shadow-sm text-gray-800 scale-105 dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:bg-gray-200/50 dark:text-gray-400 dark:hover:bg-gray-700/50'
                }`}
              data-tooltip={t('tooltip.switchToRussian')}
            >
              RU
            </button>
          </div>

          {/* Gallery button */}
          <button
            onClick={onOpenGallery}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-colors p-2.5 sm:p-2 px-2.5 sm:px-3 rounded-lg dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 dark:active:bg-gray-700"
            data-tooltip={t('tooltip.gallery')}
          >
            <GalleryIcon className="w-5 h-5" />
            <span className="font-medium text-sm hidden md:inline">{t('header.gallery')}</span>
          </button>

          {/* Settings button */}
          <button
            onClick={onOpenSettings}
            className="p-2.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 active:bg-gray-200 transition-colors rounded-lg dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800 dark:active:bg-gray-700"
            data-tooltip="Settings"
          >
            <SettingsIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
