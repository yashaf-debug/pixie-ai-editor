/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
// FIX: Added BrandKit to imports
import { Tool, ChatMessage, BrandKit } from './types';
import AdjustmentPanel from './components/AdjustmentPanel';
import FilterPanel from './components/FilterPanel';
import CropPanel from './components/CropPanel';
import BackgroundPanel from './components/BackgroundPanel';
import PortraitPanel from './components/PortraitPanel';
import EnhancePanel from './components/EnhancePanel';
import CombinePanel from './components/CombinePanel';
import ErasePanel from './components/ErasePanel';
import BrandingPanel from './components/BrandingPanel';
// FIX: Added BrandKitPanel import
import BrandKitPanel from './components/BrandKitPanel';
import ExportOptionsPanel from './components/ExportOptionsPanel';
import ChatPanel from './components/ChatPanel';
import HistoryPanel from './components/HistoryPanel';
import AnimatePanel from './components/AnimatePanel';
import { useLanguage } from './contexts/LanguageContext';

interface ToolOptionsProps {
    activeTool: Tool | null;
    isExporting: boolean;
    // FIX: Removed 'webp' as it is not a supported export format.
    onExport: (format: 'png' | 'jpeg', quality: number, enhance: boolean) => void;
    isLoading: boolean;
    onApplyFilter: (prompt: string) => void;
    onApplyAdjustment: (prompt: string) => void;
    onRemoveBackground: () => void;
    onEnhance: () => void;
    onApplyPortraitEnhancement: (prompt: string) => void;
    // FIX: Added onSaveAsModel to props.
    onSaveAsModel: () => void;
    onCombine: (images: File[], prompt: string) => void;
    onApplyBranding: (logo: File, prompt: string) => void;
    onApplyErase: (prompt: string) => void;
    onClearEraseMask: () => void;
    onApplyCrop: () => void;
    currentImage: File | null;
    aspect: number | undefined;
    onAspectChange: (aspect: number | undefined) => void;
    onSendChatMessage: (prompt: string, files: File[]) => void;
    chatMessages: ChatMessage[];
    brushSize: number;
    onBrushSizeChange: (size: number) => void;
    isMaskEmpty: boolean;
    history: string[];
    historyIndex: number;
    onHistoryStepSelect: (index: number) => void;
    onAnimate: (prompt: string) => void;
    cost: number;
    // FIX: Added onEnhancePrompt to props.
    onEnhancePrompt: (prompt: string) => Promise<string>;
    // FIX: Added brandKit to props.
    brandKit: BrandKit | null;
    // FIX: Added onSaveBrandKit to props.
    onSaveBrandKit: (kit: BrandKit) => void;
    // FIX: Added onApplyBrandStyle to props.
    onApplyBrandStyle: () => void;
}

