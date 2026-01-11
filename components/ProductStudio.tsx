/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { removeBackground, generateProductScene, dataURLtoFile } from '../services/geminiService';
import { UndoIcon, UploadIcon, StarsIcon } from './icons';
import Spinner from './Spinner';
import { AspectRatio } from '../types';
import GenerationSettings from './GenerationSettings';

interface ProductStudioProps {
    onBackToHub: () => void;
    onProductSelect: (file: File) => void;
    onEnhancePrompt: (prompt: string) => Promise<string>;
}

type Step = 'upload' | 'bg-removal' | 'backdrop' | 'generating' | 'results';

const ProductStudio: React.FC<ProductStudioProps> = ({ onBackToHub, onProductSelect, onEnhancePrompt }) => {
    const { t } = useLanguage();

    const [step, setStep] = useState<Step>('upload');
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [originalFile, setOriginalFile] = useState<File | null>(null);
    const [productWithTransparentBg, setProductWithTransparentBg] = useState<string | null>(null);
    const [backgroundPrompt, setBackgroundPrompt] = useState('');
    const [generatedImages, setGeneratedImages] = useState<string[]>([]);
    const [isDraggingOver, setIsDraggingOver] = useState(false);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
    const [model, setModel] = useState<string>('gemini-3-pro-image-preview');

    const handleFileSelect = useCallback((file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            setOriginalFile(file);
            setStep('bg-removal');
            setError(null);
        }
    }, []);

    useEffect(() => {
        if (step === 'bg-removal' && originalFile) {
            const process = async () => {
                setLoadingMessage(t('productStudio.loading_bg_removal'));
                try {
                    const resultDataUrl = await removeBackground(originalFile);
                    setProductWithTransparentBg(resultDataUrl);
                    setStep('backdrop');
                } catch (err) {
                    setError(t('app.errorFailedToRemoveBackground'));
                    setStep('upload');
                }
            };
            process();
        }
    }, [step, originalFile, t]);

    const handleGenerate = async () => {
        if (!productWithTransparentBg || !backgroundPrompt.trim()) return;

        setStep('generating');
        setError(null);
        setLoadingMessage(t('productStudio.loading_generating'));

        try {
            const productFile = dataURLtoFile(productWithTransparentBg, 'product.png');
            const results = await generateProductScene(productFile, backgroundPrompt, aspectRatio, model);
            setGeneratedImages(results);
            setStep('results');
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(t('app.errorFailedToGenerateProductPhotos', { errorMessage }));
            setStep('backdrop');
        }
    };

    const handleStartOver = () => {
        setStep('upload');
        setError(null);
        setOriginalFile(null);
        setProductWithTransparentBg(null);
        setBackgroundPrompt('');
        setGeneratedImages([]);
    };

    const handlePresetClick = (preset: string) => {
        setBackgroundPrompt(preset);
    }

    const handleEnhanceClick = async () => {
        if (!backgroundPrompt || isEnhancing || step !== 'backdrop') return;
        setIsEnhancing(true);
        const enhancedPrompt = await onEnhancePrompt(backgroundPrompt);
        setBackgroundPrompt(enhancedPrompt);
        setIsEnhancing(false);
    };

    const renderUploadStep = () => (
        <div 
            className={`w-full max-w-2xl h-80 flex flex-col items-center justify-center text-center p-8 transition-all duration-300 rounded-lg border-2 border-dashed ${isDraggingOver ? 'border-blue-500 bg-blue-50' : 'border-gray-300'} dark:bg-gray-800 dark:border-gray-600`}
            onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
            onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
            onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); }}
            onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsDraggingOver(false);
                handleFileSelect(e.dataTransfer.files?.[0] || null);
            }}
        >
            <UploadIcon className="w-12 h-12 text-gray-400 mb-4" />
            <label htmlFor="product-upload" className="font-semibold text-blue-600 cursor-pointer hover:underline text-lg">{t('productStudio.upload_cta')}</label>
            <p className="text-gray-500 mt-1 text-sm">{t('startScreen.dragDrop')}</p>
            <input id="product-upload" type="file" className="hidden" accept="image/*" onChange={(e) => handleFileSelect(e.target.files?.[0] || null)} />
        </div>
    );
    
    const renderLoadingStep = () => (
        <div className="flex flex-col items-center justify-center h-80">
            <Spinner />
            <p className="mt-4 text-gray-600 dark:text-gray-300">{loadingMessage}</p>
        </div>
    );

    const renderBackdropStep = () => (
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="bg-gray-100 rounded-lg p-4 checkerboard-bg flex items-center justify-center aspect-square dark:bg-gray-800">
                {productWithTransparentBg && <img src={productWithTransparentBg} alt="Product" className="max-w-full max-h-full object-contain"/>}
            </div>
            <div className="flex flex-col gap-4">
                <h3 className="text-2xl font-bold text-gray-800 dark:text-white">{t('productStudio.step2_title')}</h3>
                <p className="text-gray-600 -mt-2 dark:text-gray-300">{t('productStudio.step2_subtitle')}</p>
                <div className="relative w-full">
                     <textarea
                        value={backgroundPrompt}
                        onChange={(e) => setBackgroundPrompt(e.target.value)}
                        placeholder={t('productStudio.placeholder')}
                        className="form-textarea pr-12"
                        rows={4}
                        disabled={isEnhancing}
                    />
                    <button
                      type="button"
                      onClick={handleEnhanceClick}
                      disabled={isEnhancing || !backgroundPrompt}
                      className="absolute top-3 right-3 p-1 rounded-full text-purple-600 hover:bg-purple-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:text-purple-400 dark:hover:bg-purple-900/30"
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
                    compact={true}
                />

                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => handlePresetClick("on a white marble surface next to a green plant")} className="text-xs text-center bg-gray-100 border border-gray-300 text-gray-700 font-medium py-2 px-2 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600">{t('productStudio.preset_marble')}</button>
                    <button onClick={() => handlePresetClick("on a rustic wooden table with warm lighting")} className="text-xs text-center bg-gray-100 border border-gray-300 text-gray-700 font-medium py-2 px-2 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600">{t('productStudio.preset_wood')}</button>
                    <button onClick={() => handlePresetClick("on a minimalist concrete podium with harsh shadows")} className="text-xs text-center bg-gray-100 border border-gray-300 text-gray-700 font-medium py-2 px-2 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600">{t('productStudio.preset_concrete')}</button>
                    <button onClick={() => handlePresetClick("with a clean, studio-style blue-to-purple gradient background")} className="text-xs text-center bg-gray-100 border border-gray-300 text-gray-700 font-medium py-2 px-2 rounded-md hover:bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-600">{t('productStudio.preset_gradient')}</button>
                </div>
                <button onClick={handleGenerate} disabled={!backgroundPrompt.trim()} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors hover:bg-blue-700 disabled:bg-blue-300">
                    <StarsIcon className="w-5 h-5" />
                    {t('productStudio.generate')}
                </button>
            </div>
        </div>
    );
    
    const renderResultsStep = () => (
        <div className="w-full max-w-4xl">
            <div className="text-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800 dark:text-white">{t('productStudio.results_title')}</h2>
                <p className="text-gray-600 mt-1 dark:text-gray-300">{t('productStudio.results_subtitle')}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedImages.map((url, index) => (
                    <div key={index} className="group relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                        <img src={url} alt={`Generated product shot ${index + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <button onClick={() => onProductSelect(dataURLtoFile(url, `product-${Date.now()}.png`))} className="text-white bg-blue-600 hover:bg-blue-700 py-2 px-4 rounded-lg text-sm font-bold">
                                {t('productStudio.edit_in_editor')}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <div className="text-center mt-8">
                <button onClick={handleStartOver} className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-6 rounded-md transition-colors dark:bg-gray-700 dark:hover:bg-gray-600">{t('productStudio.start_over')}</button>
            </div>
        </div>
    );

    const renderContent = () => {
        if (error) {
             return (
                <div className="text-center animate-fade-in bg-red-100 border border-red-300 p-6 rounded-lg max-w-xl mx-auto flex flex-col items-center gap-3">
                    <h2 className="text-xl font-bold text-red-800">{t('app.errorTitle')}</h2>
                    <p className="text-sm text-red-700">{error}</p>
                    <button onClick={handleStartOver} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">{t('app.tryAgain')}</button>
                </div>
            );
        }
        
        switch (step) {
            case 'upload': return renderUploadStep();
            case 'bg-removal':
            case 'generating': return renderLoadingStep();
            case 'backdrop': return renderBackdropStep();
            case 'results': return renderResultsStep();
            default: return renderUploadStep();
        }
    };


    return (
        <div className="w-full mx-auto flex flex-col items-center gap-6 animate-fade-in p-4">
            <button onClick={onBackToHub} data-tooltip={t('tooltip.back')} className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors dark:text-gray-400 dark:hover:text-white">
                <UndoIcon className="w-5 h-5" />
            </button>
            <div className="text-center mt-12">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{t('productStudio.title')}</h1>
                <p className="text-gray-600 mt-2 max-w-2xl dark:text-gray-300">{t('productStudio.subtitle')}</p>
            </div>
            <div className="w-full flex-grow flex items-center justify-center mt-4">
                {renderContent()}
            </div>
        </div>
    );
};

export default ProductStudio;