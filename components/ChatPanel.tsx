/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { ChatMessage, AspectRatio, ImageModel } from '../types';
import Spinner from './Spinner';
import { PaperclipIcon, TrashIcon, StarsIcon } from './icons';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (prompt: string, files: File[], aspectRatio?: AspectRatio, model?: ImageModel) => void;
  isLoading: boolean;
  cost: number;
  mainImageFile: File | null;
  onEnhancePrompt: (prompt: string) => Promise<string>;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ messages, onSendMessage, isLoading, cost, mainImageFile, onEnhancePrompt }) => {
  const { t } = useLanguage();
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ url: string; isMain: boolean; originalIndex?: number }[]>([]);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio | 'preserve'>('preserve');
  const [model, setModel] = useState<ImageModel>('gemini-3-pro-image-preview');
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Auto-resize textarea
  useEffect(() => {
      const ta = textareaRef.current;
      if (ta) {
          ta.style.height = 'auto'; // Reset height to recalculate
          const scrollHeight = ta.scrollHeight;
          ta.style.height = `${scrollHeight}px`;
      }
  }, [input]);

  useEffect(() => {
    const newPreviews: { url: string; isMain: boolean; originalIndex?: number }[] = [];
    const objectUrls: string[] = [];

    // Add main editor image first if it exists
    if (mainImageFile) {
        const url = URL.createObjectURL(mainImageFile);
        objectUrls.push(url);
        newPreviews.push({ url, isMain: true });
    }

    // Add locally attached files
    files.forEach((file, index) => {
        const url = URL.createObjectURL(file);
        objectUrls.push(url);
        newPreviews.push({ url, isMain: false, originalIndex: index });
    });

    setPreviews(newPreviews);
    
    // Cleanup function to revoke all created object URLs
    return () => {
      objectUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [files, mainImageFile]);

  useLayoutEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const isScrolledNearBottom = container.scrollHeight - container.clientHeight <= container.scrollTop + 30;
      const isNewMessageFromUser = messages.length > 1 && messages[messages.length - 2]?.role === 'user' && messages[messages.length - 1]?.isLoading;

      if (isScrolledNearBottom || isNewMessageFromUser) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [messages]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || files.length > 0) && !isLoading) {
      const ar = aspectRatio === 'preserve' ? undefined : aspectRatio;
      onSendMessage(input.trim(), files, ar, model);
      setInput('');
      setFiles([]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const imageFiles = Array.from(e.target.files).filter((file: File) => file.type.startsWith('image/'));
      setFiles(prev => [...prev, ...imageFiles]);
    }
    e.target.value = '';
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
    <div className="w-full h-full flex flex-col animate-fade-in">
      <h3 className="text-sm font-bold text-gray-800 mb-2 flex-shrink-0 dark:text-white">{t('chatPanel.title')}</h3>
      <div ref={scrollContainerRef} className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'user' ? (
              <div className="bg-indigo-600 text-white rounded-xl p-3 max-w-[85%]">
                {msg.imageUrls && msg.imageUrls.length > 0 && (
                    <div className="grid grid-cols-2 gap-1 mb-2">
                        {msg.imageUrls.map((url, index) => (
                            <img key={index} src={url} alt={`User upload ${index}`} className="rounded-lg" />
                        ))}
                    </div>
                )}
                {msg.text && <p className="text-sm">{msg.text}</p>}
              </div>
            ) : (
              <div className="bg-gray-100 rounded-xl p-3 max-w-[85%] dark:bg-gray-700 dark:text-gray-100">
                {msg.isLoading ? (
                  <div className="flex items-center gap-2">
                     <Spinner className="!h-5 !w-5 !mx-0" />
                     <span className="text-sm text-gray-500 dark:text-gray-400">{t('chatPanel.thinking')}</span>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {msg.imageUrls && msg.imageUrls.map((url, index) => (
                      <img key={index} src={url} alt={`AI generated image ${index}`} className="rounded-lg max-w-full h-auto" />
                    ))}
                    {msg.text && <p className="text-sm text-gray-800 dark:text-gray-100">{msg.text}</p>}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="mt-2 pt-2 border-t border-gray-200 flex-shrink-0 dark:border-gray-700">
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          {previews.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {previews.map((preview, index) => (
                <div key={index} className="relative group aspect-square">
                  <img src={preview.url} alt={`Preview ${index}`} className="w-full h-full object-cover rounded-md" />
                  {preview.isMain ? (
                      <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        {t('chatPanel.mainImageBadge')}
                      </div>
                  ) : (
                    <button type="button" onClick={() => handleRemoveFile(preview.originalIndex!)} className="absolute top-1 right-1 p-0.5 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <TrashIcon className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="bg-white border border-gray-300 rounded-lg flex flex-col transition-all focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-indigo-500 dark:bg-gray-800 dark:border-gray-600">
            {input && !isLoading && (
              <div className="px-2 pt-2">
                 <button
                    type="button"
                    onClick={handleEnhanceClick}
                    className="flex items-center gap-1.5 text-xs text-purple-600 font-semibold px-2 py-1 rounded-md hover:bg-purple-100 self-start disabled:opacity-50 dark:text-purple-400 dark:hover:bg-purple-900/30"
                    disabled={isEnhancing}
                    data-tooltip={t('tooltip.enhancePrompt')}
                  >
                    {isEnhancing ? <Spinner className="!h-4 !w-4 !mx-0" /> : <StarsIcon className="w-4 h-4" />}
                    <span>{t('tooltip.enhancePrompt')}</span>
                  </button>
              </div>
            )}

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                  }
              }}
              placeholder={t('chatPanel.placeholder')}
              className="w-full border-none focus:ring-0 resize-none p-2 text-sm placeholder-gray-500 bg-transparent overflow-y-hidden max-h-32 dark:text-gray-100 dark:placeholder-gray-400"
              disabled={isLoading || isEnhancing}
              rows={1}
            />

            <div className="flex flex-col gap-2 p-2">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                            className="p-1 text-gray-500 hover:text-gray-800 rounded-md hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700"
                        >
                            <PaperclipIcon className="w-5 h-5" />
                        </button>
                        <select 
                            value={aspectRatio} 
                            onChange={(e) => setAspectRatio(e.target.value as AspectRatio | 'preserve')} 
                            className="text-xs bg-transparent border-none text-gray-500 hover:text-gray-800 cursor-pointer focus:ring-0 p-1 dark:text-gray-400 dark:hover:text-gray-200"
                            disabled={isLoading}
                            title="Aspect Ratio"
                        >
                            <option value="preserve">AR</option>
                            <option value="1:1">1:1</option>
                            <option value="9:16">9:16</option>
                            <option value="3:4">3:4</option>
                            <option value="2:3">2:3</option>
                            <option value="4:3">4:3</option>
                            <option value="16:9">16:9</option>
                        </select>
                    </div>
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        disabled={isLoading}
                    />
                    <button
                      type="submit"
                      disabled={!canSubmit}
                      className="btn btn-primary !py-1 !px-3 !text-xs"
                    >
                      {t('chatPanel.send')} ({t('credits.costLabel', { cost: String(cost) })})
                    </button>
                </div>
                <select 
                    value={model} 
                    onChange={(e) => setModel(e.target.value as ImageModel)} 
                    className="form-select text-[10px] py-1 border-t border-gray-100 dark:border-gray-700 mt-1"
                    disabled={isLoading}
                >
                    <option value="gemini-3-pro-image-preview">Nano Banana Pro (Quality)</option>
                    <option value="gemini-2.5-flash-image">Nano Banana (Speed)</option>
                </select>
            </div>
          </div>
        </form>
      </div>

    </div>
  );
};

export default ChatPanel;