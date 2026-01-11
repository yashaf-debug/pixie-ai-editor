/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { BrandKit } from '../types';
import { fileToDataURL } from '../utils';
import { UploadIcon, StarsIcon, TrashIcon } from './icons';

interface BrandKitPanelProps {
  brandKit: BrandKit | null;
  onSave: (kit: BrandKit) => void;
  onApplyStyle: () => void;
  isLoading: boolean;
  cost: number;
}

const fonts = [
  'Montserrat', 'Lato', 'Roboto', 'Open Sans', 'Poppins', 'Oswald', 'Raleway'
];

const BrandKitPanel: React.FC<BrandKitPanelProps> = ({ brandKit, onSave, onApplyStyle, isLoading, cost }) => {
  const { t } = useLanguage();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [primaryColor, setPrimaryColor] = useState('#3B82F6');
  const [secondaryColor, setSecondaryColor] = useState('#10B981');
  const [font, setFont] = useState('Montserrat');

  useEffect(() => {
    if (brandKit) {
      setLogoPreview(brandKit.logo || null);
      setPrimaryColor(brandKit.primaryColor || '#3B82F6');
      setSecondaryColor(brandKit.secondaryColor || '#10B981');
      setFont(brandKit.font || 'Montserrat');
    }
  }, [brandKit]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      const dataUrl = await fileToDataURL(file);
      setLogoPreview(dataUrl);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  const handleSave = async () => {
    const newKit: BrandKit = {
      primaryColor,
      secondaryColor,
      font,
      logo: logoPreview || undefined,
    };
    onSave(newKit);
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <h3 className="text-sm font-bold text-gray-800">{t('brandKitPanel.title')}</h3>
      <p className="text-sm text-gray-500 -mt-3">{t('brandKitPanel.description')}</p>

      {/* Logo Section */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-gray-700">{t('brandKitPanel.logo')}</label>
        <div className="flex items-center gap-2">
          {logoPreview ? (
            <div className="relative group">
              <img src={logoPreview} alt="Logo Preview" className="w-16 h-16 object-contain border rounded-md bg-gray-100" />
              <button onClick={handleRemoveLogo} className="absolute top-0 right-0 -mt-1 -mr-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <TrashIcon className="w-3 h-3"/>
              </button>
            </div>
          ) : null}
          <label htmlFor="logo-upload-kit" className="flex-grow cursor-pointer flex items-center justify-center gap-2 border border-gray-300 rounded-md py-2 px-3 hover:bg-gray-50 transition-colors">
            <UploadIcon className="w-4 h-4 text-gray-500" />
            <span className="text-xs font-medium text-gray-700">{logoPreview ? t('brandingPanel.changeLogo') : t('brandingPanel.uploadLogo')}</span>
          </label>
          <input id="logo-upload-kit" type="file" accept="image/png, image/jpeg" onChange={handleLogoChange} disabled={isLoading} className="hidden" />
        </div>
      </div>

      {/* Colors Section */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-gray-700">{t('brandKitPanel.colors')}</label>
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-600 mb-1">{t('brandKitPanel.primary')}</label>
            <div className="relative w-full h-9 border border-gray-300 rounded-md overflow-hidden">
                <input type="color" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="absolute inset-0 w-full h-full cursor-pointer p-0 border-none"/>
            </div>
             <input type="text" value={primaryColor} onChange={e => setPrimaryColor(e.target.value)} className="form-input !text-xs !p-1.5 mt-1"/>
          </div>
          <div className="flex flex-col">
            <label className="text-xs font-medium text-gray-600 mb-1">{t('brandKitPanel.secondary')}</label>
            <div className="relative w-full h-9 border border-gray-300 rounded-md overflow-hidden">
                <input type="color" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="absolute inset-0 w-full h-full cursor-pointer p-0 border-none"/>
            </div>
            <input type="text" value={secondaryColor} onChange={e => setSecondaryColor(e.target.value)} className="form-input !text-xs !p-1.5 mt-1"/>
          </div>
        </div>
      </div>
      
      {/* Font Section */}
      <div className="flex flex-col gap-2">
        <label htmlFor="font-select" className="text-xs font-bold text-gray-700">{t('brandKitPanel.font')}</label>
        <select id="font-select" value={font} onChange={e => setFont(e.target.value)} className="form-select">
          {fonts.map(f => <option key={f} value={f}>{f}</option>)}
        </select>
      </div>
      
      {/* Actions */}
      <div className="flex flex-col gap-2 pt-2">
        <button
          onClick={handleSave}
          disabled={isLoading}
          className="w-full bg-gray-700 text-white font-bold py-2.5 px-4 rounded-lg transition-colors shadow-sm hover:bg-gray-800 active:scale-[0.98] text-sm disabled:bg-gray-400 disabled:shadow-none"
        >
          {t('brandKitPanel.saveButton')}
        </button>
        <button
          onClick={onApplyStyle}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-2.5 px-4 rounded-lg transition-colors shadow-sm hover:bg-blue-700 active:scale-[0.98] text-sm disabled:bg-blue-300 disabled:shadow-none"
        >
          <StarsIcon className="w-5 h-5" />
          {t('brandKitPanel.applyButton')} ({t('credits.costLabel', { cost: String(cost) })})
        </button>
      </div>

    </div>
  );
};

export default BrandKitPanel;