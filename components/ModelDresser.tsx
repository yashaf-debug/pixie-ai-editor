/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useCallback, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { dressSavedModel, dataURLtoFile } from '../services/geminiService';
import { UndoIcon, UploadIcon, StarsIcon } from './icons';
import Spinner from './Spinner';
import { CREDIT_COSTS } from '../App';
import { AspectRatio } from '../types';

interface ModelDresserProps {
    onBack: () => void;
    onImageSelect: (file: File) => void;
    modelFile: File;
    proActionGuard: (action: () => void, cost: number) => void;
}

const ModelDresser: React.FC<ModelDresserProps> = ({ onBack, onImageSelect, modelFile, proActionGuard }) => {
  const { t } = useLanguage();
  const [clothingFile, setClothingFile] = useState<File | null>(null);
  const [clothingPreview, setClothingPreview] = useState<string | null>(null);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('9:16');
  const [model, setModel] = useState<string>('gemini-3-pro-image-preview');

  const modelPreview = URL.createObjectURL(modelFile);

  useEffect(() => {
    // Clean up object URLs on unmount
    return () => {
        URL.revokeObjectURL(modelPreview);
        if (clothingPreview) {
            URL.revokeObjectURL(clothingPreview);
        }
    }
  }, [modelPreview, clothingPreview]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setClothingFile(file);
      if (clothingPreview) {
        URL.revokeObjectURL(clothingPreview);
      }
      setClothingPreview(URL.createObjectURL(file));
      proActionGuard(() => handleDressModel(file), CREDIT_COSTS.DRESS_MODEL);
    }
  };

  const handleDressModel = async (garment: File) => {
    if (!garment) return;
    setIsLoading(true);
    setError(null);
    setResultImage(null);
    try {
        const resultUrl = await dressSavedModel(modelFile, garment, aspectRatio, model);
        setResultImage(resultUrl);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(t('modelDresser.errorDressing', { errorMessage }));
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleEdit = () => {
      if (resultImage) {
          onImageSelect(dataURLtoFile(resultImage, 'dressed-model.png'));
      }
  }
  
  const handleStartOver = () => {
      setClothingFile(null);
      setClothingPreview(null);
      setResultImage(null);
      setError(null);
  }

  return (
    <div className="w-full max-w-6xl mx-auto flex flex-col items-center gap-6 animate-fade-in p-4">
        <button onClick={onBack} data-tooltip={t('tooltip.back')} className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors dark:text-gray-400 dark:hover:text-white">
            <UndoIcon className="w-5 h-5" />
        </button>
        <div className="text-center mt-12">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white">{t('modelDresser.title')}</h1>
            <p className="text-gray-600 mt-2 max-w-2xl dark:text-gray-300">{t('modelDresser.subtitle')}</p>
        </div>

        <div className="w-full max-w-lg mb-6 grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1 dark:text-gray-300">{t('generator.aspectRatio')}</label>
                <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className="form-select" disabled={isLoading}>
                    <option value="9:16">{t('aspectRatio.portrait9_16')}</option>
                    <option value="1:1">{t('aspectRatio.square')}</option>
                    <option value="3:4">{t('aspectRatio.poster3_4')}</option>
                    <option value="2:3">{t('aspectRatio.social2_3')}</option>
                    <option value="4:3">{t('aspectRatio.photo4_3')}</option>
                    <option value="16:9">{t('aspectRatio.landscape16_9')}</option>
                </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-600 mb-1 dark:text-gray-300">Model</label>
                <select value={model} onChange={(e) => setModel(e.target.value)} className="form-select" disabled={isLoading}>
                    <option value="gemini-3-pro-image-preview">Nano Banana Pro (Quality)</option>
                    <option value="gemini-2.5-flash-image">Nano Banana (Speed)</option>
                </select>
            </div>
        </div>

        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start">
            <div className="flex flex-col items-center gap-2">
                <h3 className="font-bold text-lg dark:text-white">Your Model</h3>
                <img src={modelPreview} alt="Selected Model" className="w-full rounded-lg shadow-md aspect-[9/16] object-cover" />
            </div>

            <div className="flex flex-col items-center gap-2">
                <h3 className="font-bold text-lg dark:text-white">Clothing</h3>
                <div className="w-full rounded-lg shadow-md aspect-[9/16] bg-gray-100 checkerboard-bg flex items-center justify-center p-4 dark:bg-gray-800">
                    {clothingPreview ? (
                        <img src={clothingPreview} alt="Clothing Preview" className="max-w-full max-h-full object-contain" />
                    ) : (
                        <label htmlFor="clothing-upload" className="cursor-pointer text-center flex flex-col items-center gap-2 text-gray-600 hover:text-blue-600 transition-colors dark:text-gray-400 dark:hover:text-blue-400">
                            <UploadIcon className="w-10 h-10" />
                            <span className="font-semibold">{t('modelDresser.upload_cta')}</span>
                        </label>
                    )}
                     <input id="clothing-upload" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                </div>
            </div>

            <div className="flex flex-col items-center gap-2">
                <h3 className="font-bold text-lg dark:text-white">Result</h3>
                <div className="w-full rounded-lg shadow-md aspect-[9/16] bg-gray-200 flex items-center justify-center p-2 dark:bg-gray-700">
                    {isLoading ? (
                        <div className="flex flex-col items-center">
                            <Spinner />
                            <p className="text-sm mt-2 text-gray-600 dark:text-gray-300">{t('modelDresser.loading_dressing')}</p>
                        </div>
                    ) : resultImage ? (
                        <img src={resultImage} alt="Dressed Model" className="w-full h-full object-cover rounded" />
                    ) : (
                        <div className="text-center text-gray-500 text-sm p-4 dark:text-gray-400">
                           {error ? <p className="text-red-500">{error}</p> : 'Upload a clothing item to see the result here.'}
                        </div>
                    )}
                </div>
            </div>
        </div>

         {resultImage && !isLoading && (
            <div className="flex items-center gap-4 mt-4">
                <button onClick={handleStartOver} className="bg-gray-700 text-white font-bold py-2 px-6 rounded-lg hover:bg-gray-800 transition-colors">
                    {t('modelDresser.start_over')}
                </button>
                <button onClick={handleEdit} className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-blue-700 transition-colors">
                    {t('generator.editInEditor')}
                </button>
            </div>
        )}
    </div>
  );
};

export default ModelDresser;