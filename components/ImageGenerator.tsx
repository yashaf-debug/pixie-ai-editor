/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { generateImagesFromPrompt, generateTextFromPrompt, dataURLtoFile } from '../services/geminiService';
import { AspectRatio, ImageModel } from '../types';
import { StarsIcon, UndoIcon } from './icons';
import Spinner from './Spinner';
import GenerationSettings from './GenerationSettings';

interface ImageGeneratorProps {
    onBack: () => void;
    onImageSelect: (file: File) => void;
    onEnhancePrompt: (prompt: string) => Promise<string>;
    initialPrompt?: string;
}

interface GeneratedImage {
    url: string;
    file: File;
}

const ImageGenerator: React.FC<ImageGeneratorProps> = ({ onBack, onImageSelect, onEnhancePrompt, initialPrompt }) => {
    const { t } = useLanguage();
    const [prompt, setPrompt] = useState(initialPrompt || '');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [numImages, setNumImages] = useState(1);
    const [model, setModel] = useState<string>('gemini-3-pro-image-preview');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);
    const [isEnhancing, setIsEnhancing] = useState(false);

    // State for text generation
    const [textPrompt, setTextPrompt] = useState('');
    const [isGeneratingText, setIsGeneratingText] = useState(false);
    const [textError, setTextError] = useState<string | null>(null);
    const [generatedText, setGeneratedText] = useState<string | null>(null);

    const handleGenerate = async () => {
        if (!prompt.trim()) return;

        setIsLoading(true);
        setError(null);
        setGeneratedImages([]);
        setGeneratedText(null);
        setTextError(null);

        try {
            const imageUrls = await generateImagesFromPrompt(prompt, numImages, aspectRatio, model as ImageModel);
            const imageFiles = imageUrls.map((url, i) => ({
                url,
                file: dataURLtoFile(url, `generated-${Date.now()}-${i}.png`),
            }));
            setGeneratedImages(imageFiles);
            setTextPrompt(t('generator.textPlaceholder')); // Pre-fill text prompt
        } catch (err) {
            let displayError: string;
            if (err instanceof Error) {
                const lowerCaseMessage = err.message.toLowerCase();
                if (lowerCaseMessage.includes('resource_exhausted') || lowerCaseMessage.includes('quota')) {
                    displayError = t('app.errorQuotaExceeded');
                } else {
                    displayError = t('app.errorFailedToGenerateAiImage', { errorMessage: err.message });
                }
            } else {
                displayError = t('app.errorFailedToGenerateAiImage', { errorMessage: 'An unknown error occurred.' });
            }
            setError(displayError);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateText = async () => {
        if (!textPrompt.trim() || !prompt.trim()) return;

        setIsGeneratingText(true);
        setTextError(null);
        setGeneratedText(null);
        try {
            const fullTextPrompt = `Based on an image described as "${prompt}", ${textPrompt}`;
            const result = await generateTextFromPrompt(fullTextPrompt);
            setGeneratedText(result);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setTextError(t('app.errorFailedToGenerateText', { errorMessage }));
        } finally {
            setIsGeneratingText(false);
        }
    };

    const handleEnhanceClick = async () => {
        if (!prompt || isEnhancing || isLoading) return;
        setIsEnhancing(true);
        try {
            const enhancedPrompt = await onEnhancePrompt(prompt);
            setPrompt(enhancedPrompt);
        } catch (e) {
            console.error(e);
        } finally {
            setIsEnhancing(false);
        }
    };

    return (
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-4 sm:gap-6 animate-fade-in p-3 sm:p-4 h-full overflow-y-auto pb-safe">
            {/* Back button */}
            <button
                onClick={onBack}
                className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-2 p-2.5 sm:p-2 rounded-lg text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
                <UndoIcon className="w-5 h-5" />
                <span className="hidden sm:inline text-sm font-medium">Back</span>
            </button>

            {/* Title */}
            <div className="text-center mt-14 sm:mt-12 mb-2 sm:mb-4 px-4">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">{t('generator.title')}</h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-2xl text-sm sm:text-base">{t('generator.subtitle')}</p>
            </div>

            {/* Main Form */}
            <div className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 shadow-sm">
                <div className="flex flex-col gap-4">
                    {/* Prompt textarea */}
                    <div className="relative">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={t('generator.placeholder')}
                            className="form-textarea pr-10 min-h-[80px] sm:min-h-[100px] text-sm sm:text-base"
                            disabled={isLoading}
                        />
                        <button
                            type="button"
                            onClick={handleEnhanceClick}
                            disabled={isEnhancing || !prompt}
                            className="absolute top-2 right-2 p-2 sm:p-1 rounded-full text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                            data-tooltip={t('tooltip.enhancePrompt')}
                        >
                            {isEnhancing ? <Spinner className="!h-5 !w-5 !mx-0" /> : <StarsIcon className="w-5 h-5" />}
                        </button>
                    </div>

                    {/* Generation Settings */}
                    <GenerationSettings
                        model={model}
                        setModel={setModel}
                        aspectRatio={aspectRatio}
                        setAspectRatio={setAspectRatio}
                        disabled={isLoading}
                    />

                    {/* Number of images */}
                    <div>
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">{t('generator.numImages')}</label>
                        <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                            {[1, 2, 4].map(num => (
                                <button
                                    key={num}
                                    onClick={() => setNumImages(num)}
                                    disabled={isLoading}
                                    className={`flex-1 text-center text-xs sm:text-sm font-bold py-2.5 sm:py-2 rounded-md transition-all ${numImages === num
                                            ? 'bg-white dark:bg-gray-600 shadow-sm text-gray-800 dark:text-white scale-105'
                                            : 'text-gray-500 dark:text-gray-400 hover:bg-gray-200/50 dark:hover:bg-gray-600/50'
                                        }`}
                                >
                                    {num === 1 ? t('generator.numImages1') : num === 2 ? t('generator.numImages2') : t('generator.numImages4')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Generate button */}
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt.trim()}
                    className="btn btn-primary w-full py-3.5 sm:py-3 text-base sm:text-lg h-auto"
                >
                    {isLoading ? (
                        <div className="flex items-center gap-2 justify-center">
                            <Spinner className="!h-5 !w-5 !mx-0 text-white" />
                            <span>{t('generator.generatingMessage')}</span>
                        </div>
                    ) : (
                        <>
                            <StarsIcon className="w-6 h-6" />
                            {t('generator.generateButton')}
                        </>
                    )}
                </button>

                {/* Error message */}
                {error && (
                    <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg border border-red-200 dark:border-red-800 text-sm">
                        {error}
                    </div>
                )}

                {/* Generated images */}
                {generatedImages.length > 0 && (
                    <div className="mt-4 sm:mt-6 flex flex-col gap-4 animate-fade-in">
                        <div className={`grid gap-3 sm:gap-4 ${generatedImages.length === 1 ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2'}`}>
                            {generatedImages.map((img, index) => (
                                <div key={index} className="group relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <img src={img.url} alt={`Generated ${index}`} className="w-full h-auto object-contain bg-gray-50 dark:bg-gray-900" />
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col sm:flex-row items-center justify-center gap-2 p-4">
                                        <button
                                            onClick={() => onImageSelect(img.file)}
                                            className="bg-indigo-600 text-white px-4 py-2.5 sm:py-2 rounded-lg font-semibold hover:bg-indigo-700 transition-colors w-full sm:w-auto text-sm"
                                        >
                                            {t('generator.editInEditor')}
                                        </button>
                                        <a
                                            href={img.url}
                                            download={`generated-${index}.png`}
                                            className="bg-gray-700 text-white px-4 py-2.5 sm:py-2 rounded-lg font-semibold hover:bg-gray-800 transition-colors w-full sm:w-auto text-center text-sm"
                                        >
                                            {t('generator.download')}
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Text Generation Section */}
                        <div className="mt-6 sm:mt-8 border-t border-gray-200 dark:border-gray-700 pt-4 sm:pt-6">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 dark:text-white mb-3 sm:mb-2">{t('generator.textTitle')}</h3>
                            <div className="flex flex-col sm:flex-row gap-2">
                                <input
                                    type="text"
                                    value={textPrompt}
                                    onChange={(e) => setTextPrompt(e.target.value)}
                                    placeholder={t('generator.textPlaceholder')}
                                    className="form-input text-sm sm:text-base"
                                    disabled={isGeneratingText}
                                />
                                <button
                                    onClick={handleGenerateText}
                                    disabled={isGeneratingText || !textPrompt.trim()}
                                    className="btn btn-secondary whitespace-nowrap h-11 sm:h-auto text-sm sm:text-base"
                                >
                                    {isGeneratingText ? <Spinner className="!h-4 !w-4 !mx-0" /> : t('generator.textGenerateButton')}
                                </button>
                            </div>
                            {textError && <p className="text-red-500 dark:text-red-400 text-sm mt-2">{textError}</p>}
                            {generatedText && (
                                <div className="mt-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap text-sm sm:text-base">{generatedText}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImageGenerator;