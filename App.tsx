/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Crop, PixelCrop } from 'react-image-crop';
import { useLanguage } from './contexts/LanguageContext';
import Header from './components/Header';
import StartScreen from './components/StartScreen';
import EditorHeader from './components/EditorHeader';
import Toolbar from './components/Toolbar';
import ToolOptions from './components/ToolOptions';
import EditorCanvas, { EditorCanvasRef } from './components/EditorCanvas';
import GalleryModal from './components/GalleryModal';
import ModelLibraryModal from './components/ModelLibraryModal';
import ImageGenerator from './components/ImageGenerator';
import VideoGenerator from './components/VideoGenerator';
import BusinessToolsHub from './components/BusinessToolsHub';
import MarketingWizard from './components/MarketingWizard';
import ContentPlanGenerator from './components/ContentPlanGenerator';
import ProductStudio from './components/ProductStudio';
import BatchGenerator, { BatchGeneratorRef } from './components/BatchProcessor';
import AIAssistant from './components/AIAssistant';
import RestoreSessionModal from './components/RestoreSessionModal';
import PasswordModal from './components/PasswordModal';
import ModelDresser from './components/ModelDresser';
import VirtualTryOn from './components/VirtualTryOn';
import SettingsModal from './components/SettingsModal';
import { AppMode, Tool, ChatMessage, BrandKit, Layer, AspectRatio, ImageModel } from './types';
import { fileToDataURL, dataURLtoFile, getCroppedImg } from './utils';
import * as geminiService from './services/geminiService';
import { saveImageToGallery } from './services/galleryService';
import * as modelService from './services/modelService';
import * as sessionService from './services/sessionService';
import { TranslationKey } from './translations';

export const CREDIT_COSTS = {
  EDIT: 0,
  CHAT: 0,
  GENERATE_IMAGE: 0,
  GENERATE_VIDEO: 0,
  BATCH_PER_IMAGE: 0,
  BUSINESS_AD: 0,
  BUSINESS_CONTENT: 0,
  BUSINESS_PRODUCT: 0,
  PROMPT_ENHANCE: 0,
  DRESS_MODEL: 0,
  EXTRACT_MODEL: 0,
  VIRTUAL_TRY_ON: 0,
  MAGIC_SELECT: 0,
};

