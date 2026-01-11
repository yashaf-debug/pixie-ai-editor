
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect, useCallback } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop, Crop, PixelCrop } from 'react-image-crop';
import Spinner from './Spinner';
import { Tool, Layer } from '../types';
import ExpandPanel from './ExpandPanel';

interface EditorCanvasProps {
    layers: Layer[];
    activeLayerId: number | null;
    activeTool: Tool | null;
    isLoading: boolean;
    loadingMessage: string;
    zoom: number;
    onZoomChange: (zoom: number) => void;
    isPreviewing: boolean;
    originalImageUrl: string;
    crop: Crop | undefined;
    onCropChange: (crop: Crop, percentCrop: Crop) => void;
    onCropComplete: (crop: PixelCrop) => void;
    aspect: number | undefined;
    brushSize: number;
    onMaskUpdate: (dataUrl: string) => void;
    maskDataUrl: string | null;
    onApplyExpand: (prompt: string, newWidth: number, newHeight: number, imageX: number, imageY: number) => void;
    onMagicWandClick: (coords: { x: number; y: number }) => void;
}

export interface EditorCanvasRef {
    getImageElement: () => HTMLImageElement | null;
    getFinalCanvasAsDataURL: () => Promise<string | null>;
}

function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number,
) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    );
}


