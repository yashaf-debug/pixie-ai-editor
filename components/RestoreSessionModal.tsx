/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';

interface RestoreSessionModalProps {
  isOpen: boolean;
  onRestore: () => void;
  onDiscard: () => void;
}

const RestoreSessionModal: React.FC<RestoreSessionModalProps> = ({ isOpen, onRestore, onDiscard }) => {
  const { t } = useLanguage();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center animate-fade-in"
      aria-modal="true"
      role="dialog"
    >
      <div
        className="bg-white w-full max-w-md rounded-lg shadow-2xl flex flex-col p-8 m-4 text-center"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-800">{t('restoreSession.title')}</h2>
        <p className="text-gray-600 mt-2">{t('restoreSession.message')}</p>
        
        <div className="flex justify-center gap-4 mt-6">
          <button onClick={onDiscard} className="px-6 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300">
            {t('restoreSession.discard')}
          </button>
          <button onClick={onRestore} className="px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700">
            {t('restoreSession.restore')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestoreSessionModal;
