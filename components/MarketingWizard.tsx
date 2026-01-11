/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
// Fix: Import types from types.ts and functions from the service file separately.
import { generateAdCopy, generateImagesFromPrompt, dataURLtoFile } from '../services/geminiService';
import { AspectRatio, ImageModel } from '../types';
import { UndoIcon, BriefcaseIcon } from './icons';
import Spinner from './Spinner';
import { TranslationKey } from '../translations';

interface MarketingWizardProps {
    onBackToHub: () => void;
    onCreativeSelect: (file: File) => void;
}

type Step = 1 | 2 | 'loading' | 'results';
type Tone = 'Friendly' | 'Professional' | 'Playful' | 'Luxury';
type Platform = '1:1' | '9:16' | '16:9';
interface Creative {
    headline: string;
    body: string;
    imageUrl: string;
}

const MarketingWizard: React.FC<MarketingWizardProps> = ({ onBackToHub, onCreativeSelect }) => {
    const { t } = useLanguage();

    const [step, setStep] = useState<Step>(1);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('');

    // Step 1 State
    const [productInfo, setProductInfo] = useState({
        name: '',
        description: '',
        benefits: '',
        audience: '',
        cta: '',
    });

    // Step 2 State
    const [styleInfo, setStyleInfo] = useState({
        tone: 'Friendly' as Tone,
        platform: '1:1' as Platform,
    });
    const [model, setModel] = useState<string>('gemini-3-pro-image-preview');

    // Results State
    const [generatedCreatives, setGeneratedCreatives] = useState<Creative[]>([]);

    const handleProductInfoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProductInfo(prev => ({ ...prev, [name]: value }));
    };

    const handleStyleInfoChange = (field: keyof typeof styleInfo, value: Tone | Platform) => {
        setStyleInfo(prev => ({ ...prev, [field]: value }));
    };

    // FIX: Add type check for 'field' before calling .trim() because Object.values returns unknown[].
    const isStep1Valid = Object.values(productInfo).every(field => typeof field === 'string' && field.trim() !== '');

    const handleGenerate = useCallback(async () => {
        setStep('loading');
        setError(null);
        
        try {
            setLoadingMessage(t('marketing.loading_text'));
            const adCopies = await generateAdCopy({ ...productInfo, tone: styleInfo.tone });

            if (!adCopies || adCopies.length === 0) {
                throw new Error("The AI failed to generate ad copy.");
            }

            setLoadingMessage(t('marketing.loading_visuals'));
            // Fix: The `styleInfo.platform` type is compatible with the expected `AspectRatio` type.
            const imagePromises = adCopies.map(copy => 
                generateImagesFromPrompt(copy.imagePrompt, 1, styleInfo.platform as AspectRatio, model as ImageModel)
            );
            const generatedImageSets = await Promise.all(imagePromises);

            setLoadingMessage(t('marketing.loading_assembly'));
            const creatives: Creative[] = adCopies.map((copy, index) => ({
                headline: copy.headline,
                body: copy.body,
                imageUrl: generatedImageSets[index][0], 
            }));

            setGeneratedCreatives(creatives);
            setStep('results');

        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
            setError(t('app.errorFailedToGenerateAdCopy', { errorMessage }));
            setStep(2); // Go back to the form on error
        }
    }, [productInfo, styleInfo, model, t]);
    
    const renderCreativeToFile = async (creative: Creative, platform: Platform): Promise<File> => {
        const canvas = document.createElement('canvas');
        const aspectRatioValue = platform === '1:1' ? 1 : platform === '9:16' ? 9/16 : 16/9;
        canvas.width = 1080;
        canvas.height = Math.round(canvas.width / aspectRatioValue);
        
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Could not create canvas context.");

        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = (e) => reject(new Error(`Image load error: ${e}`));
            img.src = creative.imageUrl;
        });
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const padding = canvas.width * 0.05;
        const maxTextWidth = canvas.width - (padding * 2);
        
        const headlineSize = Math.max(24, Math.round(canvas.height * 0.06));
        const bodySize = Math.max(16, Math.round(canvas.height * 0.035));

        ctx.font = `bold ${headlineSize}px Inter, sans-serif`;
        const headlineLines = wrapText(ctx, creative.headline, maxTextWidth);
        
        ctx.font = `${bodySize}px Inter, sans-serif`;
        const bodyLines = wrapText(ctx, creative.body, maxTextWidth);

        const totalTextHeight = (headlineLines.length * headlineSize * 1.2) + (bodyLines.length * bodySize * 1.2) + (padding * 2);
        const boxY = canvas.height - totalTextHeight - (padding * 1.5);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, boxY, canvas.width, totalTextHeight + (padding * 1.5));
        
        ctx.fillStyle = 'white';
        ctx.textAlign = 'center';
        
        let currentY = boxY + padding + headlineSize;
        ctx.font = `bold ${headlineSize}px Inter, sans-serif`;
        headlineLines.forEach(line => {
            ctx.fillText(line, canvas.width / 2, currentY);
            currentY += headlineSize * 1.2;
        });

        currentY += padding * 0.5;
        ctx.font = `${bodySize}px Inter, sans-serif`;
        bodyLines.forEach(line => {
            ctx.fillText(line, canvas.width / 2, currentY);
            currentY += bodySize * 1.2;
        });

        const dataUrl = canvas.toDataURL('image/png');
        return dataURLtoFile(dataUrl, `creative-${Date.now()}.png`);
    };

    const wrapText = (context: CanvasRenderingContext2D, text: string, maxWidth: number): string[] => {
        const words = text.split(' ');
        const lines: string[] = [];
        if (!words.length) return [];
        let currentLine = words[0];

        for (let i = 1; i < words.length; i++) {
            const word = words[i];
            const width = context.measureText(currentLine + " " + word).width;
            if (width < maxWidth) {
                currentLine += " " + word;
            } else {
                lines.push(currentLine);
                currentLine = word;
            }
        }
        lines.push(currentLine);
        return lines;
    };

    const handleEditInEditor = async (creative: Creative) => {
        try {
            const file = await renderCreativeToFile(creative, styleInfo.platform);
            onCreativeSelect(file);
        } catch (e) {
            setError('Failed to prepare creative for editor.');
            console.error(e);
        }
    };
    
    const handleStartOver = () => {
        setProductInfo({ name: '', description: '', benefits: '', audience: '', cta: '' });
        setStyleInfo({ tone: 'Friendly', platform: '1:1' });
        setGeneratedCreatives([]);
        setError(null);
        setStep(1);
    };

    const renderContent = () => {
        if (error) {
            return (
                <div className="text-center animate-fade-in bg-red-100 border border-red-300 p-6 rounded-lg max-w-xl mx-auto flex flex-col items-center gap-3">
                    <h2 className="text-xl font-bold text-red-800">{t('app.errorTitle')}</h2>
                    <p className="text-sm text-red-700">{error}</p>
                    <button onClick={() => setError(null)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition-colors">{t('app.tryAgain')}</button>
                </div>
            );
        }

        switch (step) {
            case 1:
                return (
                    <div className="w-full max-w-2xl bg-white p-8 rounded-lg border border-gray-200 flex flex-col gap-6 animate-fade-in">
                        <h2 className="text-xl font-bold text-gray-800">{t('marketing.step1_title')}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('marketing.productName')}</label>
                                <input type="text" name="name" value={productInfo.name} onChange={handleProductInfoChange} placeholder={t('marketing.productName_placeholder')} className="form-input" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{t('marketing.cta')}</label>
                                <input type="text" name="cta" value={productInfo.cta} onChange={handleProductInfoChange} placeholder={t('marketing.cta_placeholder')} className="form-input" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('marketing.productDesc')}</label>
                            <textarea name="description" value={productInfo.description} onChange={handleProductInfoChange} placeholder={t('marketing.productDesc_placeholder')} rows={3} className="form-textarea" />
                        </div>
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('marketing.keyBenefits')}</label>
                            <textarea name="benefits" value={productInfo.benefits} onChange={handleProductInfoChange} placeholder={t('marketing.keyBenefits_placeholder')} rows={3} className="form-textarea" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">{t('marketing.targetAudience')}</label>
                            <input type="text" name="audience" value={productInfo.audience} onChange={handleProductInfoChange} placeholder={t('marketing.targetAudience_placeholder')} className="form-input" />
                        </div>
                        <button onClick={() => setStep(2)} disabled={!isStep1Valid} className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors hover:bg-blue-700 active:scale-95 disabled:bg-blue-300 disabled:cursor-not-allowed">
                            {t('marketing.nextButton')}
                        </button>
                    </div>
                );
            case 2:
                return (
                    <div className="w-full max-w-2xl bg-white p-8 rounded-lg border border-gray-200 flex flex-col gap-6 animate-fade-in">
                        <h2 className="text-xl font-bold text-gray-800">{t('marketing.step2_title')}</h2>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('marketing.tone')}</label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                {(['Friendly', 'Professional', 'Playful', 'Luxury'] as Tone[]).map(tone => (
                                    <button key={tone} onClick={() => handleStyleInfoChange('tone', tone)} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${styleInfo.tone === tone ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>{t(`marketing.tone_${tone.toLowerCase()}` as TranslationKey)}</button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">{t('marketing.platform')}</label>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => handleStyleInfoChange('platform', '1:1')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${styleInfo.platform === '1:1' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>{t('marketing.platform_square')}</button>
                                <button onClick={() => handleStyleInfoChange('platform', '9:16')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${styleInfo.platform === '9:16' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>{t('marketing.platform_portrait')}</button>
                                <button onClick={() => handleStyleInfoChange('platform', '16:9')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${styleInfo.platform === '16:9' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}>{t('marketing.platform_landscape')}</button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Model</label>
                            <select 
                                value={model} 
                                onChange={(e) => setModel(e.target.value)} 
                                className="form-select text-sm py-2"
                            >
                                <option value="gemini-3-pro-image-preview">Nano Banana Pro (Quality)</option>
                                <option value="gemini-2.5-flash-image">Nano Banana (Speed)</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2 mt-4">
                            <button onClick={() => setStep(1)} className="w-full bg-gray-200 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors hover:bg-gray-300 active:scale-95">{t('marketing.backButton')}</button>
                            <button onClick={handleGenerate} className="w-full bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors hover:bg-blue-700 active:scale-95">{t('marketing.generateButton')}</button>
                        </div>
                    </div>
                );
            case 'loading':
                return (
                    <div className="text-center">
                        <Spinner />
                        <p className="mt-4 text-gray-500">{loadingMessage}</p>
                    </div>
                );
            case 'results':
                return (
                     <div className="w-full max-w-6xl animate-fade-in">
                        <div className="text-center mb-6">
                            <h2 className="text-3xl font-bold text-gray-800">{t('marketing.results_title')}</h2>
                            <p className="text-gray-600 mt-1">{t('marketing.results_subtitle')}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {generatedCreatives.map((creative, index) => (
                                <div key={index} className="bg-white border border-gray-200 rounded-lg overflow-hidden flex flex-col shadow-sm hover:shadow-lg transition-shadow">
                                    <div className="relative aspect-square">
                                        <img src={creative.imageUrl} alt={`Creative ${index + 1}`} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="p-4 flex flex-col gap-2 flex-grow">
                                        <h3 className="font-bold text-gray-800">{creative.headline}</h3>
                                        <p className="text-sm text-gray-600 flex-grow">{creative.body}</p>
                                        <button onClick={() => handleEditInEditor(creative)} className="w-full mt-2 bg-blue-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm">{t('marketing.editButton')}</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                         <div className="text-center mt-8">
                            <button onClick={handleStartOver} className="bg-gray-800 hover:bg-gray-900 text-white font-semibold py-2 px-6 rounded-md transition-colors">{t('generator.startOver')}</button>
                        </div>
                    </div>
                );
        }
    }

    return (
        <div className="w-full mx-auto flex flex-col items-center gap-6 animate-fade-in p-4">
            <button onClick={onBackToHub} data-tooltip={t('tooltip.back')} className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors">
                <UndoIcon className="w-5 h-5" />
            </button>
            <div className="text-center mt-12">
                <div className="inline-flex items-center justify-center gap-3 bg-purple-100 text-purple-700 py-2 px-4 rounded-full mb-2">
                    <BriefcaseIcon className="w-5 h-5" />
                    <span className="font-bold text-sm">{t('marketing.title')}</span>
                </div>
                <p className="text-gray-600 mt-1 max-w-2xl">{t('marketing.subtitle')}</p>
            </div>
            <div className="w-full flex-grow flex items-center justify-center">
                 {renderContent()}
            </div>
        </div>
    );
};

export default MarketingWizard;