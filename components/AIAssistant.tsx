/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ChatMessage } from '../types';
import Spinner from './Spinner';
import { PaperclipIcon, TrashIcon, UndoIcon, ChatIcon, UploadIcon, StarsIcon } from './icons';

interface AIAssistantProps {
  onBack: () => void;
  messages: ChatMessage[];
  onSendMessage: (prompt: string, files: File[]) => void;
  isLoading: boolean;
  cost: number;
  onEnhancePrompt: (prompt: string) => Promise<string>;
}

const AIAssistant: React.FC<AIAssistantProps> = ({ onBack, messages, onSendMessage, isLoading, cost, onEnhancePrompt }) => {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const suggestionPrompts = [
    {
      label: t('aiAssistant.suggestionCaption'),
      prompt: t('aiAssistant.suggestionCaptionPrompt'),
    },
    {
      label: t('aiAssistant.suggestionPost'),
      prompt: t('aiAssistant.suggestionPostPrompt'),
    },
    {
      label: t('aiAssistant.suggestionDescribe'),
      prompt: t('aiAssistant.suggestionDescribePrompt'),
    }
  ];

  useEffect(() => {
    const objectUrls = files.map(file => URL.createObjectURL(file));
    setPreviews(objectUrls);
    
    return () => {
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [files]);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const isScrolledNearBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 50;
      const isNewMessageFromUser = messages.length > 1 && messages[messages.length - 2]?.role === 'user' && messages[messages.length - 1]?.isLoading;

      if (isScrolledNearBottom || isNewMessageFromUser) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || files.length > 0) && !isLoading) {
      onSendMessage(input.trim(), files);
      setInput('');
      setFiles([]);
    }
  };

  const handleSuggestionClick = (prompt: string) => {
    if (files.length > 0 && !isLoading) {
        onSendMessage(prompt, files);
        setInput('');
        setFiles([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      // FIX: Explicitly type `file` as `File` to prevent potential TypeScript errors.
      const imageFiles = Array.from(e.target.files).filter((file: File) => file.type.startsWith('image/'));
      setFiles(prev => [...prev, ...imageFiles]);
    }
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(false);
      if (e.dataTransfer.files) {
          // FIX: Explicitly type `file` as `File` to prevent potential TypeScript errors.
          const imageFiles = Array.from(e.dataTransfer.files).filter((file: File) => file.type.startsWith('image/'));
          setFiles(prev => [...prev, ...imageFiles]);
      }
  };

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleEnhanceClick = async () => {
    if (!input || isEnhancing || isLoading) return;

    setIsEnhancing(true);
    const enhancedPrompt = await onEnhancePrompt(input);
    setInput(enhancedPrompt);
    setIsEnhancing(false);
  };

  const canSubmit = (input.trim().length > 0 || files.length > 0) && !isLoading;

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col h-full items-center gap-6 animate-fade-in p-4">
        <button onClick={onBack} data-tooltip={t('tooltip.back')} className="absolute top-6 left-6 flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors">
            <UndoIcon className="w-5 h-5" />
        </button>
        <div className="text-center mt-12">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">{t('aiAssistant.title')}</h1>
            <p className="text-gray-600 mt-2 max-w-2xl">{t('aiAssistant.subtitle')}</p>
        </div>
        
        <div 
          className={`w-full flex-grow flex flex-col bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden transition-all duration-300 ${isDraggingOver ? 'ring-4 ring-blue-500 ring-offset-2' : ''}`}
          onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
          onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(true); }}
          onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDraggingOver(false); }}
          onDrop={handleDrop}
        >
            <div ref={scrollContainerRef} className="relative flex-grow overflow-y-auto p-4 space-y-6">
                {isDraggingOver && (
                    <div className="absolute inset-0 bg-blue-500/10 backdrop-blur-sm flex flex-col items-center justify-center z-10 pointer-events-none rounded-t-lg">
                        <UploadIcon className="w-16 h-16 text-blue-500" />
                        <p className="mt-4 font-bold text-blue-600">{t('startScreen.dragDrop')}</p>
                    </div>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center flex-shrink-0"><ChatIcon className="w-5 h-5 text-white" /></div>}
                    <div className={`rounded-lg p-3 max-w-[85%] ${msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                      {msg.imageUrls && msg.imageUrls.length > 0 && (
                          <div className={`grid gap-2 mb-2 ${msg.imageUrls.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                              {msg.imageUrls.map((url, index) => (
                                  <img key={index} src={url} alt={`Content ${index}`} className="rounded-md max-w-full h-auto" />
                              ))}
                          </div>
                      )}
                      {msg.isLoading ? (
                        <div className="flex items-center gap-2">
                           <Spinner className="!h-5 !w-5 !mx-0" />
                           <span className="text-sm text-gray-500">{t('chatPanel.thinking')}</span>
                        </div>
                      ) : (
                        msg.text && <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-gray-200 bg-white">
                {previews.length > 0 && (
                  <>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {previews.map((preview, index) => (
                        <div key={index} className="relative group w-16 h-16">
                          <img src={preview} alt={`Preview ${index}`} className="w-full h-full object-cover rounded-md border border-gray-200" />
                          <button onClick={() => handleRemoveFile(index)} className="absolute -top-1 -right-1 p-0.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                            <TrashIcon className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <div className="mb-3 p-2 bg-gray-50 rounded-md border border-gray-200">
                      <p className="text-xs font-semibold text-gray-600 mb-2">{t('aiAssistant.suggestionTitle')}</p>
                      <div className="flex flex-wrap gap-2">
                          {suggestionPrompts.map((p) => (
                              <button 
                                  key={p.label}
                                  onClick={() => handleSuggestionClick(p.prompt)}
                                  disabled={isLoading}
                                  className="text-xs bg-blue-100 text-blue-800 font-semibold px-3 py-1.5 rounded-full hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                  {p.label}
                              </button>
                          ))}
                      </div>
                    </div>
                  </>
                )}
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        className="p-2 border border-gray-300 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50"
                    >
                        <PaperclipIcon className="w-5 h-5" />
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={isLoading}
                    />
                    <div className="relative flex-grow min-w-0">
                      <input
                          type="text"
                          value={input}
                          onChange={(e) => setInput(e.target.value)}
                          placeholder={t('aiAssistant.placeholder')}
                          className="form-input pr-10"
                          disabled={isLoading || isEnhancing}
                      />
                      <button
                        type="button"
                        onClick={handleEnhanceClick}
                        disabled={isLoading || isEnhancing || !input}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full text-purple-600 hover:bg-purple-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:hover:bg-transparent"
                        data-tooltip={t('tooltip.enhancePrompt')}
                      >
                        {isEnhancing ? <Spinner className="!h-5 !w-5 !mx-0" /> : <StarsIcon className="w-5 h-5" />}
                      </button>
                    </div>
                    <button
                        type="submit"
                        disabled={!canSubmit}
                        className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm hover:bg-blue-700 active:scale-[0.98] text-sm disabled:bg-blue-300 disabled:shadow-none disabled:cursor-not-allowed"
                    >
                        {t('chatPanel.send')} ({t('credits.costLabel', { cost: String(cost) })})
                    </button>
                </form>
            </div>
        </div>
    </div>
  );
};

export default AIAssistant;