const App: React.FC = () => {
  const { t } = useLanguage();

  // App State
  const [isUnlocked, setIsUnlocked] = useState(() => sessionStorage.getItem('pixshop_unlocked') === 'true');
  const [appMode, setAppMode] = useState<AppMode>('start');
  const [previousAppMode, setPreviousAppMode] = useState<AppMode>('start');
  const [originalImageUrl, setOriginalImageUrl] = useState<string | null>(null);
  const [currentImageFile, setCurrentImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');

  // Brand Kit State
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [brandKit, setBrandKit] = useState<BrandKit | null>(null);

  // FIX: Added handleHistoryStepSelect function
  const handleHistoryStepSelect = async (index: number) => {
    if (index >= 0 && index < history.length) {
      setHistoryIndex(index);
      const historyItem = history[index];
      // In a real app, you would load the state from the history item
      // e.g., setLayers(historyItem.layers)
      console.log('Restoring history step:', index);
    }
  };

  // Modals State
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [isModelLibraryOpen, setIsModelLibraryOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [savedSession, setSavedSession] = useState<any | null>(null);
  const [modelLibraryMode, setModelLibraryMode] = useState<'dresser' | 'batch-set-model'>('dresser');

  // Editor State
  const [activeTool, setActiveTool] = useState<Tool | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [layers, setLayers] = useState<Layer[]>([]);
  const [redoStack, setRedoStack] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<number | null>(null);

  // Tool-specific state
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>();
  const [brushSize, setBrushSize] = useState(40);
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [animatePrompt, setAnimatePrompt] = useState('');
  const [selectedModelFile, setSelectedModelFile] = useState<File | null>(null);
  const [generatorInitialPrompt, setGeneratorInitialPrompt] = useState('');

  const editorCanvasRef = useRef<EditorCanvasRef>(null);
  const batchProcessorRef = useRef<BatchGeneratorRef>(null);

  const canUndo = layers.length > 1;
  const canRedo = redoStack.length > 0;

  // Effect to update currentImageFile whenever active layer changes
  useEffect(() => {
    if (activeLayerId) {
      const activeLayer = layers.find(l => l.id === activeLayerId);
      if (activeLayer) {
        const file = dataURLtoFile(activeLayer.imageUrl, `${activeLayer.name}.png`);
        setCurrentImageFile(file);
      }
    }
  }, [activeLayerId, layers]);

  const loadBrandKit = useCallback(() => {
    // Use a generic key since there is no login
    const savedKit = localStorage.getItem(`pixshop_brandkit_generic`);
    if (savedKit) {
      setBrandKit(JSON.parse(savedKit));
    } else {
      setBrandKit(null);
    }
  }, []);

  useEffect(() => {
    loadBrandKit();
  }, [loadBrandKit]);

  // Check for saved session on app load
  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionData = await sessionService.getSession();
        if (sessionData && sessionData.layers && Array.isArray(sessionData.layers) && sessionData.layers.length > 0) {
          setSavedSession(sessionData);
        } else {
          await sessionService.deleteSession();
        }
      } catch (e) {
        console.error("Failed to load saved session", e);
        await sessionService.deleteSession();
      }
    };
    checkSession();
  }, []);

  // Auto-save the editor state
  const autoSaveTimeoutRef = useRef<number | null>(null);
  useEffect(() => {
    if (appMode === 'editor' && layers.length > 0) {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
      autoSaveTimeoutRef.current = window.setTimeout(() => {
        const sessionData = {
          layers,
          redoStack,
          activeLayerId,
          originalImageUrl,
          imageName: currentImageFile?.name || 'untitled.png',
        };
        sessionService.saveSession(sessionData).catch(e => {
          if (e instanceof DOMException && e.name === 'QuotaExceededError') {
            console.warn('Auto-save failed: Browser storage is full. Your session might not be restored if you close the tab.');
          } else {
            console.error('Failed to auto-save session:', e);
          }
        });
      }, 1500); // Debounce for 1.5 seconds
    }
  }, [layers, redoStack, activeLayerId, appMode, originalImageUrl, currentImageFile]);

  const handleUnlockApp = () => {
    sessionStorage.setItem('pixshop_unlocked', 'true');
    setIsUnlocked(true);
  };

  const handleSaveBrandKit = (kit: BrandKit) => {
    setBrandKit(kit);
    try {
      localStorage.setItem(`pixshop_brandkit_generic`, JSON.stringify(kit));
      alert('Brand Kit saved!');
    } catch (e) {
      console.error("Failed to save Brand Kit:", e);
      if (e instanceof DOMException && e.name === 'QuotaExceededError') {
        alert('Failed to save Brand Kit. Your browser storage is full. Please clear some space (e.g., in the gallery) and try again.');
      } else {
        alert('An unknown error occurred while saving the Brand Kit.');
      }
    }
  };

  // Pass-through function, effectively removing the guard
  const proActionGuard = (action: () => void, cost: number) => {
    action();
  };

  const handleGenerateVideo = async () => {
    setAppMode('videoGenerator');
  };

  const handleToolSelect = (tool: Tool | null) => {
    setIsExporting(false);
    setActiveTool(tool);
    setCrop(undefined);
    setAspect(undefined);
    setMaskDataUrl(null);
  };

  const addLayer = (newImageUrl: string, name: string) => {
    const newLayer: Layer = {
      id: Date.now(),
      name,
      imageUrl: newImageUrl,
      visible: true,
    };
    setLayers(prev => [...prev, newLayer]);
    setActiveLayerId(newLayer.id);
    setRedoStack([]); // Clear redo stack on new action
  };

  const handleNewImageFile = async (file: File) => {
    await sessionService.deleteSession();
    const dataUrl = await fileToDataURL(file);
    const initialLayer: Layer = {
      id: Date.now(),
      name: 'Original',
      imageUrl: dataUrl,
      visible: true,
    };
    setLayers([initialLayer]);
    setActiveLayerId(initialLayer.id);
    setRedoStack([]);
    setOriginalImageUrl(dataUrl);
    setCurrentImageFile(file);
    setAppMode('editor');
    resetEditorState();
  };

  const handleFileSelect = async (files: FileList | null) => {
    if (files && files[0]) {
      await handleNewImageFile(files[0]);
    }
  };

  const resetEditorState = () => {
    setActiveTool(null);
    setIsExporting(false);
    setZoom(1);
    setCrop(undefined);
    setCompletedCrop(undefined);
    setAspect(undefined);
    setMaskDataUrl(null);
  };

  const handleSwitchMode = (mode: AppMode) => {
    if (mode === 'start') {
      sessionService.deleteSession();
      setLayers([]);
      setRedoStack([]);
      setActiveLayerId(null);
      setOriginalImageUrl(null);
      setCurrentImageFile(null);
      setGeneratorInitialPrompt('');
      resetEditorState();
    }
    setAppMode(mode);
  };

  const handleUndo = () => {
    if (!canUndo) return;
    const lastLayer = layers[layers.length - 1];
    setLayers(layers.slice(0, -1));
    setRedoStack([lastLayer, ...redoStack]);
    setActiveLayerId(layers[layers.length - 2]?.id || null);
  };
  const handleRedo = () => {
    if (!canRedo) return;
    const nextLayer = redoStack[0];
    setLayers([...layers, nextLayer]);
    setRedoStack(redoStack.slice(1));
    setActiveLayerId(nextLayer.id);
  };
  const handleReset = () => {
    setLayers(layers.slice(0, 1));
    setRedoStack([]);
    setActiveLayerId(layers[0]?.id || null);
  };

  const runGeminiAction = async (
    action: () => Promise<string>,
    loadingMsg: string,
    cost: number,
    updateHistoryOnSuccess = true
  ): Promise<string | void> => {

    const execute = async (): Promise<string | void> => {
      setIsLoading(true);
      setLoadingMessage(loadingMsg);
      try {
        const resultDataUrl = await action();
        if (updateHistoryOnSuccess) {
          addLayer(resultDataUrl, loadingMsg.replace('...', ''));
          setActiveTool(null);
        }
        return resultDataUrl;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        alert(t('app.errorTitle') + ' ' + message);
      } finally {
        setIsLoading(false);
        setLoadingMessage('');
      }
    };

    return execute();
  };

  // Costs are now ignored (0)
  const editCost = 0;

  const handleApplyFilter = (prompt: string, aspectRatio?: AspectRatio, model?: ImageModel) => runGeminiAction(() => geminiService.applyFilter(currentImageFile!, prompt, aspectRatio, model), t('app.loadingFilters'), editCost);
  const handleApplyAdjustment = (prompt: string, aspectRatio?: AspectRatio, model?: ImageModel) => runGeminiAction(() => geminiService.applyFilter(currentImageFile!, prompt, aspectRatio, model), t('app.loadingAdjustments'), editCost);
  const handleRemoveBackground = () => runGeminiAction(() => geminiService.removeBackground(currentImageFile!), t('app.loadingBgRemove'), editCost);
  const handleEnhance = () => runGeminiAction(() => geminiService.applyFilter(currentImageFile!, 'Subtly enhance the image quality, improving sharpness, clarity, and color balance without making it look artificial.'), t('app.loadingEnhance'), editCost);
  const handleApplyPortraitEnhancement = (prompt: string) => runGeminiAction(() => geminiService.applyFilter(currentImageFile!, prompt), t('app.loadingPortrait'), editCost);
  const handleCombine = (images: File[], prompt: string, aspectRatio: AspectRatio, model?: ImageModel) => runGeminiAction(() => geminiService.combineImages(images, prompt, aspectRatio, model), t('app.loadingCombine'), editCost);
  const handleApplyBranding = (logo: File, prompt: string) => runGeminiAction(() => geminiService.applyBranding(currentImageFile!, logo, prompt), t('app.loadingBranding'), editCost);
  const handleApplyWatermark = (watermark: File) => runGeminiAction(() => geminiService.applyWatermark(currentImageFile!, watermark), t('app.loadingWatermark'), editCost);
  const handleApplyErase = (prompt: string) => {
    if (!maskDataUrl) return;
    const maskFile = dataURLtoFile(maskDataUrl, 'mask.png');
    runGeminiAction(() => geminiService.eraseAndReplace(currentImageFile!, maskFile, prompt), t('app.loadingErase'), editCost);
  };
  const handleApplyExpand = (prompt: string, newWidth: number, newHeight: number, imageX: number, imageY: number) => {
    const expandAction = async () => {
      if (!editorCanvasRef.current) throw new Error("Editor canvas not available.");
      const compositeDataUrl = await editorCanvasRef.current.getFinalCanvasAsDataURL();
      if (!compositeDataUrl) throw new Error("Could not get composite image.");
      const compositeFile = dataURLtoFile(compositeDataUrl, 'composite.png');
      return geminiService.expandImage(compositeFile, prompt, newWidth, newHeight, imageX, imageY);
    };
    runGeminiAction(expandAction, t('app.loadingExpand'), editCost);
  };

  const handleMagicWandClick = async (coords: { x: number; y: number }) => {
    if (!currentImageFile) return;
    setMaskDataUrl(null);

    const resultMask = await runGeminiAction(
      () => geminiService.getMaskForObjectAtPoint(currentImageFile, coords),
      t('app.loadingSelecting'),
      editCost,
      false
    );

    if (resultMask && typeof resultMask === 'string') {
      setMaskDataUrl(resultMask);
    }
  };

  const handleApplyBrandStyle = () => {
    if (!brandKit || !currentImageFile) return;
    let prompt = 'Stylize this image according to the brand guidelines.';
    if (brandKit.primaryColor) prompt += ` The primary color is ${brandKit.primaryColor}.`;
    if (brandKit.secondaryColor) prompt += ` The secondary color is ${brandKit.secondaryColor}.`;
    if (brandKit.font) prompt += ` The brand font is ${brandKit.font}, so any text should have a similar feel.`;
    prompt += ' The style should be modern, clean, and professional.';

    runGeminiAction(
      () => geminiService.applyFilter(currentImageFile, prompt),
      t('app.loadingBrandStyle'),
      editCost
    );
  };

  const handleAnimateImage = async (prompt: string) => {
    proActionGuard(async () => {
      if (!currentImageFile) return;
      setAnimatePrompt(prompt);
      setAppMode('videoGenerator');
    }, editCost);
  };

  const handleSaveAsModel = async () => {
    if (!currentImageFile) return;
    const modelDataUrl = await runGeminiAction(
      () => geminiService.extractModelFromImage(currentImageFile),
      t('app.loadingExtractingModel'),
      editCost,
      false // Do not update history
    );

    if (modelDataUrl && typeof modelDataUrl === 'string') {
      try {
        const modelFile = dataURLtoFile(modelDataUrl, `extracted-model-${Date.now()}.png`);
        await modelService.saveModel(modelFile);
        alert(t('app.saveModelSuccess'));
        setActiveTool(null);
      } catch (err) {
        alert(t('app.saveModelError'));
        console.error(err);
      }
    }
  };

  const handleUseModel = (file: File) => {
    proActionGuard(() => {
      setSelectedModelFile(file);
      setAppMode('modelDresser');
      setIsModelLibraryOpen(false);
    }, editCost);
  };

  const handleModelSelect = (file: File) => {
    if (modelLibraryMode === 'batch-set-model') {
      batchProcessorRef.current?.setModel(file);
      setIsModelLibraryOpen(false);
    } else { // dresser
      handleUseModel(file);
    }
  };

  const handleApplyCrop = async () => {
    if (completedCrop && editorCanvasRef.current) {
      const compositeDataUrl = await editorCanvasRef.current.getFinalCanvasAsDataURL();
      if (!compositeDataUrl) return;

      const displayImageElement = editorCanvasRef.current.getImageElement();
      if (!displayImageElement) return;

      const sourceImage = new Image();
      sourceImage.src = compositeDataUrl;
      await new Promise(resolve => { sourceImage.onload = resolve; });

      const scaleX = sourceImage.naturalWidth / displayImageElement.width;
      const scaleY = sourceImage.naturalHeight / displayImageElement.height;

      const cropX = completedCrop.x * scaleX;
      const cropY = completedCrop.y * scaleY;
      const cropWidth = completedCrop.width * scaleX;
      const cropHeight = completedCrop.height * scaleY;

      const canvas = document.createElement('canvas');
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(
        sourceImage,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );

      const croppedImageUrl = canvas.toDataURL('image/png');
      addLayer(croppedImageUrl, 'Crop');
      setActiveTool(null);
    }
  };

  const handleSaveToGallery = async () => {
    if (editorCanvasRef.current) {
      try {
        const finalDataUrl = await editorCanvasRef.current.getFinalCanvasAsDataURL();
        if (!finalDataUrl) throw new Error("Could not generate image data");

        const file = dataURLtoFile(finalDataUrl, `edited-image-${Date.now()}.png`);
        await saveImageToGallery(file);
        alert(t('app.saveSuccess'));
      } catch (err) {
        console.error(err);
        alert(t('app.saveError'));
      }
    } else if (currentImageFile) {
      // Fallback if canvas ref is not available
      try {
        await saveImageToGallery(currentImageFile);
        alert(t('app.saveSuccess'));
      } catch (err) {
        alert(t('app.saveError'));
      }
    }
  };

  const handleSendChatMessage = async (prompt: string, files: File[], aspectRatio?: AspectRatio, model?: ImageModel) => {
    proActionGuard(async () => {
      const userMessageId = Date.now();
      const filesToSend = files;

      const allFileUrls = await Promise.all(filesToSend.map(fileToDataURL));

      const userMessage: ChatMessage = { id: userMessageId, role: 'user', text: prompt, imageUrls: allFileUrls };
      const historyForApi = [...chatMessages, userMessage];

      setChatMessages(prev => [
        ...prev,
        userMessage,
        { id: userMessageId + 1, role: 'model', isLoading: true },
      ]);

      try {
        const response = await geminiService.chat(historyForApi, prompt, filesToSend, model, aspectRatio);
        setChatMessages(prev => prev.map(msg => msg.id === userMessageId + 1 ? { ...response, id: userMessageId + 1 } : msg));

        if (appMode === 'editor' && response.imageUrls && response.imageUrls[0]) {
          addLayer(response.imageUrls[0], `Chat: ${prompt.substring(0, 20)}...`);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown chat error";
        setChatMessages(prev => prev.map(msg => msg.id === userMessageId + 1 ? { id: userMessageId + 1, role: 'model', text: `Error: ${errorMessage}` } : msg));
      }
    }, editCost);
  };

  const handleExport = async (format: 'png' | 'jpeg', quality: number, enhance: boolean) => {
    const finalImage = await editorCanvasRef.current?.getFinalCanvasAsDataURL();
    if (!finalImage) return;

    setIsLoading(true);
    setLoadingMessage(t('app.loadingExport'));

    try {
      const response = await fetch(finalImage);
      const blob = await response.blob();
      const imageBitmap = await createImageBitmap(blob);

      const scale = enhance ? 2 : 1;
      const canvas = document.createElement('canvas');
      canvas.width = imageBitmap.width * scale;
      canvas.height = imageBitmap.height * scale;

      const needsAlpha = format === 'png';
      const ctx = canvas.getContext('2d', { alpha: needsAlpha });

      if (!ctx) {
        throw new Error("Could not create canvas context");
      }

      if (!needsAlpha) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      ctx.drawImage(imageBitmap, 0, 0, canvas.width, canvas.height);

      const mimeType = `image/${format}`;
      const qualityArgument = quality / 100;

      canvas.toBlob((outputBlob) => {
        if (!outputBlob) {
          throw new Error("Failed to create blob from canvas.");
        }

        const url = URL.createObjectURL(outputBlob);
        const link = document.createElement('a');
        link.download = `pixshop-export.${format === 'jpeg' ? 'jpg' : format}`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        imageBitmap.close(); // Clean up memory
        setIsLoading(false);
        setIsExporting(false);
      }, mimeType, qualityArgument);

    } catch (err) {
      setIsLoading(false);
      setIsExporting(false);
      const message = err instanceof Error ? err.message : 'Unknown error during export.';
      alert(t('app.errorTitle') + ' ' + message);
      console.error(err);
    }
  };

  const handleEnhancePrompt = async (prompt: string): Promise<string> => {
    return new Promise((resolve) => {
      proActionGuard(async () => {
        const originalLoading = isLoading;
        const originalMessage = loadingMessage;
        setIsLoading(true);
        setLoadingMessage(t('app.loadingEnhancePrompt'));
        try {
          const newPrompt = await geminiService.enhancePrompt(prompt);
          resolve(newPrompt);
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown error';
          alert(t('app.errorTitle') + ' ' + message);
          resolve(prompt); // resolve with original on error
        } finally {
          setIsLoading(originalLoading);
          setLoadingMessage(originalMessage);
        }
      }, editCost);
    });
  };

  const initializeAndSwitchToAssistant = () => {
    if (chatMessages.length === 0) {
      setChatMessages([
        {
          id: Date.now(),
          role: 'model',
          text: t('aiAssistant.welcomeMessage'),
        }
      ]);
    }
    setAppMode('aiAssistant');
  };

  const handleRestoreSession = () => {
    if (savedSession) {
      setLayers(savedSession.layers);
      setRedoStack(savedSession.redoStack || []);
      setActiveLayerId(savedSession.activeLayerId);
      setOriginalImageUrl(savedSession.originalImageUrl);
      const restoredFile = dataURLtoFile(savedSession.layers.find((l: Layer) => l.id === savedSession.activeLayerId)?.imageUrl || savedSession.layers[0].imageUrl, savedSession.imageName);
      setCurrentImageFile(restoredFile);
      setAppMode('editor');
      resetEditorState();
      sessionService.deleteSession();
      setSavedSession(null);
    }
  };

  const handleDiscardSession = () => {
    sessionService.deleteSession();
    setSavedSession(null);
  };

  const handleSetLayerVisibility = (id: number, visible: boolean) => {
    setLayers(layers.map(l => l.id === id ? { ...l, visible } : l));
  };

  const handleDeleteLayer = (id: number) => {
    if (layers.length <= 1) return; // Cannot delete the last layer
    setLayers(layers.filter(l => l.id !== id));
    if (activeLayerId === id) {
      setActiveLayerId(layers[layers.length - 2]?.id || null);
    }
  };

  const handleMoveLayer = (id: number, direction: 'up' | 'down') => {
    const index = layers.findIndex(l => l.id === id);
    if (index === -1) return;

    const newLayers = [...layers];
    const item = newLayers.splice(index, 1)[0];

    if (direction === 'up' && index < newLayers.length) {
      newLayers.splice(index + 1, 0, item);
    } else if (direction === 'down' && index > 0) {
      newLayers.splice(index - 1, 0, item);
    } else {
      return; // No change
    }
    setLayers(newLayers);
  };

  const renderContent = () => {
    if (!isUnlocked) {
      return <PasswordModal onUnlock={handleUnlockApp} />;
    }

    switch (appMode) {
      case 'start':
        return <StartScreen
          onFileSelect={handleFileSelect}
          onGenerateClick={() => proActionGuard(() => {
            setPreviousAppMode('start');
            setAppMode('generator');
          }, editCost)}
          onGenerateVideoClick={() => proActionGuard(handleGenerateVideo, editCost)}
          onBusinessClick={() => proActionGuard(() => setAppMode('businessHub'), 0)}
          onBatchGenerateClick={() => proActionGuard(() => setAppMode('batchGenerator'), editCost)}
          onAIAssistantClick={() => proActionGuard(initializeAndSwitchToAssistant, editCost)}
          onMyModelsClick={() => proActionGuard(() => {
            setModelLibraryMode('dresser');
            setIsModelLibraryOpen(true);
          }, 0)}
          onVirtualTryOnClick={() => proActionGuard(() => setAppMode('virtualTryOn'), 0)}
        />;
      case 'generator':
        return <ImageGenerator
          onBack={() => {
            setGeneratorInitialPrompt('');
            setAppMode(previousAppMode);
          }}
          initialPrompt={generatorInitialPrompt}
          onImageSelect={handleNewImageFile}
          onEnhancePrompt={handleEnhancePrompt}
        />;
      case 'videoGenerator':
        return <VideoGenerator onBack={() => handleSwitchMode('start')} initialPrompt={animatePrompt} initialImageFile={currentImageFile} onEnhancePrompt={handleEnhancePrompt} />;
      case 'businessHub':
        return <BusinessToolsHub onBack={() => handleSwitchMode('start')} onNavigate={setAppMode} />;
      case 'adCreativeStudio':
        return <MarketingWizard onBackToHub={() => setAppMode('businessHub')} onCreativeSelect={handleNewImageFile} />;
      case 'contentPlanGenerator':
        return <ContentPlanGenerator
          onBack={() => setAppMode('businessHub')}
          onGenerateVisual={(prompt) => {
            setPreviousAppMode('contentPlanGenerator');
            setGeneratorInitialPrompt(prompt);
            setAppMode('generator');
          }}
        />;
      case 'productStudio':
        return <ProductStudio onBackToHub={() => setAppMode('businessHub')} onProductSelect={handleNewImageFile} onEnhancePrompt={handleEnhancePrompt} />;
      case 'batchGenerator':
        return <BatchGenerator
          ref={batchProcessorRef}
          onExit={() => handleSwitchMode('start')}
          onEnhancePrompt={handleEnhancePrompt}
          onOpenModelLibraryForSet={() => {
            setModelLibraryMode('batch-set-model');
            setIsModelLibraryOpen(true);
          }}
        />;
      case 'aiAssistant':
        return <AIAssistant
          onBack={() => handleSwitchMode('start')}
          messages={chatMessages}
          onSendMessage={(prompt, files) => handleSendChatMessage(prompt, files)}
          isLoading={isLoading}
          cost={editCost}
          onEnhancePrompt={handleEnhancePrompt}
        />;
      case 'modelDresser':
        return <ModelDresser
          onBack={() => handleSwitchMode('start')}
          onImageSelect={handleNewImageFile}
          modelFile={selectedModelFile!}
          proActionGuard={proActionGuard}
        />;
      case 'virtualTryOn':
        return <VirtualTryOn
          onBack={() => handleSwitchMode('start')}
          onImageSelect={handleNewImageFile}
          proActionGuard={proActionGuard}
        />;
      case 'editor':
        return (
          <div className="w-full h-screen flex flex-col-reverse md:flex-row overflow-hidden bg-gray-50 dark:bg-gray-900">
            {/* Desktop: Sidebar on left */}
            <Toolbar
              activeTool={activeTool}
              onSelectTool={handleToolSelect}
              isLoading={isLoading}
              numLayers={layers.length}
            />

            {/* Main content area - add bottom padding on mobile for bottom toolbar */}
            {/* Main content area - dynamic padding handled by ToolOptions existence or CSS */}
            <main className={`flex-grow flex flex-col h-full overflow-hidden relative ${!activeTool ? 'pb-20 md:pb-0' : ''}`}>
              <EditorHeader
                onUndo={handleUndo}
                onRedo={handleRedo}
                canUndo={canUndo}
                canRedo={canRedo}
                onReset={handleReset}
                zoom={zoom}
                onZoomChange={setZoom}
                onUploadNew={() => handleSwitchMode('start')}
                onSave={handleSaveToGallery}
                onToggleExport={() => {
                  setIsExporting(!isExporting);
                  setActiveTool(null);
                }}
                onSetIsPreviewing={setIsPreviewing}
                isLoading={isLoading}
              />

              <div className="flex-grow relative overflow-hidden flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/50">
                {currentImageFile && (
                  <EditorCanvas
                    ref={editorCanvasRef}
                    layers={layers}
                    activeLayerId={activeLayerId}
                    activeTool={activeTool}
                    isLoading={isLoading}
                    loadingMessage={loadingMessage}
                    zoom={zoom}
                    onZoomChange={setZoom}
                    isPreviewing={isPreviewing}
                    originalImageUrl={originalImageUrl!}
                    crop={crop}
                    onCropChange={setCrop}
                    onCropComplete={setCompletedCrop}
                    aspect={aspect}
                    brushSize={brushSize}
                    onMaskUpdate={setMaskDataUrl}
                    maskDataUrl={maskDataUrl}
                    onApplyExpand={handleApplyExpand}
                    onMagicWandClick={handleMagicWandClick}
                  />
                )}
              </div>
            </main>

            <ToolOptions
              activeTool={activeTool}
              isExporting={isExporting}
              onExport={handleExport}
              isLoading={isLoading}
              onApplyFilter={handleApplyFilter}
              onApplyAdjustment={handleApplyAdjustment}
              onRemoveBackground={handleRemoveBackground}
              onEnhance={handleEnhance}
              onApplyPortraitEnhancement={handleApplyPortraitEnhancement}
              onSaveAsModel={handleSaveAsModel}
              onCombine={handleCombine}
              onApplyBranding={handleApplyBranding}
              onApplyWatermark={handleApplyWatermark}
              onApplyErase={handleApplyErase}
              onClearEraseMask={() => setMaskDataUrl(null)}
              onApplyCrop={handleApplyCrop}
              currentImage={currentImageFile}
              aspect={aspect}
              onAspectChange={setAspect}
              onSendChatMessage={handleSendChatMessage}
              chatMessages={chatMessages}
              brushSize={brushSize}
              onBrushSizeChange={setBrushSize}
              isMaskEmpty={!maskDataUrl}
              history={history}
              historyIndex={historyIndex}
              onHistoryStepSelect={handleHistoryStepSelect}
              onAnimate={handleAnimateImage}
              cost={editCost}
              onEnhancePrompt={handleEnhancePrompt}
              brandKit={brandKit}
              onSaveBrandKit={handleSaveBrandKit}
              onApplyBrandStyle={handleApplyBrandStyle}
            />
          </div>
        );
      default:
        return <div>Unknown mode</div>;
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {appMode !== 'editor' && appMode !== 'generator' && appMode !== 'videoGenerator' && appMode !== 'businessHub' && appMode !== 'adCreativeStudio' && appMode !== 'contentPlanGenerator' && appMode !== 'productStudio' && appMode !== 'batchGenerator' && appMode !== 'aiAssistant' && appMode !== 'modelDresser' && appMode !== 'virtualTryOn' && (
        <Header
          onOpenGallery={() => setIsGalleryOpen(true)}
          appMode={appMode}
          onSwitchMode={handleSwitchMode}
          onOpenSettings={() => setIsSettingsOpen(true)}
        />
      )}

      {renderContent()}

      <GalleryModal
        isOpen={isGalleryOpen}
        onClose={() => setIsGalleryOpen(false)}
        onImageSelect={(file) => {
          handleNewImageFile(file);
          setPreviousAppMode(appMode);
        }}
      />

      <ModelLibraryModal
        isOpen={isModelLibraryOpen}
        onClose={() => setIsModelLibraryOpen(false)}
        onModelSelect={handleModelSelect}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />

      <RestoreSessionModal
        isOpen={!!savedSession && appMode === 'start' && isUnlocked}
        onRestore={handleRestoreSession}
        onDiscard={handleDiscardSession}
      />
    </div>
  );
};

export default App;