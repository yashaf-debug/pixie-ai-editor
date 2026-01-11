/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { forwardRef, useImperativeHandle, useRef, useState, useEffect, useCallback } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop, Crop, PixelCrop } from 'react-image-crop';
import Spinner from './components/Spinner';
import { Tool } from './types';
import ExpandPanel from './components/ExpandPanel';

interface EditorCanvasProps {
    imageUrl: string;
    activeTool: Tool | null;
    isLoading: boolean;
    loadingMessage: string;
    zoom: number;
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
}

export interface EditorCanvasRef {
    getImageElement: () => HTMLImageElement | null;
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
    imageUrl,
    activeTool,
    isLoading,
    loadingMessage,
    zoom,
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
}, ref) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const [imgLoaded, setImgLoaded] = useState(false);
    const displayCanvasRef = useRef<HTMLCanvasElement>(null); // For user feedback
    const dataCanvasRef = useRef<HTMLCanvasElement | null>(null); // For API mask data, not in DOM
    const isDrawing = useRef(false);
    const lastPos = useRef<{ x: number, y: number } | null>(null);

    useImperativeHandle(ref, () => ({
        getImageElement: () => imgRef.current,
    }));

    const setupCanvases = useCallback(() => {
        const image = imgRef.current;
        const displayCanvas = displayCanvasRef.current;
        if (!image || !displayCanvas || image.naturalWidth === 0) return;

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
      if (aspect) {
        const { width, height } = e.currentTarget;
        onCropChange(centerAspectCrop(width, height, aspect), centerAspectCrop(width, height, aspect));
      }
      setImgLoaded(true);
      setTimeout(setupCanvases, 50); 
    }

    useEffect(() => {
        if(activeTool === 'erase') {
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

        const drawOnCanvas = (from: {x:number, y:number}, to: {x:number, y:number}) => {
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
    
    const imageContent = (
      <img
        ref={imgRef}
        key={imageUrl} 
        src={isPreviewing ? originalImageUrl : imageUrl}
        alt="Editable"
        className="max-w-full max-h-full object-contain transition-transform duration-200 ease-out pointer-events-none"
        style={{ 
            transform: `scale(${zoom})`,
            transformOrigin: 'center center',
            opacity: imgLoaded ? 1 : 0,
        }}
        onLoad={onImageLoad}
      />
    );

    const renderCanvasContent = () => {
        if (activeTool === 'expand') {
            return (
                <ExpandPanel
                    imageUrl={imageUrl}
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
                    cursor: activeTool === 'erase' ? 'crosshair' : 'default',
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
                       {imageContent}
                    </ReactCrop>
                ) : (
                    imageContent
                )}
                 <canvas
                    ref={displayCanvasRef}
                    className="absolute top-0 left-0"
                    style={{
                        pointerEvents: activeTool === 'erase' ? 'auto' : 'none',
                    }}
                />
            </div>
        );
    }

    return (
        <div className="relative w-full h-full flex items-center justify-center overflow-auto p-4 checkerboard-bg">
            {renderCanvasContent()}
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