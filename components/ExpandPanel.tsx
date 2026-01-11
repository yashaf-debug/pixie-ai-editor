/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ExpandFrameIcon } from './icons';

interface ExpandPanelProps {
    onApplyExpand: (prompt: string, newWidth: number, newHeight: number, imageX: number, imageY: number) => void;
    imageUrl: string;
    isLoading: boolean;
    isVisible: boolean;
}

type Handle = 'top-left' | 'top' | 'top-right' | 'left' | 'right' | 'bottom-left' | 'bottom' | 'bottom-right';

const ExpandPanel: React.FC<ExpandPanelProps> = ({ onApplyExpand, imageUrl, isLoading, isVisible }) => {
    const { t } = useLanguage();
    const [prompt, setPrompt] = useState('');

    const internalImgRef = useRef<HTMLImageElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [imageRect, setImageRect] = useState({ width: 0, height: 0 });
    const [expandRect, setExpandRect] = useState({ top: 0, left: 0, width: 0, height: 0 });
    
    const [isDragging, setIsDragging] = useState(false);
    const dragInfo = useRef<{
        handle: Handle;
        startX: number;
        startY: number;
        initialRect: typeof expandRect;
    } | null>(null);

    const calculateInitialSize = useCallback(() => {
        const img = internalImgRef.current;
        const viewport = containerRef.current?.parentElement;
        // FIX: Add checks for naturalHeight and clientHeight to prevent division by zero.
        if (!img || !viewport || img.naturalWidth === 0 || img.naturalHeight === 0 || viewport.clientHeight === 0) return;

        const { naturalWidth, naturalHeight } = img;
        const { clientWidth: containerWidth, clientHeight: containerHeight } = viewport;
        
        const imgAspectRatio = naturalWidth / naturalHeight;
        const containerAspectRatio = containerWidth / containerHeight;
        
        let width, height;
        if (imgAspectRatio > containerAspectRatio) {
            width = containerWidth * 0.9;
            height = width / imgAspectRatio;
        } else {
            height = containerHeight * 0.9;
            width = height * imgAspectRatio;
        }

        setImageRect({ width, height });
        setExpandRect({ top: 0, left: 0, width, height });
    }, []);

    const onImageLoad = () => {
        const timer = setTimeout(calculateInitialSize, 50);
        return () => clearTimeout(timer);
    };

    useEffect(() => {
        if (isVisible) {
            setImageRect({ width: 0, height: 0 });
            setExpandRect({ top: 0, left: 0, width: 0, height: 0 });
        }
    }, [isVisible, imageUrl]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, handle: Handle) => {
        e.preventDefault();
        e.stopPropagation();
        dragInfo.current = {
            handle,
            startX: e.clientX,
            startY: e.clientY,
            initialRect: expandRect,
        };
        setIsDragging(true);
    };
    
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!dragInfo.current) return;
            e.preventDefault();
            e.stopPropagation();

            const { handle, startX, startY, initialRect } = dragInfo.current;
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            // FIX: Refactored state updater to avoid a confusing destructuring that caused errors.
            setExpandRect(() => {
                const newRect = { ...initialRect };

                if (handle.includes('top')) {
                    const newHeight = initialRect.height - deltaY;
                    if (newHeight >= imageRect.height) {
                        newRect.height = newHeight;
                        newRect.top = initialRect.top + deltaY;
                    }
                }
                if (handle.includes('bottom')) {
                    const newHeight = initialRect.height + deltaY;
                    if (newHeight >= imageRect.height) {
                        newRect.height = newHeight;
                    }
                }
                if (handle.includes('left')) {
                    const newWidth = initialRect.width - deltaX;
                    if (newWidth >= imageRect.width) {
                        newRect.width = newWidth;
                        newRect.left = initialRect.left + deltaX;
                    }
                }
                if (handle.includes('right')) {
                    const newWidth = initialRect.width + deltaX;
                    if (newWidth >= imageRect.width) {
                        newRect.width = newWidth;
                    }
                }
                return newRect;
            });
        };

        const handleMouseUp = () => {
            setIsDragging(false);
            dragInfo.current = null;
        };

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging, imageRect.width, imageRect.height]);
    
    const handleGenerateClick = () => {
        if (!internalImgRef.current || imageRect.width === 0) return;
        
        const originalNaturalWidth = internalImgRef.current.naturalWidth;
        const scaleX = originalNaturalWidth / imageRect.width;

        const newNaturalWidth = Math.round(expandRect.width * scaleX);
        const newNaturalHeight = Math.round(expandRect.height * scaleX);
        const imageNaturalX = Math.round(Math.abs(expandRect.left) * scaleX);
        const imageNaturalY = Math.round(Math.abs(expandRect.top) * scaleX);

        onApplyExpand(prompt, newNaturalWidth, newNaturalHeight, imageNaturalX, imageNaturalY);
    };

    const isExpanded = expandRect.width > imageRect.width || expandRect.height > imageRect.height;

    return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-6">
            <div
                ref={containerRef}
                className="relative flex-grow flex items-center justify-center max-h-full max-w-full touch-none select-none"
                style={{
                    width: expandRect.width > 0 ? expandRect.width : 'auto',
                    height: expandRect.height > 0 ? expandRect.height : 'auto',
                }}
            >
                <div 
                    className="absolute border-2 border-dashed border-blue-500 bg-black/10"
                    style={{
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        visibility: imageRect.width > 0 ? 'visible' : 'hidden',
                    }}
                >
                    {(['top-left', 'top', 'top-right', 'left', 'right', 'bottom-left', 'bottom', 'bottom-right'] as Handle[]).map(handle => (
                        <div
                            key={handle}
                            onMouseDown={(e) => handleMouseDown(e, handle)}
                            className="absolute w-3 h-3 bg-white rounded-full border-2 border-blue-500 -m-1.5"
                            style={{
                                top: handle.includes('top') ? 0 : handle.includes('bottom') ? '100%' : '50%',
                                left: handle.includes('left') ? 0 : handle.includes('right') ? '100%' : '50%',
                                transform: `translate(${handle.includes('left') ? '-50%' : handle.includes('right') ? '-50%' : '-50%'}, ${handle.includes('top') ? '-50%' : handle.includes('bottom') ? '-50%' : '-50%'})`,
                                cursor: `${handle.includes('top') ? 'n' : handle.includes('bottom') ? 's' : ''}${handle.includes('left') ? 'w' : handle.includes('right') ? 'e' : ''}-resize`,
                            }}
                        />
                    ))}
                </div>
                 <img 
                    ref={internalImgRef}
                    src={imageUrl}
                    alt="Expand this image"
                    className="object-contain max-h-full max-w-full opacity-80"
                    onLoad={onImageLoad}
                    style={{
                        position: 'absolute',
                        top: Math.abs(expandRect.top),
                        left: Math.abs(expandRect.left),
                        width: imageRect.width,
                        height: imageRect.height,
                        visibility: imageRect.width > 0 ? 'visible' : 'hidden',
                    }}
                />
            </div>

             <div className="w-full max-w-lg bg-white border border-gray-200 rounded-lg p-4 flex flex-col items-center gap-3 flex-shrink-0">
                <h3 className="text-sm font-bold text-gray-800">{t('expandPanel.title')}</h3>
                <p className="text-sm text-gray-500 -mt-2 text-center">{t('expandPanel.description')}</p>
                 <div className="w-full flex flex-col sm:flex-row items-center gap-2">
                    <input
                        type="text"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder={t('expandPanel.placeholder')}
                        className="flex-grow w-full bg-white border border-gray-300 text-gray-800 rounded-md p-2 focus:ring-2 focus:ring-blue-500 focus:outline-none transition disabled:cursor-not-allowed disabled:opacity-60 text-sm"
                        disabled={isLoading}
                    />
                    <button
                        onClick={handleGenerateClick}
                        disabled={isLoading || !isExpanded}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-sm hover:bg-blue-700 active:scale-[0.98] text-sm disabled:bg-blue-300 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        <ExpandFrameIcon className="w-5 h-5" />
                        {t('expandPanel.generateButton')}
                    </button>
                 </div>
            </div>
        </div>
    );
};

export default ExpandPanel;