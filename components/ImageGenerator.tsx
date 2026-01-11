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
        <div className="w-full max-w-4xl mx-auto flex flex-col items-center gap-6 animate-fade-in p-4 h-full overflow-y-auto">
            <button onClick={onBack} className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors">
                <UndoIcon className="w-5 h-5" />
            </button>
            <div className="text-center mt-12 mb-4">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{t('generator.title')}</h1>
                <p className="text-gray-600 mt-2 max-w-2xl dark:text-gray-300">{t('generator.subtitle')}</p>
            </div>

            <div className="w-full bg-white border border-gray-200 rounded-lg p-6 flex flex-col gap-6 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex flex-col gap-4">
                    <div className="relative">
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder={t('generator.placeholder')}
                            className="form-textarea pr-10 min-h-[100px]"
                            disabled={isLoading}
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

                    <GenerationSettings
                        model={model}
                        setModel={setModel}
                        aspectRatio={aspectRatio}
                        setAspectRatio={setAspectRatio}
                        disabled={isLoading}
                    />

                    <div>
                        <label className="block text-xs font-medium text-gray-500 mb-1 dark:text-gray-400">{t('generator.numImages')}</label>
                        <div className="flex bg-gray-100 rounded-md p-0.5 dark:bg-gray-700">
                            {[1, 2, 4].map(num => (
                                <button
                                    key={num}
                                    onClick={() => setNumImages(num)}
                                    disabled={isLoading}
                                    className={`flex-1 text-center text-xs font-bold py-2 rounded transition-colors ${numImages === num ? 'bg-white shadow-sm text-gray-800 dark:bg-gray-600 dark:text-white' : 'text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-600'}`}
                                >
                                    {num === 1 ? t('generator.numImages1') : num === 2 ? t('generator.numImages2') : t('generator.numImages4')}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={isLoading || !prompt.trim()}
                    className="btn btn-primary w-full py-3 text-lg"
                >
                    {isLoading ? (
                        <div className="flex items-center gap-2">
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

                {error && (
                    <div className="p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
                        {error}
                    </div>
                )}

                {generatedImages.length > 0 && (
                    <div className="mt-6 flex flex-col gap-4 animate-fade-in">
                        <div className={`grid gap-4 ${generatedImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                            {generatedImages.map((img, index) => (
                                <div key={index} className="group relative rounded-lg overflow-hidden border border-gray-200 shadow-sm dark:border-gray-700">
                                    <img src={img.url} alt={`Generated ${index}`} className="w-full h-auto object-contain bg-gray-100 dark:bg-gray-900" />
                                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                        <button onClick={() => onImageSelect(img.file)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-blue-700 transition-colors">
                                            {t('generator.editInEditor')}
                                        </button>
                                        <a href={img.url} download={`generated-${index}.png`} className="bg-gray-700 text-white px-4 py-2 rounded-lg font-bold hover:bg-gray-800 transition-colors">
                                            {t('generator.download')}
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Text Generation Section */}
                        <div className="mt-8 border-t border-gray-200 pt-6 dark:border-gray-700">
                            <h3 className="text-lg font-bold text-gray-800 mb-2 dark:text-white">{t('generator.textTitle')}</h3>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={textPrompt}
                                    onChange={(e) => setTextPrompt(e.target.value)}
                                    placeholder={t('generator.textPlaceholder')}
                                    className="form-input"
                                    disabled={isGeneratingText}
                                />
                                <button
                                    onClick={handleGenerateText}
                                    disabled={isGeneratingText || !textPrompt.trim()}
                                    className="btn btn-secondary whitespace-nowrap"
                                >
                                    {isGeneratingText ? <Spinner className="!h-4 !w-4 !mx-0" /> : t('generator.textGenerateButton')}
                                </button>
                            </div>
                            {textError && <p className="text-red-500 text-sm mt-2">{textError}</p>}
                            {generatedText && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 dark:bg-gray-700 dark:border-gray-600">
                                    <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{generatedText}</p>
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