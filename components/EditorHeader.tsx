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
        <header className="w-full flex-shrink-0 py-2 px-2 sm:px-4 border-b border-gray-200 bg-white/80 backdrop-blur-sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                    <button onClick={onUndo} disabled={!canUndo || isLoading} data-tooltip={t('tooltip.undo')} className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed">
                        <UndoIcon className="w-5 h-5 text-gray-600" />
                    </button>
                    <button onClick={onRedo} disabled={!canRedo || isLoading} data-tooltip={t('tooltip.redo')} className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed">
                        <UndoIcon className="w-5 h-5 text-gray-600 transform -scale-x-100" />
                    </button>
                    <div className="w-px h-6 bg-gray-200 mx-1 hidden sm:block"></div>
                     <button 
                        onMouseDown={() => onSetIsPreviewing(true)}
                        onMouseUp={() => onSetIsPreviewing(false)}
                        onMouseLeave={() => onSetIsPreviewing(false)}
                        disabled={isLoading || !canUndo} 
                        data-tooltip={t('tooltip.previewOriginal')}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-200 disabled:opacity-40"
                    >
                        <EyeIcon className="w-5 h-5 text-gray-600" />
                    </button>
                    <button onClick={onReset} disabled={!canUndo || isLoading} data-tooltip={t('tooltip.resetAll')} className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed">
                        <ResetIcon className="w-5 h-5 text-gray-600" />
                        <span className="text-sm font-medium text-gray-700 hidden sm:inline">{t('header.reset')}</span>
                    </button>
                </div>
                
                <div className="flex items-center gap-1 sm:gap-2">
                    <button onClick={() => onZoomChange(Math.max(0.1, zoom - 0.2))} disabled={isLoading} className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-40"><ZoomOutIcon className="w-5 h-5 text-gray-600" /></button>
                    <span className="text-sm font-semibold text-gray-700 w-12 text-center">{Math.round(zoom * 100)}%</span>
                    <button onClick={() => onZoomChange(zoom + 0.2)} disabled={isLoading} className="p-2 rounded-md hover:bg-gray-200 disabled:opacity-40"><ZoomInIcon className="w-5 h-5 text-gray-600" /></button>
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                    <button onClick={onUploadNew} disabled={isLoading} className="text-sm font-semibold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors p-2 sm:px-4 rounded-lg">
                        <span className="hidden sm:inline">{t('header.uploadNew')}</span>
                        <UploadIcon className="w-5 h-5 sm:hidden" />
                    </button>
                    <button onClick={onSave} disabled={isLoading} className="text-sm font-semibold text-gray-800 bg-gray-800/10 hover:bg-gray-800/20 transition-colors p-2 sm:px-4 rounded-lg">
                         <span className="hidden sm:inline">{t('header.saveToGallery')}</span>
                         <AddToGalleryIcon className="w-5 h-5 sm:hidden" />
                    </button>
                    <button onClick={onToggleExport} disabled={isLoading} className={`text-sm font-semibold text-white p-2 sm:px-4 rounded-lg transition-colors bg-blue-600 hover:bg-blue-700`}>
                        <span className="hidden sm:inline">{t('header.export')}</span>
                        <ExportIcon className="w-5 h-5 sm:hidden" />
                    </button>
                </div>
            </div>
        </header>
    );
};

export default EditorHeader;