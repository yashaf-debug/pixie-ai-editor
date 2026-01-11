/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import Spinner from './Spinner';

declare global {
    interface Window {
        paypal: any;
    }
}

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number) => void;
}

const UpgradeModal: React.FC<UpgradeModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);
  const [isRenderingButton, setIsRenderingButton] = useState(true);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setIsRenderingButton(true);
    setError(null);

    const renderButton = () => {
        const container = document.getElementById("paypal-button-container");
        if (window.paypal && window.paypal.Buttons && container) {
            container.innerHTML = ""; // Clear previous attempts
            try {
                window.paypal.Buttons({
                    createOrder: (data: any, actions: any) => {
                        return actions.order.create({
                            purchase_units: [{
                                amount: {
                                    value: '1.00',
                                    currency_code: 'USD'
                                },
                                description: '100 Credits for Pixshop'
                            }]
                        });
                    },
                    onApprove: (data: any, actions: any) => {
                        return actions.order.capture().then(() => {
                            onSuccess(100);
                        });
                    },
                    onError: (err: any) => {
                        setError("An error occurred with your payment. Please try again.");
                        console.error('PayPal Error:', err);
                    },
                    onInit: () => {
                        setIsRenderingButton(false);
                    }
                }).render('#paypal-button-container');
                return true;
            } catch (err) {
                console.error("Failed to render PayPal button:", err);
                setError("Could not load payment options. Please try again later.");
                setIsRenderingButton(false);
                return true; // Stop trying
            }
        }
        return false; // Not ready
    };

    if (renderButton()) {
        return; // Rendered on first try
    }

    // Poll for the PayPal object if it's not ready
    let attempts = 0;
    const interval = setInterval(() => {
        attempts++;
        if (renderButton() || attempts > 50) { // Try for 5 seconds
            clearInterval(interval);
            if (attempts > 50 && !document.getElementById("paypal-button-container")?.hasChildNodes()) {
                setError("Payment options failed to load. Please check your connection or ad blocker and try again.");
                setIsRenderingButton(false);
            }
        }
    }, 100);

    return () => clearInterval(interval);

  }, [isOpen, onSuccess, t]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
        className="bg-white w-full max-w-md rounded-lg shadow-2xl flex flex-col p-8 m-4 text-center"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold text-gray-800">{t('upgrade.title')}</h2>
        <p className="text-gray-600 mt-2">{t('upgrade.subtitle')}</p>
        
        <div className="my-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-3xl font-extrabold text-blue-900">100 {t('upgrade.credits')}</h3>
            <p className="text-5xl font-extrabold text-blue-900 mt-2">$1.00</p>
            <p className="text-blue-700 mt-1">{t('upgrade.oneTime')}</p>
        </div>

        <ul className="text-left space-y-2 text-gray-600 text-sm">
            <li className="flex items-center gap-2">✓ {t('upgrade.feature1')}</li>
            <li className="flex items-center gap-2">✓ {t('upgrade.feature2')}</li>
            <li className="flex items-center gap-2">✓ {t('upgrade.feature3')}</li>
        </ul>

        <div className="mt-6 min-h-[50px] relative">
            {isRenderingButton && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <Spinner />
                </div>
            )}
            <div id="paypal-button-container" style={{ opacity: isRenderingButton ? 0 : 1 }}></div>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </div>
    </div>
  );
};

export default UpgradeModal;