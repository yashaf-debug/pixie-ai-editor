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
    numLayers: number;
}

const ToolButton: React.FC<{
    label: string;
    tooltip: string;
    icon: React.ReactNode;
    isActive: boolean;
    onClick: () => void;
    disabled?: boolean;
    className?: string;
}> = ({ label, tooltip, icon, isActive, onClick, disabled, className = "" }) => (
    <button
        onClick={onClick}
        disabled={disabled}
        className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-all duration-200 ${isActive
                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 shadow-md scale-105'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
            } disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 ${className}`}
        data-tooltip={tooltip}
    >
        {icon}
        <span className="text-[10px] font-medium text-center leading-tight">{label}</span>
    </button>
);

const Toolbar: React.FC<ToolbarProps> = ({
    activeTool,
    onSelectTool,
    isLoading,
    numLayers,
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
        <>
            {/* Mobile: Horizontal bottom bar */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40 safe-area-bottom">
                <div className="flex overflow-x-auto hide-scrollbar px-2 py-2 gap-1">
                    {tools.map(tool => (
                        <ToolButton
                            key={tool.id}
                            label={t(tool.labelKey)}
                            tooltip={t(tool.tooltipKey)}
                            icon={tool.icon}
                            isActive={activeTool === tool.id}
                            onClick={() => handleToolSelect(tool.id)}
                            disabled={isLoading}
                            className="min-w-[64px] h-16 flex-shrink-0"
                        />
                    ))}
                </div>
            </nav>

            {/* Desktop: Vertical sidebar */}
            <aside className="hidden md:flex md:flex-col w-24 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 p-2 overflow-y-auto">
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
                            className="w-full aspect-square"
                        />
                    ))}
                </div>
            </aside>
        </>
    );
};

export default Toolbar;