const EditorCanvas = forwardRef<EditorCanvasRef, EditorCanvasProps>(({
    layers,
    activeLayerId,
    activeTool,
    isLoading,
    loadingMessage,
    zoom,
    onZoomChange,
    isPreviewing,
    originalImageUrl,
    crop,
    onCropChange,
    onCropComplete,
    aspect,
    brushSize,
    onMaskUpdate,
    maskDataUrl,
    onApplyExpand,
    onMagicWandClick,
}, ref) => {
    const imgRef = useRef<HTMLImageElement>(null); // Ref for the base image to get dimensions
    const [imgLoaded, setImgLoaded] = useState(false);
    const displayCanvasRef = useRef<HTMLCanvasElement>(null); // For user feedback
    const dataCanvasRef = useRef<HTMLCanvasElement | null>(null); // For API mask data, not in DOM
    const isDrawing = useRef(false);
    const lastPos = useRef<{ x: number, y: number } | null>(null);
    const canvasContainerRef = useRef<HTMLDivElement>(null);
    const [imageForExpand, setImageForExpand] = useState<string | null>(null);

    const getFinalCanvasAsDataURL = useCallback(async (): Promise<string | null> => {
        const visibleLayers = layers.filter(l => l.visible);
        if (visibleLayers.length === 0) return null;

        // Use the dimensions of the LAST visible layer (top-most).
        // This ensures that if the image was upscaled/enhanced, we export at the new, higher resolution.
        const topLayer = visibleLayers[visibleLayers.length - 1];
        const topImg = new Image();
        topImg.src = topLayer.imageUrl;
        await new Promise(resolve => { topImg.onload = resolve; });
        const { naturalWidth, naturalHeight } = topImg;

        if (naturalWidth === 0 || naturalHeight === 0) return null;

        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = naturalWidth;
        finalCanvas.height = naturalHeight;
        const ctx = finalCanvas.getContext('2d');
        if (!ctx) return null;

        // Enable high-quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        for (const layer of visibleLayers) {
            const img = new Image();
            img.src = layer.imageUrl;
            await new Promise(resolve => { img.onload = resolve; });
            ctx.drawImage(img, 0, 0, finalCanvas.width, finalCanvas.height);
        }
        return finalCanvas.toDataURL('image/png');
    }, [layers]);

    useEffect(() => {
        if (activeTool === 'expand') {
            getFinalCanvasAsDataURL().then(dataUrl => {
                setImageForExpand(dataUrl);
            });
        } else {
            setImageForExpand(null);
        }
    }, [activeTool, getFinalCanvasAsDataURL]);

    useImperativeHandle(ref, () => ({
        getImageElement: () => imgRef.current,
        getFinalCanvasAsDataURL,
    }));

    const calculateInitialZoom = useCallback(() => {
        const img = imgRef.current;
        const container = canvasContainerRef.current;

        // Ensure all elements are ready and we are on the initial layer
        if (container && img && img.naturalWidth > 0 && layers.length === 1 && layers[0].name === 'Original') {
            const { naturalWidth, naturalHeight } = img;

            const viewport = container;
            const containerWidth = viewport.clientWidth - 32; // p-4
            const containerHeight = viewport.clientHeight - 32; // p-4

            if (containerWidth <= 0 || containerHeight <= 0) {
                return;
            };

            const widthRatio = containerWidth / naturalWidth;
            const heightRatio = containerHeight / naturalHeight;
            const newZoom = Math.min(widthRatio, heightRatio);

            onZoomChange(newZoom);
        }
    }, [layers, onZoomChange]);

    useEffect(() => {
        if (imgLoaded) {
            // A short timeout gives the browser a moment to calculate the final layout,
            // preventing a race condition where container dimensions might be zero.
            const timer = setTimeout(calculateInitialZoom, 50);
            return () => clearTimeout(timer);
        }
    }, [imgLoaded, calculateInitialZoom]);

    // Reset imgLoaded state when a new image is loaded (base layer id changes)
    useEffect(() => {
        setImgLoaded(false);
    }, [layers[0]?.id]);

    const setupCanvases = useCallback(() => {
        const image = imgRef.current;
        const displayCanvas = displayCanvasRef.current;
        if (!image || !displayCanvas || image.naturalWidth === 0) return;

        // Use the rendered client dimensions of the ref image to size the overlay canvas
        displayCanvas.width = image.clientWidth;
        displayCanvas.height = image.clientHeight;

        if (!dataCanvasRef.current) {
            dataCanvasRef.current = document.createElement('canvas');
        }
        dataCanvasRef.current.width = image.naturalWidth;
        dataCanvasRef.current.height = image.naturalHeight;

        const dataCtx = dataCanvasRef.current.getContext('2d');
        if (dataCtx) {
            dataCtx.fillStyle = 'black';
            dataCtx.fillRect(0, 0, dataCanvasRef.current.width, dataCanvasRef.current.height);
        }
    }, []);

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        if (aspect && layers.length === 1) { // Only auto-crop on first load
            const { width, height } = e.currentTarget;
            onCropChange(centerAspectCrop(width, height, aspect), centerAspectCrop(width, height, aspect));
        }
        setImgLoaded(true);
        setTimeout(setupCanvases, 50);
    }

    useEffect(() => {
        if (activeTool === 'erase' || activeTool === 'magic-wand') {
            setTimeout(setupCanvases, 50);
        }
    }, [activeTool, setupCanvases]);

    useEffect(() => {
        if (maskDataUrl === null) {
            const displayCtx = displayCanvasRef.current?.getContext('2d');
            const dataCtx = dataCanvasRef.current?.getContext('2d');
            if (displayCtx) displayCtx.clearRect(0, 0, displayCtx.canvas.width, displayCtx.canvas.height);
            if (dataCtx) {
                dataCtx.fillStyle = 'black';
                dataCtx.fillRect(0, 0, dataCtx.canvas.width, dataCtx.canvas.height);
            }
        }
    }, [maskDataUrl]);

    // Effect to render the selection mask from Magic Wand or Erase tool
    useEffect(() => {
        const displayCanvas = displayCanvasRef.current;
        if (!displayCanvas) return;
        const displayCtx = displayCanvas.getContext('2d');
        if (!displayCtx) return;

        // If no mask or the wrong tool is active, ensure the canvas is clear.
        if (!maskDataUrl || (activeTool !== 'magic-wand' && activeTool !== 'erase')) {
            displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
            return;
        }

        const maskImage = new Image();
        maskImage.onload = () => {
            // Clear previous drawings
            displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);

            // Draw the black & white mask
            displayCtx.drawImage(maskImage, 0, 0, displayCanvas.width, displayCanvas.height);

            // Use composite operation to color the white parts of the mask
            displayCtx.globalCompositeOperation = 'source-in';

            // Fill with a semi-transparent red overlay to show the selection
            displayCtx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            displayCtx.fillRect(0, 0, displayCanvas.width, displayCanvas.height);

            // Reset for other drawing operations
            displayCtx.globalCompositeOperation = 'source-over';
        };
        maskImage.src = maskDataUrl;

    }, [maskDataUrl, activeTool]);

    useEffect(() => {
        const image = imgRef.current;
        const displayCanvas = displayCanvasRef.current;
        const dataCanvas = dataCanvasRef.current;
        const container = displayCanvas?.parentElement;

        if (!image || !displayCanvas || !dataCanvas || !container || activeTool !== 'erase') {
            return;
        }

        const getDisplayCoords = (e: MouseEvent) => {
            const rect = displayCanvas.getBoundingClientRect();
            return { x: e.clientX - rect.left, y: e.clientY - rect.top };
        };

        const drawOnCanvas = (from: { x: number, y: number }, to: { x: number, y: number }) => {
            const displayCtx = displayCanvas.getContext('2d');
            const dataCtx = dataCanvas.getContext('2d');
            if (!displayCtx || !dataCtx) return;

            displayCtx.beginPath();
            displayCtx.moveTo(from.x, from.y);
            displayCtx.lineTo(to.x, to.y);
            displayCtx.strokeStyle = 'rgba(255, 0, 0, 0.7)';
            displayCtx.lineWidth = brushSize;
            displayCtx.lineCap = 'round';
            displayCtx.lineJoin = 'round';
            displayCtx.stroke();

            const scaleX = dataCanvas.width / displayCanvas.width;
            const scaleY = dataCanvas.height / displayCanvas.height;

            dataCtx.beginPath();
            dataCtx.moveTo(from.x * scaleX, from.y * scaleY);
            dataCtx.lineTo(to.x * scaleX, to.y * scaleY);
            dataCtx.strokeStyle = 'white';
            dataCtx.lineWidth = brushSize * scaleX;
            dataCtx.lineCap = 'round';
            dataCtx.lineJoin = 'round';
            dataCtx.stroke();
        };

        const handleMouseDown = (e: MouseEvent) => {
            isDrawing.current = true;
            const pos = getDisplayCoords(e);
            lastPos.current = pos;
            drawOnCanvas(pos, pos);
        };

        const handleMouseMove = (e: MouseEvent) => {
            if (!isDrawing.current || !lastPos.current) return;
            const currentPos = getDisplayCoords(e);
            drawOnCanvas(lastPos.current, currentPos);
            lastPos.current = currentPos;
        };

        const handleMouseUp = () => {
            if (!isDrawing.current) return;
            isDrawing.current = false;
            lastPos.current = null;
            onMaskUpdate(dataCanvas.toDataURL());
        };

        container.addEventListener('mousedown', handleMouseDown);
        container.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        container.addEventListener('mouseleave', handleMouseUp);

        return () => {
            container.removeEventListener('mousedown', handleMouseDown);
            container.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
            container.removeEventListener('mouseleave', handleMouseUp);
        };
    }, [activeTool, brushSize, onMaskUpdate, setupCanvases]);

    const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (activeTool !== 'magic-wand' || !imgRef.current || isLoading) return;

        const img = imgRef.current;
        const canvas = e.currentTarget;
        const rect = canvas.getBoundingClientRect();

        const displayX = e.clientX - rect.left;
        const displayY = e.clientY - rect.top;

        const scaleX = img.naturalWidth / img.width;
        const scaleY = img.naturalHeight / img.height;

        const naturalX = Math.round(displayX * scaleX);
        const naturalY = Math.round(displayY * scaleY);

        if (naturalX >= 0 && naturalX <= img.naturalWidth && naturalY >= 0 && naturalY <= img.naturalHeight) {
            onMagicWandClick({ x: naturalX, y: naturalY });
        }
    };

    // Find the index of the top-most visible layer to treat as reference
    const visibleLayersIndices = layers.map((l, i) => l.visible ? i : -1).filter(i => i !== -1);
    const topMostVisibleIndex = visibleLayersIndices.length > 0 ? visibleLayersIndices[visibleLayersIndices.length - 1] : 0;

    const imageStackContainer = (
        <div className="grid max-w-full max-h-full">
            {isPreviewing ? (
                <img
                    ref={imgRef}
                    src={originalImageUrl}
                    alt="Original"
                    className="col-start-1 row-start-1 w-full h-full object-contain pointer-events-none"
                    onLoad={onImageLoad}
                />
            ) : (
                layers.map((layer, index) => {
                    // Attach ref and onLoad to the top-most visible layer
                    const isReferenceLayer = index === topMostVisibleIndex;
                    return (
                        <img
                            ref={isReferenceLayer ? imgRef : null}
                            key={layer.id}
                            src={layer.imageUrl}
                            alt={layer.name}
                            className="col-start-1 row-start-1 w-full h-full object-contain pointer-events-none"
                            style={{ visibility: layer.visible ? 'visible' : 'hidden' }}
                            onLoad={isReferenceLayer ? onImageLoad : undefined}
                        />
                    );
                })
            )}
        </div>
    );

    const renderCanvasContent = () => {
        if (activeTool === 'expand') {
            if (!imageForExpand) {
                return <Spinner />;
            }
            return (
                <ExpandPanel
                    imageUrl={imageForExpand}
                    onApplyExpand={onApplyExpand}
                    isLoading={isLoading}
                    isVisible={true}
                />
            );
        }

        return (
            <div
                style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'center center',
                    width: 'max-content',
                    height: 'max-content',
                }}
                className="relative"
            >
                {activeTool === 'crop' ? (
                    <ReactCrop
                        crop={crop}
                        onChange={onCropChange}
                        onComplete={c => onCropComplete(c)}
                        aspect={aspect}
                        className="max-w-full max-h-full"
                    >
                        {imageStackContainer}
                    </ReactCrop>
                ) : (
                    <div
                        className="relative"
                        style={{ cursor: activeTool === 'magic-wand' ? 'crosshair' : activeTool === 'erase' ? 'crosshair' : 'default' }}
                    >
                        {imageStackContainer}
                    </div>
                )}
                <canvas
                    ref={displayCanvasRef}
                    className="absolute top-0 left-0 w-full h-full"
                    onClick={handleCanvasClick}
                    style={{
                        pointerEvents: activeTool === 'erase' || activeTool === 'magic-wand' ? 'auto' : 'none',
                    }}
                />
            </div>
        );
    }

    // Pinch to zoom and Pan logic
    const touchStartDist = useRef<number | null>(null);
    const touchStartCenter = useRef<{ x: number, y: number } | null>(null);

    const handleTouchStart = (e: React.TouchEvent) => {
        if (e.touches.length === 2) {
            // Calculate distance for zoom
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );
            touchStartDist.current = dist;

            // Calculate center for pan
            const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
            touchStartCenter.current = { x: centerX, y: centerY };
        }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        if (e.touches.length === 2 && touchStartDist.current !== null && touchStartCenter.current !== null) {
            e.preventDefault(); // Prevent native page scrolling

            // 1. Handle Zoom
            const dist = Math.hypot(
                e.touches[0].clientX - e.touches[1].clientX,
                e.touches[0].clientY - e.touches[1].clientY
            );

            const deltaZoom = dist / touchStartDist.current;
            const newZoom = Math.max(0.1, Math.min(5, zoom * deltaZoom)); // Limit zoom level
            onZoomChange(newZoom);
            touchStartDist.current = dist; // Update for continuous zoom

            // 2. Handle Pan
            const centerX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
            const centerY = (e.touches[0].clientY + e.touches[1].clientY) / 2;

            const deltaX = centerX - touchStartCenter.current.x;
            const deltaY = centerY - touchStartCenter.current.y;

            if (canvasContainerRef.current) {
                canvasContainerRef.current.scrollLeft -= deltaX;
                canvasContainerRef.current.scrollTop -= deltaY;
            }

            touchStartCenter.current = { x: centerX, y: centerY };
        }
    };

    const handleTouchEnd = () => {
        touchStartDist.current = null;
        touchStartCenter.current = null;
    };

    return (
        <div
            ref={canvasContainerRef}
            className="relative w-full h-full flex items-center justify-center overflow-auto p-4 checkerboard-bg touch-none"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {layers.length > 0 && renderCanvasContent()}
            {isLoading && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center gap-4 animate-fade-in z-20">
                    <Spinner />
                    <p className="text-gray-700 font-medium">{loadingMessage}</p>
                </div>
            )}
        </div>
    );
});

export default EditorCanvas;
