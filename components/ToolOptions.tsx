/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { Tool, ChatMessage, BrandKit, Layer, AspectRatio, ImageModel } from '../types';
import AdjustmentPanel from './AdjustmentPanel';
import FilterPanel from './FilterPanel';
import CropPanel from './CropPanel';
import BackgroundPanel from './BackgroundPanel';
import PortraitPanel from './PortraitPanel';
import EnhancePanel from './EnhancePanel';
import CombinePanel from './CombinePanel';
import ErasePanel from './ErasePanel';
import MagicWandPanel from './MagicWandPanel';
import BrandingPanel from './BrandingPanel';
import BrandKitPanel from './BrandKitPanel';
import WatermarkPanel from './WatermarkPanel';
import ExportOptionsPanel from './ExportOptionsPanel';
import ChatPanel from './ChatPanel';
import HistoryPanel from './HistoryPanel';
import AnimatePanel from './AnimatePanel';
import LayersPanel from './LayersPanel';
import { useLanguage } from '../contexts/LanguageContext';

interface ToolOptionsProps {
    activeTool: Tool | null;
    isExporting: boolean;
    onExport: (format: 'png' | 'jpeg', quality: number, enhance: boolean) => void;
    isLoading: boolean;
    onApplyFilter: (prompt: string, aspectRatio?: AspectRatio, model?: ImageModel) => void;
    onApplyAdjustment: (prompt: string, aspectRatio?: AspectRatio, model?: ImageModel) => void;
    onRemoveBackground: () => void;
    onEnhance: () => void;
    onApplyPortraitEnhancement: (prompt: string) => void;
    onSaveAsModel: () => void;
    onCombine: (images: File[], prompt: string, aspectRatio: AspectRatio, model?: ImageModel) => void;
    onApplyBranding: (logo: File, prompt: string) => void;
    onApplyErase: (prompt: string) => void;
    onClearEraseMask: () => void;
    onApplyCrop: () => void;
    currentImage: File | null;
    aspect: number | undefined;
    onAspectChange: (aspect: number | undefined) => void;
    onSendChatMessage: (prompt: string, files: File[], aspectRatio?: AspectRatio, model?: ImageModel) => void;
    chatMessages: ChatMessage[];
    brushSize: number;
    onBrushSizeChange: (size: number) => void;
    isMaskEmpty: boolean;
    layers: Layer[];
    activeLayerId: number | null;
    onSetActiveLayer: (id: number) => void;
    onSetLayerVisibility: (id: number, visible: boolean) => void;
    onDeleteLayer: (id: number) => void;
    onMoveLayer: (id: number, direction: 'up' | 'down') => void;
    onAnimate: (prompt: string) => void;
    cost: number;
    onEnhancePrompt: (prompt: string) => Promise<string>;
    brandKit: BrandKit | null;
    onSaveBrandKit: (kit: BrandKit) => void;
    onApplyBrandStyle: () => void;
    onApplyWatermark: (watermarkFile: File) => void;
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
    layers,
    activeLayerId,
    onSetActiveLayer,
    onSetLayerVisibility,
    onDeleteLayer,
    onMoveLayer,
    onAnimate,
    cost,
    onEnhancePrompt,
    brandKit,
    onSaveBrandKit,
    onApplyBrandStyle,
    onApplyWatermark
}) => {
    const { t } = useLanguage();
    
    const renderToolPanel = () => {
        if (isExporting) {
            return <ExportOptionsPanel onExport={onExport} isLoading={isLoading} />;
        }
        
        switch (activeTool) {
            case 'chat':
                return <ChatPanel 
                    messages={chatMessages} 
                    onSendMessage={(prompt, files, aspectRatio, model) => {
                        const filesToSend = currentImage ? [currentImage, ...files] : files;
                        onSendChatMessage(prompt, filesToSend, aspectRatio, model);
                    }} 
                    isLoading={isLoading} 
                    cost={cost} 
                    mainImageFile={currentImage} 
                    onEnhancePrompt={onEnhancePrompt}
                />;
            case 'filter':
                return <FilterPanel onApplyFilter={onApplyFilter} isLoading={isLoading} cost={cost} onEnhancePrompt={onEnhancePrompt} />;
            case 'adjustment':
                return <AdjustmentPanel onApplyAdjustment={onApplyAdjustment} isLoading={isLoading} cost={cost} onEnhancePrompt={onEnhancePrompt} />;
            case 'crop':
                return <CropPanel onApplyCrop={onApplyCrop} isLoading={isLoading} aspect={aspect} onAspectChange={onAspectChange} />;
            case 'bg-remove':
                return <BackgroundPanel onRemoveBackground={onRemoveBackground} isLoading={isLoading} cost={cost} />;
            case 'portrait':
                return <PortraitPanel onApplyEnhancement={onApplyPortraitEnhancement} onSaveAsModel={onSaveAsModel} isLoading={isLoading} cost={cost} />;
            case 'enhance':
                return <EnhancePanel onEnhance={onEnhance} isLoading={isLoading} cost={cost} />;
            case 'combine':
                return <CombinePanel onCombine={onCombine} isLoading={isLoading} currentImage={currentImage} cost={cost} onEnhancePrompt={onEnhancePrompt} />;
            case 'magic-wand':
                return <MagicWandPanel
                    onApplyErase={onApplyErase}
                    onClearMask={onClearEraseMask}
                    isMaskEmpty={isMaskEmpty}
                    isLoading={isLoading}
                    cost={cost}
                    onEnhancePrompt={onEnhancePrompt}
                />;
            case 'erase':
                return <ErasePanel onApplyEdit={onApplyErase} onClearMask={onClearEraseMask} brushSize={brushSize} onBrushSizeChange={onBrushSizeChange} isLoading={isLoading} isMaskEmpty={isMaskEmpty} cost={cost} onEnhancePrompt={onEnhancePrompt} />;
            case 'branding':
                return <BrandingPanel onApplyBranding={onApplyBranding} isLoading={isLoading} cost={cost} onEnhancePrompt={onEnhancePrompt} brandKit={brandKit} />;
            case 'brand-kit':
                return <BrandKitPanel brandKit={brandKit} onSave={onSaveBrandKit} onApplyStyle={onApplyBrandStyle} isLoading={isLoading} cost={cost} />;
            case 'watermark':
                return <WatermarkPanel onApplyWatermark={onApplyWatermark} isLoading={isLoading} cost={cost} />;
            case 'history':
                 return <LayersPanel
                    layers={layers}
                    activeLayerId={activeLayerId}
                    onSetActiveLayer={onSetActiveLayer}
                    onSetVisibility={onSetLayerVisibility}
                    onDeleteLayer={onDeleteLayer}
                    onMoveLayer={onMoveLayer}
                />;
            case 'layers':
                return <LayersPanel
                    layers={layers}
                    activeLayerId={activeLayerId}
                    onSetActiveLayer={onSetActiveLayer}
                    onSetVisibility={onSetLayerVisibility}
                    onDeleteLayer={onDeleteLayer}
                    onMoveLayer={onMoveLayer}
                />;
            case 'animate':
                return <AnimatePanel onAnimate={onAnimate} isLoading={isLoading} onEnhancePrompt={onEnhancePrompt} />;
            case 'expand':
                return null; 
            default:
                return <div className="text-center text-gray-500 p-4 dark:text-gray-400">{t('toolOptions.selectTool')}</div>;
        }
    };

    return (
        <aside className="w-full md:w-80 bg-white md:border-l border-gray-200 flex-shrink-0 flex flex-col p-4 overflow-y-auto max-h-[60vh] md:max-h-full dark:bg-gray-800 dark:border-gray-700">
            {renderToolPanel()}
        </aside>
    );
};

export default ToolOptions;