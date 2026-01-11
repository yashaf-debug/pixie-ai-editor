/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { UploadIcon, TrashIcon, StarsIcon } from './icons';
import Spinner from './Spinner';
import { AspectRatio, ImageModel } from '../types';

interface CombinePanelProps {
  onCombine: (images: File[], prompt: string, aspectRatio: AspectRatio, model?: ImageModel) => void;
  isLoading: boolean;
  currentImage: File | null;
  cost: number;
  onEnhancePrompt: (prompt: string) => Promise<string>;
}

const CombinePanel: React.FC<CombinePanelProps> = ({ onCombine, isLoading, currentImage, cost, onEnhancePrompt }) => {
  const { t } = useLanguage();
  const [images, setImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [model, setModel] = useState<ImageModel>('gemini-3-pro-image-preview');

  // Automatically include the current editor image when the panel is shown
  useEffect(() => {
    if (currentImage) {
      setImages([currentImage]);
    } else {
      setImages([]);
    }
  }, [currentImage]);

  // Update preview URLs when images change
  useEffect(() => {
    // Create a new array of URLs
    const newUrls = images.map(file => URL.createObjectURL(file));
    setPreviewUrls(newUrls);

    // Cleanup function to revoke old URLs
    return () => {
      newUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [images]);


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setImages(prev => [...prev, ...newFiles]);
    }
    // Reset the input value to allow selecting the same file again
    e.target.value = '';
  };
  
  const handleRemoveImage = (indexToRemove: number) => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleCombineClick = () => {
    onCombine(images, prompt, aspectRatio, model);
  };

  const handleEnhanceClick = async () => {
      if (!prompt || isEnhancing || isLoading) return;

      setIsEnhancing(true);
      const enhancedPrompt = await onEnhancePrompt(prompt);
      setPrompt(enhancedPrompt);
      setIsEnhancing(false);
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <h3 className="text-sm font-bold text-gray-800 dark:text-white">{t('combinePanel.title')}</h3>
      <p className="text-sm text-gray-500 -mt-3 dark:text-gray-400">{t('combinePanel.description')}</p>

      <div className="w-full flex flex-col gap-4">
        <div className="relative w-full">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={t('combinePanel.promptPlaceholder')}
              className="form-textarea min-h-[80px] pr-10"
              disabled={isLoading || isEnhancing}
              rows={3}
            />
            <button
              type="button"
              onClick={handleEnhanceClick}
              disabled={isLoading || isEnhancing || !prompt}
              className="absolute top-2 right-2 p-1 rounded-full text-purple-600 hover:bg-purple-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent dark:text-purple-400 dark:hover:bg-purple-900/30"
              data-tooltip={t('tooltip.enhancePrompt')}
            >
              {isEnhancing ? <Spinner className="!h-5 !w-5 !mx-0" /> : <StarsIcon className="w-5 h-5" />}
            </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-300">{t('generator.aspectRatio')}</label>
                <select value={aspectRatio} onChange={(e) => setAspectRatio(e.target.value as AspectRatio)} className="form-select text-xs py-1.5" disabled={isLoading}>
                    <option value="1:1">{t('aspectRatio.square')}</option>
                    <option value="9:16">{t('aspectRatio.portrait9_16')}</option>
                    <option value="3:4">{t('aspectRatio.poster3_4')}</option>
                    <option value="2:3">{t('aspectRatio.social2_3')}</option>
                    <option value="4:3">{t('aspectRatio.photo4_3')}</option>
                    <option value="16:9">{t('aspectRatio.landscape16_9')}</option>
                </select>
            </div>
            <div>
                <label className="block text-xs font-medium text-gray-600 mb-1 dark:text-gray-300">Model</label>
                <select value={model} onChange={(e) => setModel(e.target.value as ImageModel)} className="form-select text-xs py-1.5" disabled={isLoading}>
                    <option value="gemini-3-pro-image-preview">Nano Banana Pro</option>
                    <option value="gemini-2.5-flash-image">Nano Banana</option>
                </select>
            </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
            {previewUrls.map((url, index) => (
                <div key={`${images[index]?.name}-${index}`} className="group relative aspect-square rounded-md overflow-hidden">
                    <img src={url} alt={`Source ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                        onClick={() => handleRemoveImage(index)}
                        disabled={isLoading}
                        className="absolute top-1 right-1 p-1 bg-black/50 rounded-full text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 disabled:hidden"
                        aria-label="Remove image"
                        data-tooltip={t('tooltip.removeImage')}
                    >
                        <TrashIcon className="w-3 h-3" />
                    </button>
                </div>
            ))}
             <label htmlFor="combine-upload" data-tooltip={t('tooltip.addImages')} className="cursor-pointer flex flex-col items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-md transition-colors aspect-square text-gray-500 hover:text-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-400">
                <UploadIcon className="w-5 h-5 mb-1" />
                <span className="text-xs font-semibold text-center px-1">{t('combinePanel.addImagesButton')}</span>
            </label>
            <input id="combine-upload" type="file" multiple className="hidden" accept="image/*" onChange={handleFileChange} disabled={isLoading} />
        </div>
      </div>
        
      <button
          onClick={handleCombineClick}
          disabled={isLoading || images.length < 2 || !prompt.trim()}
          className="btn btn-primary w-full"
      >
          {t('combinePanel.combineButton')} ({t('credits.costLabel', { cost: String(cost) })})
      </button>
    </div>
  );
};

export default CombinePanel;