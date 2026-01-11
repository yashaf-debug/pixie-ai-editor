/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { performVirtualTryOn, dataURLtoFile } from '../services/geminiService';
import { UndoIcon, UploadIcon, StarsIcon, UserIcon, TrashIcon } from './icons';
import Spinner from './Spinner';
import { CREDIT_COSTS } from '../App';
import { TranslationKey } from '../translations';
import { AspectRatio } from '../types';

interface VirtualTryOnProps {
    onBack: () => void;
    onImageSelect: (file: File) => void;
    proActionGuard: (action: () => void, cost: number) => void;
}

interface ClothingItem {
    file: File;
    previewUrl: string;
    instruction: string;
}

const ImageUploader: React.FC<{
    title: string;
    description: string;
    onFileSelect: (file: File) => void;
    previewUrl: string | null;
    icon: React.ReactNode;
    compact?: boolean;
}> = ({ title, description, onFileSelect, previewUrl, icon, compact }) => {
    const [isDraggingOver, setIsDraggingOver] = useState(false);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onFileSelect(e.target.files[0]);
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDraggingOver(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            onFileSelect(e.dataTransfer.files[0]);
        }
    };

    return (
        <div className={`flex flex-col items-center gap-2 ${compact ? 'w-full' : ''}`}>
            {!compact && <h3 className="font-bold text-lg text-center dark:text-gray-200">{title}</h3>}
            <div
                className={`relative w-full rounded-lg shadow-sm border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center p-4 transition-all duration-200 ${isDraggingOver ? 'border-blue-500 ring-2 ring-blue-200' : 'hover:border-blue-400'} ${compact ? 'aspect-square' : 'min-h-[40vh] md:aspect-[9/16]'} dark:bg-gray-800 dark:border-gray-600`}
                onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); }}
                onDrop={handleDrop}
            >
                {previewUrl ? (
                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover rounded-md" />
                ) : (
                    <div className="text-center text-gray-500 dark:text-gray-400">
                        {icon}
                        {!compact && <p className="text-sm mt-2 font-semibold">{description}</p>}
                        {compact && <p className="text-xs mt-1">Add Item</p>}
                    </div>
                )}
                <input id={`upload-${title.replace(/\s/g, '-')}`} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                <label htmlFor={`upload-${title.replace(/\s/g, '-')}`} className="absolute inset-0 cursor-pointer"></label>
            </div>
        </div>
    );
};


