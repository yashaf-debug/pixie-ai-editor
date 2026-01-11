/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { UndoIcon, EyeIcon, ResetIcon, ZoomInIcon, ZoomOutIcon, UploadIcon, AddToGalleryIcon, ExportIcon } from './icons';
import { useLanguage } from '../contexts/LanguageContext';

interface EditorHeaderProps {
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onReset: () => void;
    zoom: number;
    onZoomChange: (newZoom: number) => void;
    onUploadNew: () => void;
    onSave: () => void;
    onToggleExport: () => void;
    onSetIsPreviewing: (isPreviewing: boolean) => void;
    isLoading: boolean;
}

const EditorHeader: React.FC<EditorHeaderProps> = ({
    onUndo, onRedo, canUndo, canRedo, onReset, zoom, onZoomChange, onUploadNew, onSave, onToggleExport, onSetIsPreviewing, isLoading
}) => {
    const { t } = useLanguage();

    return (
        <header className="w-full flex-shrink-0 py-2 px-2 sm:px-4 border-b border-gray-200 bg-white/95 backdrop-blur-sm dark:bg-gray-900/95 dark:border-gray-700">
            <div className="flex items-center justify-between gap-2">
                {/* Left: History controls */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={onUndo}
                        disabled={!canUndo || isLoading}
                        data-tooltip={t('tooltip.undo')}
                        className="p-2.5 sm:p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:hover:bg-gray-800 dark:active:bg-gray-700"
                    >
                        <UndoIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>
                    <button
                        onClick={onRedo}
                        disabled={!canRedo || isLoading}
                        data-tooltip={t('tooltip.redo')}
                        className="p-2.5 sm:p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:hover:bg-gray-800 dark:active:bg-gray-700"
                    >
                        <UndoIcon className="w-5 h-5 text-gray-700 dark:text-gray-300 transform -scale-x-100" />
                    </button>

                    {/* Desktop only: Preview & Reset */}
                    <div className="hidden sm:flex items-center gap-1">
                        <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1"></div>
                        <button
                            onMouseDown={() => onSetIsPreviewing(true)}
                            onMouseUp={() => onSetIsPreviewing(false)}
                            onMouseLeave={() => onSetIsPreviewing(false)}
                            onTouchStart={() => onSetIsPreviewing(true)}
                            onTouchEnd={() => onSetIsPreviewing(false)}
                            disabled={isLoading || !canUndo}
                            data-tooltip={t('tooltip.previewOriginal')}
                            className="p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40 transition-colors dark:hover:bg-gray-800"
                        >
                            <EyeIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        </button>
                        <button
                            onClick={onReset}
                            disabled={!canUndo || isLoading}
                            data-tooltip={t('tooltip.resetAll')}
                            className="flex items-center gap-2 p-2 px-3 rounded-lg hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors dark:hover:bg-gray-800"
                        >
                            <ResetIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('header.reset')}</span>
                        </button>
                    </div>
                </div>

                {/* Center: Zoom controls */}
                <div className="flex items-center gap-1">
                    <button
                        onClick={() => onZoomChange(Math.max(0.1, zoom - 0.2))}
                        disabled={isLoading}
                        className="p-2.5 sm:p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40 transition-colors dark:hover:bg-gray-800"
                    >
                        <ZoomOutIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-12 text-center tabular-nums">
                        {Math.round(zoom * 100)}%
                    </span>
                    <button
                        onClick={() => onZoomChange(zoom + 0.2)}
                        disabled={isLoading}
                        className="p-2.5 sm:p-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40 transition-colors dark:hover:bg-gray-800"
                    >
                        <ZoomInIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>
                </div>

                {/* Right: Action buttons */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                    {/* Mobile: Combined menu button */}
                    <button
                        onClick={onUploadNew}
                        disabled={isLoading}
                        className="sm:hidden p-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors dark:bg-gray-800 dark:hover:bg-gray-700"
                    >
                        <UploadIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                    </button>

                    {/* Desktop: All buttons */}
                    <button
                        onClick={onUploadNew}
                        disabled={isLoading}
                        className="hidden sm:flex items-center gap-2 text-sm font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 transition-colors px-4 py-2 rounded-lg dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                    >
                        <UploadIcon className="w-5 h-5" />
                        <span>{t('header.uploadNew')}</span>
                    </button>

                    <button
                        onClick={onSave}
                        disabled={isLoading}
                        className="p-2.5 sm:px-4 sm:py-2 rounded-lg bg-gray-800/10 hover:bg-gray-800/20 active:bg-gray-800/30 transition-colors dark:bg-gray-700 dark:hover:bg-gray-600"
                    >
                        <span className="hidden sm:flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-200">
                            <AddToGalleryIcon className="w-5 h-5" />
                            {t('header.saveToGallery')}
                        </span>
                        <AddToGalleryIcon className="w-5 h-5 sm:hidden text-gray-800 dark:text-gray-200" />
                    </button>

                    <button
                        onClick={onToggleExport}
                        disabled={isLoading}
                        className="p-2.5 sm:px-4 sm:py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 transition-colors shadow-sm shadow-indigo-500/20"
                    >
                        <span className="hidden sm:flex items-center gap-2 text-sm font-semibold text-white">
                            <ExportIcon className="w-5 h-5" />
                            {t('header.export')}
                        </span>
                        <ExportIcon className="w-5 h-5 sm:hidden text-white" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default EditorHeader;