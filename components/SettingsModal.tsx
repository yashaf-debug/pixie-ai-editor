
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { t } = useLanguage();
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    if (isOpen) {
        const savedKey = localStorage.getItem('pixshop_api_key');
        if (savedKey) {
            setApiKey(savedKey);
        }
    }
  }, [isOpen]);

  const handleSave = () => {
      if (apiKey.trim()) {
          localStorage.setItem('pixshop_api_key', apiKey.trim());
      } else {
          localStorage.removeItem('pixshop_api_key');
      }
      onClose();
      // Reload page to ensure all services pick up the new key immediately
      window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white w-full max-w-md rounded-lg shadow-2xl flex flex-col p-6 m-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Settings</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">&times;</button>
        </div>
        
        <div className="flex flex-col gap-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Google Gemini API Key</label>
                <p className="text-xs text-gray-500 mb-2">Provide your own API key to bypass default limits or use specific features like Veo Video Generation.</p>
                <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="AIza..."
                    className="form-input"
                />
            </div>
            
            <div className="flex justify-end gap-2 mt-2">
                <button onClick={onClose} className="btn btn-subtle">Cancel</button>
                <button onClick={handleSave} className="btn btn-primary">Save & Reload</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
