/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { generateVideo, extendVideo } from '../services/geminiService';
import { StarsIcon, UndoIcon, VideoIcon, UploadIcon, TrashIcon } from './icons';
import Spinner from './Spinner';

interface VideoGeneratorProps {
    onBack: () => void;
    initialPrompt?: string;
    initialImageFile?: File | null;
    onEnhancePrompt: (prompt: string) => Promise<string>;
}

type GenerationStatus = 'idle' | 'generating' | 'processing' | 'downloading' | 'done' | 'error';
type VideoResolution = '720p' | '1080p';
type VideoAspectRatio = '16:9' | '9:16';

interface ModelOption {
    id: string;
    label: string;
    model: string;
    includeAudio: boolean;
}

const VideoGenerator: React.FC<VideoGeneratorProps> = ({ onBack, initialPrompt, initialImageFile, onEnhancePrompt }) => {
    const { t } = useLanguage();
    const [prompt, setPrompt] = useState(initialPrompt || '');
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [status, setStatus] = useState<GenerationStatus>('idle');
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isEnhancing, setIsEnhancing] = useState(false);
    
    // Settings
    const [resolution, setResolution] = useState<VideoResolution>('720p');
    const [aspectRatio, setAspectRatio] = useState<VideoAspectRatio>('16:9');
    
    const modelOptions: ModelOption[] = [
        { id: 'veo-3.1-pro-audio', label: 'Veo 3.1 Video + Audio generation', model: 'veo-3.1-generate-preview', includeAudio: true },
        { id: 'veo-3.1-pro', label: 'Veo 3.1 Video generation', model: 'veo-3.1-generate-preview', includeAudio: false },
        { id: 'veo-3.1-fast-audio', label: 'Veo 3.1 Fast Video + Audio generation', model: 'veo-3.1-fast-generate-preview', includeAudio: true },
        { id: 'veo-3.1-fast', label: 'Veo 3.1 Fast Video generation', model: 'veo-3.1-fast-generate-preview', includeAudio: false },
    ];

    const [selectedOptionId, setSelectedOptionId] = useState<string>('veo-3.1-fast-audio');

    // For extension
    const [operation, setOperation] = useState<any>(null);
    const [extendPrompt, setExtendPrompt] = useState('');
    const [isExtending, setIsExtending] = useState(false);

    // Initial Image Handling
    useEffect(() => {
        if (initialImageFile) {
            setImageFiles([initialImageFile]);
            setImagePreviews([URL.createObjectURL(initialImageFile)]);
        }
    }, [initialImageFile]);

    useEffect(() => {
        // Enforce constraints for multi-image
        if (imageFiles.length > 1) {
            if (resolution !== '720p') setResolution('720p');
            if (aspectRatio !== '16:9') setAspectRatio('16:9');
            // If multiple images are used, we must use the Pro model (veo-3.1-generate-preview)
            const currentOption = modelOptions.find(o => o.id === selectedOptionId);
            if (currentOption?.model !== 'veo-3.1-generate-preview') {
                setSelectedOptionId(currentOption?.includeAudio ? 'veo-3.1-pro-audio' : 'veo-3.1-pro');
            }
        }
    }, [imageFiles.length, resolution, aspectRatio, selectedOptionId]);

    useEffect(() => {
        return () => {
            imagePreviews.forEach(url => URL.revokeObjectURL(url));
        };
    }, [imagePreviews]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const newFiles = Array.from(e.target.files) as File[];
            setImageFiles(prev => [...prev, ...newFiles]);
            
            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setImagePreviews(prev => [...prev, ...newPreviews]);
        }
    };

    const handleRemoveImage = (index: number) => {
        const newFiles = [...imageFiles];
        newFiles.splice(index, 1);
        setImageFiles(newFiles);
        const newPreviews = [...imagePreviews];
        URL.revokeObjectURL(newPreviews[index]);
        newPreviews.splice(index, 1);
        setImagePreviews(newPreviews);
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        setStatus('generating');
        setError(null);
        setVideoUrl(null);
        setOperation(null);

        const selectedOption = modelOptions.find(o => o.id === selectedOptionId) || modelOptions[2];

        try {
            const result = await generateVideo(
                prompt,
                imageFiles,
                aspectRatio,
                selectedOption.model,
                resolution,
                (s) => setStatus(s),
                selectedOption.includeAudio
            );

            setVideoUrl(result.videoUrl);
            setOperation(result.operation);
            setStatus('done');

        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to generate video");
            setStatus('error');
        }
    };

    const handleExtend = async () => {
        if (!operation || !extendPrompt.trim()) return;
        setIsExtending(true);
        setStatus('generating');
        
        try {
             // Ensure resolution is 720p for extension as per API requirements
             if (resolution !== '720p') {
                 throw new Error("Only 720p videos can be extended.");
             }

             const result = await extendVideo(
                 operation,
                 extendPrompt,
                 aspectRatio,
                 (s) => setStatus(s)
             );
             
            setVideoUrl(result.videoUrl);
            setOperation(result.operation);
            setStatus('done');
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to extend video");
            setStatus('error');
        } finally {
            setIsExtending(false);
        }
    };

    const handleEnhanceClick = async () => {
        if (!prompt || isEnhancing) return;
        setIsEnhancing(true);
        try {
            const enhanced = await onEnhancePrompt(prompt);
            setPrompt(enhanced);
        } catch (e) {
            console.error(e);
        } finally {
            setIsEnhancing(false);
        }
    };

    const currentOption = modelOptions.find(o => o.id === selectedOptionId);

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6 animate-fade-in p-4 h-full overflow-y-auto">
            <button onClick={onBack} data-tooltip={t('tooltip.back')} className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors dark:text-gray-400 dark:hover:text-white">
                <UndoIcon className="w-5 h-5" />
            </button>
            
            <div className="text-center mt-12 mb-4">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{t('videoGenerator.title')}</h1>
                <p className="text-gray-600 mt-2 max-w-2xl dark:text-gray-300">{t('videoGenerator.subtitle')}</p>
            </div>

            <div className="w-full bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-6 dark:bg-gray-800 dark:border-gray-700">
                
                {/* Inputs */}
                <div className="flex flex-col gap-4">
                    <div className="relative">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={t('videoGenerator.placeholder')}
                            className="form-textarea pr-10 min-h-[100px]"
                            disabled={status === 'generating' || status === 'processing' || status === 'downloading'}
                        />
                        <button
                            type="button"
                            onClick={handleEnhanceClick}
                            disabled={isEnhancing || !prompt}
                            className="absolute top-2 right-2 p-1 rounded-full text-purple-600 hover:bg-purple-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:text-purple-400 dark:hover:bg-purple-900/30"
                            data-tooltip={t('tooltip.enhancePrompt')}
                        >
                            {isEnhancing ? <Spinner className="!h-5 !w-5 !mx-0" /> : <StarsIcon className="w-5 h-5" />}
                        </button>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-gray-300">{t('videoGenerator.imageInputLabel')}</label>
                            <div className="flex flex-wrap gap-4">
                                {imagePreviews.map((src, index) => (
                                    <div key={index} className="relative w-24 h-24 rounded-lg overflow-hidden border border-gray-300">
                                        <img src={src} alt="Preview" className="w-full h-full object-cover" />
                                        <button 
                                            onClick={() => handleRemoveImage(index)}
                                            className="absolute top-0 right-0 bg-red-500 text-white p-1 rounded-bl-lg hover:bg-red-600"
                                        >
                                            <TrashIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                                <label className="w-24 h-24 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors dark:border-gray-600 dark:hover:bg-gray-700">
                                    <UploadIcon className="w-6 h-6 text-gray-400" />
                                    <span className="text-xs text-gray-500 mt-1 dark:text-gray-400">Upload</span>
                                    <input type="file" className="hidden" onChange={handleFileChange} accept="image/*" multiple />
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Settings Grid */}
                    <div className="grid grid-cols-1 gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100 dark:bg-gray-700/50 dark:border-gray-600">
                        <div className="flex flex-col gap-4">
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-1">
                                    <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400">Model Capability</label>
                                    {currentOption && (
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentOption.includeAudio ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                                            {currentOption.includeAudio ? 'Audio: ON' : 'Audio: OFF'}
                                        </span>
                                    )}
                                </div>
                                <select 
                                    value={selectedOptionId} 
                                    onChange={(e) => setSelectedOptionId(e.target.value)} 
                                    className="form-select text-sm py-2"
                                    disabled={status !== 'idle' && status !== 'done' && status !== 'error'}
                                >
                                    {modelOptions.map(option => (
                                        <option key={option.id} value={option.id}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1 dark:text-gray-400">Resolution</label>
                                <select 
                                    value={resolution} 
                                    onChange={(e) => setResolution(e.target.value as VideoResolution)} 
                                    className="form-select text-sm py-2"
                                    disabled={status !== 'idle' && status !== 'done' && status !== 'error' || imageFiles.length > 1}
                                >
                                    <option value="720p">720p (HD)</option>
                                    <option value="1080p">1080p (FHD)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-gray-500 mb-1 dark:text-gray-400">Aspect Ratio</label>
                                <select 
                                    value={aspectRatio} 
                                    onChange={(e) => setAspectRatio(e.target.value as VideoAspectRatio)} 
                                    className="form-select text-sm py-2"
                                    disabled={status !== 'idle' && status !== 'done' && status !== 'error' || imageFiles.length > 1}
                                >
                                    <option value="16:9">16:9 (Landscape)</option>
                                    <option value="9:16">9:16 (Portrait)</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    {imageFiles.length > 1 && (
                        <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-100">
                            Note: Multi-image generation requires Veo 3.1 Pro tier models, 720p resolution, and 16:9 aspect ratio. Settings have been adjusted.
                        </p>
                    )}
                </div>

                {/* Generate Button */}
                <button
                    onClick={handleGenerate}
                    disabled={status === 'generating' || status === 'processing' || status === 'downloading' || !prompt.trim()}
                    className="btn btn-primary w-full py-3 text-lg"
                >
                    {status === 'generating' || status === 'processing' || status === 'downloading' ? (
                        <div className="flex items-center gap-2">
                            <Spinner className="!h-5 !w-5 !mx-0 text-white" />
                            <span>
                                {status === 'generating' && t('videoGenerator.status_generating')}
                                {status === 'processing' && t('videoGenerator.status_processing')}
                                {status === 'downloading' && t('videoGenerator.status_downloading')}
                            </span>
                        </div>
                    ) : (
                        <>
                            <VideoIcon className="w-6 h-6" />
                            {t('videoGenerator.generateButton')}
                        </>
                    )}
                </button>

                {error && (
                    <div className="p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
                        {error}
                    </div>
                )}

                {/* Result */}
                {videoUrl && (
                    <div className="mt-6 flex flex-col gap-4 animate-fade-in">
                        <video controls src={videoUrl} className="w-full rounded-lg shadow-lg bg-black aspect-video" />
                        <div className="flex justify-center">
                            <a href={videoUrl} download="generated-video.mp4" className="btn btn-secondary">
                                {t('videoGenerator.download')}
                            </a>
                        </div>

                        {/* Extend Video Section */}
                        <div className="mt-8 p-4 border-t border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-800 mb-2 dark:text-white">{t('videoGenerator.extendTitle')}</h3>
                            
                            {resolution === '720p' ? (
                                <>
                                    <div className="flex gap-2">
                                        <input 
                                            type="text" 
                                            value={extendPrompt}
                                            onChange={(e) => setExtendPrompt(e.target.value)}
                                            placeholder={t('videoGenerator.extendPromptPlaceholder')}
                                            className="form-input"
                                            disabled={isExtending}
                                        />
                                        <button 
                                            onClick={handleExtend} 
                                            disabled={isExtending || !extendPrompt.trim()}
                                            className="btn btn-primary whitespace-nowrap"
                                        >
                                            {isExtending ? <Spinner className="!h-4 !w-4 !mx-0" /> : t('videoGenerator.extendButton')}
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">{t('videoGenerator.extendWarning')}</p>
                                </>
                            ) : (
                                <div className="p-3 bg-amber-50 text-amber-800 rounded-md text-sm border border-amber-200">
                                    Extension is only available for 720p videos. You generated this video in 1080p.
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VideoGenerator;