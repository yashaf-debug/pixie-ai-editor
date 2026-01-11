/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { useLanguage } from './contexts/LanguageContext';
import { Tool } from './types';
import { 
    CropIcon, PaletteIcon, SunIcon, BackgroundRemoveIcon, PortraitIcon, EnhanceIcon, BatchIcon, EraserIcon, ExpandFrameIcon, LayersIcon, ChatIcon, HistoryIcon, PlayIcon
} from './components/icons';
import { TranslationKey } from './translations';

interface ToolbarProps {
    activeTool: Tool | null;
    onSelectTool: (tool: Tool | null) => void;
    isLoading: boolean;
}

const ToolButton: React.FC<{
    label: string;
    tooltip: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
    disabled?: boolean;
}> = ({ label, tooltip, icon, isActive, onClick, disabled }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`w-full flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors duration-200 aspect-square ${
            isActive 
            ? 'bg-blue-100 text-blue-700' 
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        data-tooltip={tooltip}
    >
        {icon}
        <span className="text-[10px] font-bold">{label}</span>
    </button>
);

const Toolbar: React.FC<ToolbarProps> = ({
    activeTool,
    onSelectTool,
    isLoading,
}) => {
    const { t } = useLanguage();

    const tools: { id: Tool; labelKey: TranslationKey; tooltipKey: TranslationKey; icon: React.ReactNode }[] = [
        { id: 'chat', labelKey: 'toolbar.chat', tooltipKey: 'toolbar.tooltip.chat', icon: <ChatIcon className="w-6 h-6" /> },
        { id: 'animate', labelKey: 'toolbar.animate', tooltipKey: 'toolbar.tooltip.animate', icon: <PlayIcon className="w-6 h-6" /> },
        { id: 'crop', labelKey: 'toolbar.crop', tooltipKey: 'toolbar.tooltip.crop', icon: <CropIcon className="w-6 h-6" /> },
        { id: 'filter', labelKey: 'toolbar.filters', tooltipKey: 'toolbar.tooltip.filters', icon: <PaletteIcon className="w-6 h-6" /> },
        { id: 'adjustment', labelKey: 'toolbar.adjust', tooltipKey: 'toolbar.tooltip.adjust', icon: <SunIcon className="w-6 h-6" /> },
        { id: 'erase', labelKey: 'toolbar.erase', tooltipKey: 'toolbar.tooltip.erase', icon: <EraserIcon className="w-6 h-6" /> },
        { id: 'bg-remove', labelKey: 'toolbar.bgRemove', tooltipKey: 'toolbar.tooltip.bgRemove', icon: <BackgroundRemoveIcon className="w-6 h-6" /> },
        { id: 'expand', labelKey: 'toolbar.expand', tooltipKey: 'toolbar.tooltip.expand', icon: <ExpandFrameIcon className="w-6 h-6" /> },
        { id: 'portrait', labelKey: 'toolbar.portrait', tooltipKey: 'toolbar.tooltip.portrait', icon: <PortraitIcon className="w-6 h-6" /> },
        { id: 'enhance', labelKey: 'toolbar.enhance', tooltipKey: 'toolbar.tooltip.enhance', icon: <EnhanceIcon className="w-6 h-6" /> },
        { id: 'history', labelKey: 'toolbar.history', tooltipKey: 'toolbar.tooltip.history', icon: <HistoryIcon className="w-6 h-6" /> },
        { id: 'combine', labelKey: 'toolbar.combine', tooltipKey: 'toolbar.tooltip.combine', icon: <BatchIcon className="w-6 h-6" /> },
        { id: 'branding', labelKey: 'toolbar.branding', tooltipKey: 'toolbar.tooltip.branding', icon: <LayersIcon className="w-6 h-6" /> },
    ];

    const handleToolSelect = (toolId: Tool) => {
        if (activeTool === toolId) {
            onSelectTool(null); // Toggle off
        } else {
            onSelectTool(toolId);
        }
    };
    
    return (
        <aside className="w-24 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col items-center p-2 overflow-y-auto">
            <div className="w-full flex flex-col items-center gap-2">
                {tools.map(tool => (
                    <ToolButton
                        key={tool.id}
                        label={t(tool.labelKey)}
                        tooltip={t(tool.tooltipKey)}
                        icon={tool.icon}
                        isActive={activeTool === tool.id}
                        onClick={() => handleToolSelect(tool.id)}
                        disabled={isLoading}
                    />
                ))}
            </div>
        </aside>
    );
};

export default Toolbar;