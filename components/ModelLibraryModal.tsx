/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback } from 'react';
import { getModels, deleteModel } from '../services/modelService';
import { TrashIcon } from './icons';
import Spinner from './Spinner';
import { useLanguage } from '../contexts/LanguageContext';

interface ModelLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onModelSelect: (file: File) => void;
}

interface LibraryModel {
  id: number;
  file: File;
  url: string;
}

const ModelLibraryModal: React.FC<ModelLibraryModalProps> = ({ isOpen, onClose, onModelSelect }) => {
  const { t } = useLanguage();
  const [models, setModels] = useState<LibraryModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const items = await getModels();
      const modelObjects = items.map(item => ({
        ...item,
        url: URL.createObjectURL(item.file),
      }));
      setModels(modelObjects);
    } catch (err) {
      setError(t('modelLibrary.loadingError'));
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    if (isOpen) {
      loadModels();
    }

    const currentModels = models;
    return () => {
      // Revoke object URLs on cleanup
      currentModels.forEach(model => URL.revokeObjectURL(model.url));
    };
  }, [isOpen, loadModels]);

  const handleDelete = async (id: number, url: string) => {
    try {
      await deleteModel(id);
      URL.revokeObjectURL(url);
      setModels(prevModels => prevModels.filter(model => model.id !== id));
    } catch (err) {
      setError(t('modelLibrary.deleteError'));
      console.error(err);
    }
  };

  const handleSelect = (file: File) => {
    onModelSelect(file);
  };

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);


  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white w-full max-w-6xl h-[90vh] rounded-lg shadow-2xl flex flex-col p-6"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">{t('modelLibrary.title')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-800 transition-colors text-3xl leading-none"
            aria-label={t('modelLibrary.closeAria')}
            data-tooltip={t('tooltip.close')}
          >
            &times;
          </button>
        </div>

        <div className="flex-grow overflow-y-auto pr-2 -mr-2 bg-gray-50 rounded-md p-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Spinner />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-full text-red-500">{error}</div>
          ) : models.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <TrashIcon className="w-12 h-12 mb-2 opacity-20" /> {/* Using TrashIcon as placeholder or I should import UserIcon/ModelIcon */}
              <p className="text-base font-medium text-gray-500">{t('modelLibrary.emptyMessage')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {models.map(model => (
                <div key={model.id} className="group relative aspect-[9/16] rounded-lg overflow-hidden cursor-pointer" onClick={() => handleSelect(model.file)}>
                  <img src={model.url} alt={`Saved model ${model.id}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                    <span className="text-white font-semibold text-sm">{t('modelLibrary.useModel')}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(model.id, model.url); }}
                    className="absolute top-2 right-2 p-1.5 bg-black/50 rounded-full text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    aria-label={t('modelLibrary.deleteAria')}
                    data-tooltip={t('tooltip.deleteImage')}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModelLibraryModal;