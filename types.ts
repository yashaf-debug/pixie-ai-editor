/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

export type AppMode = 'start' | 'editor' | 'batchGenerator' | 'generator' | 'videoGenerator' | 'businessHub' | 'adCreativeStudio' | 'contentPlanGenerator' | 'productStudio' | 'aiAssistant' | 'modelDresser' | 'virtualTryOn';

export type Tool = 'crop' | 'filter' | 'adjustment' | 'bg-remove' | 'portrait' | 'enhance' | 'combine' | 'erase' | 'expand' | 'branding' | 'chat' | 'history' | 'animate' | 'brand-kit' | 'magic-wand' | 'layers' | 'watermark';

export interface Layer {
  id: number;
  name: string;
  imageUrl: string;
  visible: boolean;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'model';
  text?: string;
  imageUrls?: string[];
  isLoading?: boolean;
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4' | '2:3';

export type ImageModel = 'gemini-3-pro-image-preview' | 'gemini-2.5-flash-image';

export interface AdCopy {
  headline: string;
  body: string;
  imagePrompt: string;
}

export interface ContentPlanItem {
  day: string;
  topic: string;
  visualIdea: string;
  sampleText: string;
  hashtags: string;
}

export interface User {
  email: string;
}

export interface BrandKit {
  logo?: string; // Stored as Data URL
  primaryColor?: string;
  secondaryColor?: string;
  font?: string;
}