const ToolOptions: React.FC<ToolOptionsProps> = ({
    activeTool,
    isExporting,
    onExport,
    isLoading,
    onApplyFilter,
    onApplyAdjustment,
    onRemoveBackground,
    onEnhance,
    onApplyPortraitEnhancement,
    // FIX: Destructured onSaveAsModel.
    onSaveAsModel,
    onCombine,
    onApplyBranding,
    onApplyErase,
    onClearEraseMask,
    onApplyCrop,
    currentImage,
    aspect,
    onAspectChange,
    onSendChatMessage,
    chatMessages,
    brushSize,
    onBrushSizeChange,
    isMaskEmpty,
    history,
    historyIndex,
    onHistoryStepSelect,
    onAnimate,
    cost,
    // FIX: Destructured onEnhancePrompt.
    onEnhancePrompt,
    // FIX: Destructured brandKit.
    brandKit,
    // FIX: Destructured onSaveBrandKit.
    onSaveBrandKit,
    // FIX: Destructured onApplyBrandStyle.
    onApplyBrandStyle,
}) => {
    const { t } = useLanguage();

    const renderToolPanel = () => {
        if (isExporting) {
            return <ExportOptionsPanel onExport={onExport} isLoading={isLoading} />;
        }

        switch (activeTool) {
            case 'chat':
                // FIX: Passed missing mainImageFile and onEnhancePrompt props to ChatPanel.
                return <ChatPanel
                    messages={chatMessages}
                    onSendMessage={(prompt, files) => {
                        const filesToSend = currentImage ? [currentImage, ...files] : files;
                        onSendChatMessage(prompt, filesToSend);
                    }}
                    isLoading={isLoading}
                    cost={cost}
                    mainImageFile={currentImage}
                    onEnhancePrompt={onEnhancePrompt}
                />;
            case 'filter':
                // FIX: Passed missing onEnhancePrompt prop to FilterPanel.
                return <FilterPanel onApplyFilter={onApplyFilter} isLoading={isLoading} cost={cost} onEnhancePrompt={onEnhancePrompt} />;
            case 'adjustment':
                // FIX: Passed missing onEnhancePrompt prop to AdjustmentPanel.
                return <AdjustmentPanel onApplyAdjustment={onApplyAdjustment} isLoading={isLoading} cost={cost} onEnhancePrompt={onEnhancePrompt} />;
            case 'crop':
                return <CropPanel onApplyCrop={onApplyCrop} isLoading={isLoading} aspect={aspect} onAspectChange={onAspectChange} />;
            case 'bg-remove':
                return <BackgroundPanel onRemoveBackground={onRemoveBackground} isLoading={isLoading} cost={cost} />;
            case 'portrait':
                // FIX: Passed missing onSaveAsModel prop to PortraitPanel.
                return <PortraitPanel onApplyEnhancement={onApplyPortraitEnhancement} onSaveAsModel={onSaveAsModel} isLoading={isLoading} cost={cost} />;
            case 'enhance':
                return <EnhancePanel onEnhance={onEnhance} isLoading={isLoading} cost={cost} />;
            case 'combine':
                // FIX: Passed missing onEnhancePrompt prop to CombinePanel.
                return <CombinePanel onCombine={onCombine} isLoading={isLoading} currentImage={currentImage} cost={cost} onEnhancePrompt={onEnhancePrompt} />;
            case 'erase':
                // FIX: Passed missing onEnhancePrompt prop to ErasePanel.
                return <ErasePanel onApplyEdit={onApplyErase} onClearMask={onClearEraseMask} brushSize={brushSize} onBrushSizeChange={onBrushSizeChange} isLoading={isLoading} isMaskEmpty={isMaskEmpty} cost={cost} onEnhancePrompt={onEnhancePrompt} />;
            case 'branding':
                // FIX: Passed missing onEnhancePrompt and brandKit props to BrandingPanel.
                return <BrandingPanel onApplyBranding={onApplyBranding} isLoading={isLoading} cost={cost} onEnhancePrompt={onEnhancePrompt} brandKit={brandKit} />;
            // FIX: Added missing brand-kit case.
            case 'brand-kit':
                return <BrandKitPanel brandKit={brandKit} onSave={onSaveBrandKit} onApplyStyle={onApplyBrandStyle} isLoading={isLoading} cost={cost} />;
            case 'history':
                return <HistoryPanel history={history} currentIndex={historyIndex} onSelectStep={onHistoryStepSelect} />;
            case 'animate':
                // FIX: Passed missing onEnhancePrompt prop to AnimatePanel.
                return <AnimatePanel onAnimate={onAnimate} isLoading={isLoading} onEnhancePrompt={onEnhancePrompt} />;
            case 'expand':
                return null;
            default:
                return <div className="text-center text-gray-500 p-4">{t('toolOptions.selectTool')}</div>;
        }
    };

    const hasActiveTool = !!activeTool;

    // On mobile, if no tool is active, don't show the panel at all to save space
    if (!activeTool) {
        return (
            <aside className="hidden md:flex w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex-shrink-0 flex-col p-4 overflow-y-auto">
                <div className="text-center text-gray-500 dark:text-gray-400 p-4 mt-10">
                    <h3 className="text-lg font-medium mb-2">{t('toolOptions.selectTool')}</h3>
                    <p className="text-sm opacity-80">{t('toolOptions.selectToolDesc')}</p>
                </div>
            </aside>
        );
    }

    return (
        <aside className="w-full md:w-80 h-[45vh] md:h-full bg-white dark:bg-gray-800 md:border-l md:border-t-0 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 flex flex-col p-4 overflow-y-auto z-20 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] md:shadow-none pb-24 md:pb-4 transition-all order-3 md:order-2">
            {/* Handle Bar for mobile to indicate draggable/swipeable (future enhancement) */}
            <div className="md:hidden w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full mx-auto mb-4 flex-shrink-0"></div>

            <div className="flex-grow overflow-y-auto hide-scrollbar">
                {renderToolPanel()}
            </div>
        </aside>
    );
};

export default ToolOptions;
