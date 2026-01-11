
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { LockIcon } from './icons';

interface PasswordModalProps {
  onUnlock: () => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'Dfvgbh1990$') {
      onUnlock();
    } else {
      setError(true);
      setPassword('');
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900 z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl flex flex-col p-8 items-center text-center">
        <div className="bg-blue-100 p-4 rounded-full mb-6">
            <LockIcon className="w-8 h-8 text-blue-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Pixshop</h2>
        <p className="text-gray-500 mb-6">Please enter the access password to continue.</p>
        
        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
            <input
                type="password"
                value={password}
                onChange={(e) => {
                    setPassword(e.target.value);
                    setError(false);
                }}
                placeholder="Enter Password"
                className="w-full bg-gray-50 border border-gray-300 text-gray-900 text-lg rounded-lg focus:ring-blue-500 focus:border-blue-500 block p-3 text-center"
                autoFocus
            />
            {error && <p className="text-red-500 text-sm font-medium">Incorrect password. Please try again.</p>}
            
            <button 
                type="submit" 
                disabled={!password}
                className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-bold rounded-lg text-lg px-5 py-3 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                Enter App
            </button>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;
