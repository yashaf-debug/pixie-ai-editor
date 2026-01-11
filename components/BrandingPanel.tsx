/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { UploadIcon, StarsIcon } from './icons';
import Spinner from './Spinner';
import { BrandKit } from '../types';
import { dataURLtoFile } from '../utils';

interface BrandingPanelProps {
  onApplyBranding: (logoFile: File, prompt: string) => void;
  isLoading: boolean;
  cost: number;
  onEnhancePrompt: (prompt: string) => Promise<string>;
  brandKit: BrandKit | null;
}

const BrandingPanel: React.FC<BrandingPanelProps> = ({ onApplyBranding, isLoading, cost, onEnhancePrompt, brandKit }) => {
  const { t } = useLanguage();
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('Place the logo in the top right corner, making it look natural on the background surface.');
  const [isEnhancing, setIsEnhancing] = useState(false);

  useEffect(() => {
      if (brandKit?.logo) {
          const logoFile = dataURLtoFile(brandKit.logo, 'brand-logo.png');
          setLogo(logoFile);
          setLogoPreview(brandKit.logo);
      }
  }, [brandKit]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogo(file);
      const newUrl = URL.createObjectURL(file);
      if (logoPreview) {
        URL.revokeObjectURL(logoPreview);
      }
      setLogoPreview(newUrl);
    }
  };

  const handleApply = () => {
    if (logo && prompt) {
      onApplyBranding(logo, prompt);
    }
  };

  const handleEnhanceClick = async () => {
      if (!prompt || isEnhancing || isLoading) return;

      setIsEnhancing(true);
      const enhancedPrompt = await onEnhancePrompt(prompt);
      setPrompt(enhancedPrompt);
      setIsEnhancing(false);
  };

  const hasBrandKitLogo = !!brandKit?.logo;

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <h3 className="text-sm font-bold text-gray-800">{t('brandingPanel.title')}</h3>
      <p className="text-sm text-gray-500 -mt-3">{t('brandingPanel.description')}</p>
      
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">{hasBrandKitLogo ? t('brandKitPanel.logo') : t('brandingPanel.uploadLogo')}</label>
        {logoPreview && <img src={logoPreview} alt="Logo preview" className="w-16 h-16 mb-2 object-contain border rounded" />}
        <label htmlFor="logo-upload" className="w-full cursor-pointer flex items-center justify-center gap-2 border border-gray-300 rounded-md py-2 px-3 hover:bg-gray-50 transition-colors">
          <UploadIcon className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-700">{logo ? logo.name : t('brandingPanel.chooseFile')}</span>
        </label>
        <input id="logo-upload" type="file" accept="image/png, image/jpeg" onChange={handleLogoChange} disabled={isLoading} className="hidden" />
      </div>
      
      <div className="relative">
        <label className="block text-xs font-medium text-gray-600 mb-1">{t('brandingPanel.instructions')}</label>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={t('brandingPanel.promptPlaceholder')}
          className="form-textarea pr-10"
          disabled={isLoading || isEnhancing}
          rows={3}
        />
        <button
          type="button"
          onClick={handleEnhanceClick}
          disabled={isLoading || isEnhancing || !prompt}
          className="absolute top-8 right-2 p-1 rounded-full text-purple-600 hover:bg-purple-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent"
          data-tooltip={t('tooltip.enhancePrompt')}
        >
          {isEnhancing ? <Spinner className="!h-5 !w-5 !mx-0" /> : <StarsIcon className="w-5 h-5" />}
        </button>
      </div>

      <button
        onClick={handleApply}
        className="btn btn-primary w-full"
        disabled={isLoading || !logo || !prompt.trim()}
      >
        {t('brandingPanel.applyButton')} ({t('credits.costLabel', { cost: String(cost) })})
      </button>
    </div>
  );
};

export default BrandingPanel;