const VirtualTryOn: React.FC<VirtualTryOnProps> = ({ onBack, onImageSelect, proActionGuard }) => {
    const { t } = useLanguage();
    const [userPhoto, setUserPhoto] = useState<File | null>(null);
    const [userPhotoPreview, setUserPhotoPreview] = useState<string | null>(null);
    const [modelDescription, setModelDescription] = useState('');

    const [clothingItems, setClothingItems] = useState<ClothingItem[]>([]);
    const [model, setModel] = useState<string>('gemini-3-pro-image-preview');
    const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');

    const [resultImage, setResultImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        return () => {
            if (userPhotoPreview) URL.revokeObjectURL(userPhotoPreview);
            clothingItems.forEach(item => URL.revokeObjectURL(item.previewUrl));
        };
    }, []);

    const handleUserPhotoSelect = (file: File) => {
        setUserPhoto(file);
        if (userPhotoPreview) URL.revokeObjectURL(userPhotoPreview);
        setUserPhotoPreview(URL.createObjectURL(file));
    };

    const handleClothingPhotoSelect = (file: File) => {
        if (clothingItems.length >= 5) {
            alert("You can add up to 5 clothing items.");
            return;
        }
        const newItem: ClothingItem = {
            file,
            previewUrl: URL.createObjectURL(file),
            instruction: ""
        };
        setClothingItems(prev => [...prev, newItem]);
    };

    const handleInstructionChange = (index: number, text: string) => {
        setClothingItems(prev => prev.map((item, i) => i === index ? { ...item, instruction: text } : item));
    };

    const removeClothingItem = (index: number) => {
        const itemToRemove = clothingItems[index];
        URL.revokeObjectURL(itemToRemove.previewUrl);
        setClothingItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleGenerate = () => {
        if (clothingItems.length === 0) {
            alert("Please upload at least one clothing item.");
            return;
        }

        proActionGuard(async () => {
            setIsLoading(true);
            setError(null);
            setResultImage(null);

            try {
                const resultUrl = await performVirtualTryOn(
                    userPhoto,
                    clothingItems.map(({ file, instruction }) => ({ file, instruction })),
                    (step) => {
                        let progressKey = `virtualTryOn.loading_${step}` as TranslationKey;
                        if (step === 'processing') progressKey = 'generator.generatingMessage' as any;
                        setLoadingMessage(t(progressKey));
                    },
                    model,
                    modelDescription,
                    aspectRatio
                );
                setResultImage(resultUrl);
            } catch (err) {
                const errorMessage = err instanceof Error ? err.message : 'Unknown error';
                setError(t('virtualTryOn.error', { errorMessage }));
            } finally {
                setIsLoading(false);
            }
        }, CREDIT_COSTS.VIRTUAL_TRY_ON);
    };

    const handleEdit = () => {
        if (resultImage) {
            onImageSelect(dataURLtoFile(resultImage, 'virtual-try-on.png'));
        }
    };

    const handleStartOver = () => {
        setClothingItems(prev => {
            prev.forEach(item => URL.revokeObjectURL(item.previewUrl));
            return [];
        });
        setResultImage(null);
        setError(null);
    };

    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="flex flex-col items-center justify-center h-full">
                    <Spinner />
                    <p className="mt-4 text-gray-600 dark:text-gray-300">{loadingMessage}</p>
                </div>
            );
        }

        if (error) {
            return (
                <div className="text-center">
                    <p className="text-red-500 mb-4">{error}</p>
                    <button onClick={() => setError(null)} className="bg-gray-700 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-800">
                        {t('app.tryAgain')}
                    </button>
                </div>
            );
        }

        if (resultImage) {
            return (
                <div className="flex flex-col items-center gap-4">
                    <h3 className="font-bold text-lg dark:text-white">{t('virtualTryOn.result')}</h3>
                    <img src={resultImage} alt="Virtual Try-On Result" className="w-full max-w-sm rounded-lg shadow-md object-contain max-h-[60vh]" />
                    <div className="flex items-center gap-4 mt-2">
                        <button onClick={handleStartOver} className="bg-gray-700 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-800 transition-colors">
                            {t('modelDresser.start_over')}
                        </button>
                        <button onClick={handleEdit} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors">
                            {t('generator.editInEditor')}
                        </button>
                    </div>
                </div>
            )
        }

        return (
            <div className="w-full flex flex-col items-center gap-6">
                <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* User Photo Column */}
                    <div className="flex flex-col gap-2">
                        <ImageUploader
                            title={t('virtualTryOn.uploadUserPhoto')}
                            description={t('virtualTryOn.userPhoto_desc')}
                            onFileSelect={handleUserPhotoSelect}
                            previewUrl={userPhotoPreview}
                            icon={<UserIcon className="w-12 h-12" />}
                        />
                        <div className="mt-2 bg-blue-50 border border-blue-200 p-3 rounded-md animate-fade-in dark:bg-gray-800 dark:border-gray-600">
                            <label className="block text-xs font-bold text-blue-800 mb-1 dark:text-blue-300">Model Description / Instructions (Optional)</label>
                            <textarea
                                value={modelDescription}
                                onChange={(e) => setModelDescription(e.target.value)}
                                placeholder="Describe the model or add specific instructions... (e.g. A smiling woman, add sunglasses, change background to beach)"
                                className="w-full text-sm p-2 border border-blue-200 rounded bg-white focus:ring-1 focus:ring-blue-500 outline-none resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Clothing Items Grid */}
                    <div className="flex flex-col gap-4">
                        <h3 className="font-bold text-lg text-center dark:text-white">{t('virtualTryOn.uploadClothing')} (Total Look)</h3>
                        <p className="text-sm text-gray-600 text-center -mt-2 dark:text-gray-400">{t('virtualTryOn.clothing_desc')}</p>

                        <div className="flex flex-col gap-3 max-h-[400px] overflow-y-auto pr-1">
                            {clothingItems.map((item, idx) => (
                                <div key={idx} className="flex items-start gap-3 p-2 bg-white border border-gray-200 rounded-lg shadow-sm dark:bg-gray-800 dark:border-gray-700">
                                    <div className="relative w-20 h-20 flex-shrink-0">
                                        <img src={item.previewUrl} className="w-full h-full object-cover rounded-md border" alt={`Item ${idx}`} />
                                        <button onClick={() => removeClothingItem(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors shadow-sm">
                                            <TrashIcon className="w-3 h-3" />
                                        </button>
                                    </div>
                                    <div className="flex-grow">
                                        <label className="text-xs font-semibold text-gray-500 block mb-1 dark:text-gray-400">Instructions (Optional)</label>
                                        <textarea
                                            value={item.instruction}
                                            onChange={(e) => handleInstructionChange(idx, e.target.value)}
                                            placeholder="e.g., Use only the jacket..."
                                            className="w-full text-sm p-2 border border-gray-300 rounded-md focus:ring-1 focus:ring-blue-500 outline-none resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            rows={2}
                                        />
                                    </div>
                                </div>
                            ))}
                            {clothingItems.length < 5 && (
                                <div className="mt-2">
                                    <ImageUploader title="Add Item" description="" onFileSelect={handleClothingPhotoSelect} previewUrl={null} icon={<UploadIcon className="w-6 h-6" />} compact={true} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                <div className="w-full max-w-lg mt-4 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1 dark:text-gray-300">{t('generator.aspectRatio')}</label>
                        <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className="form-select">
                            <option value="9:16">{t('aspectRatio.portrait9_16')}</option>
                            <option value="3:4">{t('aspectRatio.poster3_4')}</option>
                            <option value="2:3">{t('aspectRatio.social2_3')}</option>
                            <option value="1:1">{t('aspectRatio.square')}</option>
                            <option value="4:3">{t('aspectRatio.photo4_3')}</option>
                            <option value="16:9">{t('aspectRatio.landscape16_9')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-1 dark:text-gray-300">Model</label>
                        <select value={model} onChange={(e) => setModel(e.target.value)} className="form-select">
                            <option value="gemini-3-pro-image-preview">Nano Banana Pro (Quality)</option>
                            <option value="gemini-2.5-flash-image">Nano Banana (Speed)</option>
                        </select>
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={clothingItems.length === 0}
                    className="w-full max-w-sm flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors hover:bg-blue-700 disabled:bg-blue-300"
                >
                    <StarsIcon className="w-5 h-5" />
                    {t('virtualTryOn.generateButton')} ({t('credits.costLabel', { cost: String(CREDIT_COSTS.VIRTUAL_TRY_ON) })})
                </button>
            </div>
        );
    }

    return (
        <div className="w-full max-w-5xl mx-auto flex flex-col items-center gap-6 animate-fade-in p-4">
            <button onClick={onBack} data-tooltip={t('tooltip.back')} className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors dark:text-gray-400 dark:hover:text-white">
                <UndoIcon className="w-5 h-5" />
            </button>
            <div className="text-center mt-12">
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{t('virtualTryOn.title')}</h1>
                <p className="text-gray-600 mt-2 max-w-2xl dark:text-gray-300">{t('virtualTryOn.subtitle')}</p>
            </div>
            <div className="w-full mt-4">
                {renderContent()}
            </div>
        </div>
    );
};

export default VirtualTryOn;