/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import { GoogleGenAI, Modality, Type, GenerateContentResponse, Part, GenerateContentParameters, Content } from "@google/genai";
import { fileToDataURL, resizeImage, cropImageToRatio } from '../utils';
import { AdCopy, AspectRatio, ContentPlanItem, ChatMessage, ImageModel } from '../types';

const STORAGE_KEY = 'pixshop_api_key';

// Prioritize Local Storage Key (User Settings) > Env Var > No Default
const getApiKey = (): string => {
    const storedKey = localStorage.getItem(STORAGE_KEY);
    if (storedKey && storedKey.trim() !== '') {
        return storedKey.trim();
    }
    const envKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (envKey && envKey !== 'undefined' && envKey !== '') {
        return envKey;
    }
    throw new Error('Gemini API Key not found. Please add your key in Settings or set VITE_GEMINI_API_KEY environment variable.');
};

// Get proxy URL if configured (for geo-unblocking)
const getProxyUrl = (): string | undefined => {
    const proxyUrl = import.meta.env.VITE_GEMINI_PROXY_URL;
    if (proxyUrl && proxyUrl !== 'undefined' && proxyUrl !== '') {
        return proxyUrl;
    }
    return undefined;
};

// Ensure fresh instance with latest key and proxy support
const getAi = () => {
    const config: any = { apiKey: getApiKey() };

    const proxyUrl = getProxyUrl();
    if (proxyUrl) {
        config.baseUrl = proxyUrl;
    }

    return new GoogleGenAI(config);
};

//
// Helper Functions
//

const getRatioDescription = (aspectRatio: string): string => {
    switch (aspectRatio) {
        case '16:9': return 'wide landscape (16:9)';
        case '9:16': return 'tall portrait (9:16)';
        case '4:3': return 'landscape (4:3)';
        case '3:4': return 'portrait (3:4)';
        case '1:1': return 'square (1:1)';
        case '2:3': return 'portrait (2:3)';
        default: return aspectRatio;
    }
};

export const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(',');
    if (arr.length < 2) {
        throw new Error('Invalid data URL');
    }
    const mimeMatch = arr[0].match(/:(.*?);/);
    if (!mimeMatch) {
        throw new Error('Could not determine mime type from data URL');
    }
    const mime = mimeMatch[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
};

const fileToGeminiPart = async (file: File): Promise<Part> => {
    const dataUrl = await fileToDataURL(file);
    const [header, data] = dataUrl.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1];
    if (!mimeType || !data) {
        throw new Error('Invalid data URL');
    }
    return {
        inlineData: {
            mimeType,
            data,
        },
    };
};

const fileToBase64 = async (file: File): Promise<string> => {
    const dataUrl = await fileToDataURL(file);
    return dataUrl.split(',')[1];
};

const extractFirstImageAsDataUrl = (response: GenerateContentResponse): string => {
    const finishReason = response.candidates?.[0]?.finishReason;
    if (finishReason && finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {
        const safetyRatings = response.candidates?.[0]?.safetyRatings;
        let safetyMessage = `Request was blocked. Reason: ${finishReason}.`;
        if (safetyRatings && safetyRatings.length > 0) {
            safetyMessage += ` Ratings: ${safetyRatings.map(r => `${r.category}: ${r.probability}`).join(', ')}`;
        }
        throw new Error(safetyMessage);
    }

    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
    }

    const text = response.text?.trim();
    if (text) {
        throw new Error(`The AI did not return an image. Instead, it responded with: "${text}"`);
    }

    throw new Error("No image found in Gemini response");
};

const withQualitySuffix = (prompt: string): string => {
    const suffix = "For the best result, the final output should be a professional-grade, high-quality, high-resolution, photorealistic image with sharp, intricate details, and excellent lighting.";
    return `${prompt.trim()} ${suffix}`;
};

const withOutputInstructions = (prompt: string): string => {
    const instruction = "The output should be a single, new, fully-rendered image that incorporates the requested changes. Please don't show a before-and-after comparison. The final result should be one complete, opaque image unless transparency is specifically requested.";
    return `${prompt.trim()} ${instruction}`;
};

const chatHistoryToGeminiContents = (history: ChatMessage[]): Content[] => {
    const contents: Content[] = [];
    for (const message of history) {
        if (message.isLoading) continue;

        const parts: Part[] = [];
        if (message.text) {
            parts.push({ text: message.text });
        }
        if (message.imageUrls) {
            for (const imageUrl of message.imageUrls) {
                const [header, data] = imageUrl.split(',');
                const mimeType = header.match(/:(.*?);/)?.[1];
                if (mimeType && data) {
                    parts.push({ inlineData: { mimeType, data } });
                }
            }
        }

        if (parts.length > 0) {
            contents.push({ role: message.role, parts });
        }
    }
    return contents;
}

//
// Image Editing & Vision Services
//

const runImageEdit = async (
    parts: Part[],
    model: string = 'gemini-3-pro-image-preview',
    aspectRatio?: AspectRatio
): Promise<string> => {
    const config: any = {
        responseModalities: [Modality.IMAGE],
    };

    // imageConfig is supported for both, but imageSize only for Pro
    config.imageConfig = {};

    if (model === 'gemini-3-pro-image-preview') {
        config.imageConfig.imageSize = '4K';
    }

    if (aspectRatio) {
        config.imageConfig.aspectRatio = aspectRatio;
    }

    let attempt = 0;
    const maxAttempts = 5;

    while (attempt < maxAttempts) {
        try {
            const response = await getAi().models.generateContent({
                model: model,
                contents: { parts },
                config: config,
            });
            return extractFirstImageAsDataUrl(response);
        } catch (error: any) {
            attempt++;
            const errorMessage = (error.message || JSON.stringify(error)).toLowerCase();

            if (errorMessage.includes('location') || errorMessage.includes('supported for the api use')) {
                throw new Error("Access Denied: The AI service is not available in your current location. Please use a VPN or a supported region.");
            }
            if (errorMessage.includes('quota') || errorMessage.includes('resource_exhausted') || error.code === 429) {
                throw new Error("Service Quota Exceeded: The free credit limit for this API key has been reached. Please add your own Google Gemini API Key in Settings to continue.");
            }

            let isRetryable =
                errorMessage.includes('500') ||
                errorMessage.includes('internal server error') ||
                errorMessage.includes('overloaded') ||
                errorMessage.includes('unavailable') ||
                errorMessage.includes('503') ||
                errorMessage.includes('proxying failed') ||
                errorMessage.includes('load failed') ||
                errorMessage.includes('network error') ||
                errorMessage.includes('failed to fetch');

            if (error.error && (error.error.code === 503 || error.error.status === 'UNAVAILABLE')) {
                isRetryable = true;
            }
            if (error.status === 503) {
                isRetryable = true;
            }

            if (isRetryable && attempt < maxAttempts) {
                console.warn(`Gemini API error for model ${model} (Network/Proxy/503), retrying (${attempt}/${maxAttempts})...`);
                await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 2000));
                continue;
            }
            throw error;
        }
    }
    throw new Error("Failed to generate image after multiple attempts due to server load or network issues.");
};

export const getMaskForObjectAtPoint = async (image: File, coords: { x: number, y: number }): Promise<string> => {
    const resized = await resizeImage(image, 1024);
    const imagePart = await fileToGeminiPart(resized);

    const originalImg = new Image();
    originalImg.src = await fileToDataURL(image);
    await new Promise(resolve => { originalImg.onload = resolve; });

    const scaleX = 1024 / originalImg.width;
    const scaleY = 1024 / Math.max(originalImg.width, originalImg.height);
    const scaledX = Math.round(coords.x * scaleX);
    const scaledY = Math.round(coords.y * scaleY);

    const prompt = `I need to select an object in this image. Please identify the main object located at coordinate (x=${scaledX}, y=${scaledY}). Then, generate a black and white mask for only that object. In the mask, the object should be white (#FFFFFF) and everything else should be black (#000000). The mask should have the same dimensions as the original image. Please output only the mask image file.`;
    return runImageEdit([imagePart, { text: prompt }], 'gemini-3-pro-image-preview');
};

export const applyFilter = async (image: File, prompt: string, aspectRatio?: AspectRatio, model: string = 'gemini-3-pro-image-preview'): Promise<string> => {
    const resized = await resizeImage(image, 1024);
    const imagePart = await fileToGeminiPart(resized);
    let fullPrompt: string;

    if (aspectRatio) {
        const ratioDescription = getRatioDescription(aspectRatio);
        const twoStepPrompt = `Please perform a two-step edit on this image. First, could you change the aspect ratio to ${ratioDescription}? Please achieve this by generatively filling any new space rather than cropping. Second, after adjusting the aspect ratio, please apply this creative edit: "${prompt}". The final result should be a single image with the new ${ratioDescription} aspect ratio.`;
        fullPrompt = withQualitySuffix(withOutputInstructions(twoStepPrompt));
    } else {
        const preservePrompt = `Please apply the following creative edit to the image: "${prompt}". It's important that the output image maintains the original aspect ratio of the input image, so please do not change its dimensions.`;
        fullPrompt = withQualitySuffix(withOutputInstructions(preservePrompt));
    }

    return runImageEdit([imagePart, { text: fullPrompt }], model, aspectRatio);
};

export const batchApplyFilter = async (images: File[], prompt: string, aspectRatio?: AspectRatio, model: string = 'gemini-3-pro-image-preview'): Promise<string[]> => {
    const promises = images.map(image => applyFilter(image, prompt, aspectRatio, model));
    const results = await Promise.allSettled(promises);
    return results.map(result => {
        if (result.status === 'fulfilled') {
            return result.value;
        } else {
            const error = result.reason as Error;
            return `Error: ${error.message || 'Unknown error'}`;
        }
    });
};

export const removeBackground = async (image: File): Promise<string> => {
    const resized = await resizeImage(image, 1024);
    const imagePart = await fileToGeminiPart(resized);
    const textPart = { text: 'Please remove the background from this image. The goal is to leave only the main subject against a transparent background. For the best result, the output should be a high-quality PNG with a clean and precise cutout, preserving fine details like strands of hair.' };
    return runImageEdit([imagePart, textPart], 'gemini-3-pro-image-preview');
};

export const combineImages = async (images: File[], prompt: string, aspectRatio: AspectRatio = '1:1', model: string = 'gemini-3-pro-image-preview'): Promise<string> => {
    const resizedImages = await Promise.all(images.map(file => resizeImage(file, 1024)));
    const imageParts = await Promise.all(resizedImages.map(fileToGeminiPart));
    const fullPrompt = `Could you please combine all the provided images into a single cohesive scene as described here: "${prompt}". The final output should be a high-quality, photorealistic image with aspect ratio ${getRatioDescription(aspectRatio)}.`;
    return runImageEdit([...imageParts, { text: withQualitySuffix(withOutputInstructions(fullPrompt)) }], model, aspectRatio);
};

export const applyBranding = async (image: File, logo: File, prompt: string, model: string = 'gemini-3-pro-image-preview'): Promise<string> => {
    const resizedImage = await resizeImage(image, 1024);
    const resizedLogo = await resizeImage(logo, 512);

    const imagePart = await fileToGeminiPart(resizedImage);
    const logoPart = await fileToGeminiPart(resizedLogo);
    const fullPrompt = `Image 1 is the main image, and Image 2 is a logo. Please apply the logo to the main image according to these instructions: ${prompt}`;
    const textPart = { text: withQualitySuffix(withOutputInstructions(fullPrompt)) };
    return runImageEdit([imagePart, logoPart, textPart], model);
};

export const applyWatermark = async (image: File, watermark: File, model: string = 'gemini-3-pro-image-preview'): Promise<string> => {
    const resizedImage = await resizeImage(image, 1024);
    const resizedWatermark = await resizeImage(watermark, 512);

    const imagePart = await fileToGeminiPart(resizedImage);
    const watermarkPart = await fileToGeminiPart(resizedWatermark);

    const prompt = `
    Image 1 is the main content. Image 2 is a watermark logo.
    TASK: Apply a "copyright protection" pattern using the watermark over the main image.
    
    CRITICAL INSTRUCTIONS FOR ADVERSARIAL PROTECTION:
    1. PLACEMENT: Do NOT place the watermark in empty space. You MUST place repeated instances of the watermark covering high-frequency detail areas, specifically FACES, EYES, HAIR, and complex textures.
    2. PATTERN: Use a diagonal tiling pattern or a randomized scatter pattern.
    3. VISIBILITY: The watermark should be clearly visible but semi-transparent (around 40% opacity).
    4. GOAL: The goal is to make it extremely hard for an AI inpainting model to remove the watermark without destroying the subject's identity or key details.
    
    OUTPUT DIMENSIONS: The output image MUST maintain the exact same aspect ratio and framing as Image 1. Do NOT crop, zoom, or rotate the image.

    Output the protected image.
    `;

    return runImageEdit([imagePart, watermarkPart, { text: prompt }], model);
};

export const eraseAndReplace = async (image: File, mask: File, prompt: string, model: string = 'gemini-3-pro-image-preview'): Promise<string> => {
    const resizedImage = await resizeImage(image, 1024);
    const resizedMask = await resizeImage(mask, 1024);

    const imagePart = await fileToGeminiPart(resizedImage);
    const maskPart = await fileToGeminiPart(resizedMask);
    const fullPrompt = `Please use the white areas of the provided mask to edit the original image with the following instruction: ${prompt}`;
    const textPart = { text: withQualitySuffix(withOutputInstructions(fullPrompt)) };
    return runImageEdit([imagePart, maskPart, textPart], model);
};

export const expandImage = async (image: File, prompt: string, newWidth: number, newHeight: number, imageX: number, imageY: number, model: string = 'gemini-3-pro-image-preview'): Promise<string> => {
    const canvas = document.createElement('canvas');
    canvas.width = newWidth;
    canvas.height = newHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not get canvas context");

    const img = new Image();
    img.src = await fileToDataURL(image);
    await new Promise(resolve => img.onload = resolve);

    ctx.drawImage(img, imageX, imageY);
    const compositeDataUrl = canvas.toDataURL('image/png');
    const compositeFile = dataURLtoFile(compositeDataUrl, 'composite.png');
    const resizedComposite = await resizeImage(compositeFile, 1024);

    const imagePart = await fileToGeminiPart(resizedComposite);
    const fullPrompt = `This image contains transparent areas that need to be filled. Please fill in these transparent areas based on the following creative idea: "${prompt}". The goal is to blend the original image seamlessly into the new, expanded background.`;
    const textPart = { text: withQualitySuffix(withOutputInstructions(fullPrompt)) };
    return runImageEdit([imagePart, textPart], model);
};

export const chat = async (
    history: ChatMessage[],
    prompt: string,
    images: File[],
    model: string = 'gemini-3-pro-image-preview',
    aspectRatio?: AspectRatio
): Promise<ChatMessage> => {
    const hasImages = images.length > 0;

    if (hasImages) {
        const parts: Part[] = [];
        const resizedImages = await Promise.all(images.map(file => resizeImage(file, 1024)));
        const imageParts = await Promise.all(resizedImages.map(fileToGeminiPart));
        parts.push(...imageParts);

        const imageEditingInstruction = "As an AI image editing assistant, your task is to modify an input image based on a text prompt. Please return a new, high-quality photorealistic image with the requested changes. The output should be a single, complete image. You may include a short text explanation. The user's request is: ";
        let finalPrompt = imageEditingInstruction + (prompt || "Enhance this image slightly.");

        if (aspectRatio) {
            finalPrompt += ` Please ensure the output image has an aspect ratio of ${aspectRatio}.`;
        }

        parts.push({ text: finalPrompt });

        const config: any = { responseModalities: [Modality.IMAGE] };
        config.imageConfig = {};
        if (model === 'gemini-3-pro-image-preview') {
            config.imageConfig.imageSize = '4K';
        }
        if (aspectRatio) {
            config.imageConfig.aspectRatio = aspectRatio;
        }

        const response = await getAi().models.generateContent({
            model: model,
            contents: { parts },
            config: config,
        });

        const responseTextParts: string[] = [];
        const responseImageUrls: string[] = [];

        const finishReason = response.candidates?.[0]?.finishReason;
        if (finishReason && finishReason !== 'STOP' && finishReason !== 'MAX_TOKENS') {
            return { id: Date.now(), role: 'model', text: `Request was blocked. Reason: ${finishReason}.` };
        }

        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.text) {
                responseTextParts.push(part.text);
            } else if (part.inlineData) {
                responseImageUrls.push(`data:${part.inlineData.mimeType};base64,${part.inlineData.data}`);
            }
        }

        return {
            id: Date.now(),
            role: 'model',
            text: responseTextParts.join('\n').trim(),
            imageUrls: responseImageUrls,
        };

    } else {
        const historyContents = chatHistoryToGeminiContents(history);
        const newContent: Content = { role: 'user', parts: [{ text: prompt }] };

        // Use gemini-3-pro-preview for text-only chat
        const response = await getAi().models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: [...historyContents, newContent],
            config: {
                systemInstruction: 'You are Pixo, a friendly and expert AI creative assistant.',
            },
        });

        return {
            id: Date.now(),
            role: 'model',
            text: response.text,
            imageUrls: [],
        };
    }
};

//
// Virtual Try-On (Pure Google Gemini Implementation)
//

export const performVirtualTryOn = async (
    userImage: File | null,
    clothingItems: { file: File, instruction: string }[],
    onProgress: (status: string) => void,
    model: string = 'gemini-3-pro-image-preview',
    modelDescription: string = '',
    aspectRatio: AspectRatio = '9:16'
): Promise<string> => {

    onProgress('processing');

    const parts: Part[] = [];

    // 1. Prepare User Image Part (if exists)
    if (userImage) {
        // Reduced to 800 to avoid payload size issues/timeouts with multiple images
        const resizedUser = await resizeImage(userImage, 800, 'jpeg');
        const userPart = await fileToGeminiPart(resizedUser);
        parts.push(userPart);
    }

    // 2. Prepare Clothing Image Parts
    for (const item of clothingItems) {
        // Reduced to 800 to avoid payload size issues/timeouts with multiple images
        const resizedClothing = await resizeImage(item.file, 800, 'jpeg');
        const clothingPart = await fileToGeminiPart(resizedClothing);
        parts.push(clothingPart);
    }

    // 3. Construct System Prompt based on input
    let prompt = "";
    const ratioDesc = getRatioDescription(aspectRatio);

    const baseIndex = userImage ? 2 : 1;
    const itemInstructions = clothingItems.map((item, i) => {
        const imgIndex = baseIndex + i;
        return `- Item from Image ${imgIndex}: ${item.instruction.trim() || "Use this garment exactly as shown."}`;
    }).join('\n    ');

    if (userImage) {
        const numClothingItems = clothingItems.length;
        const clothingDescription = numClothingItems > 1 ? "ALL the provided CLOTHING ITEMS" : "the GARMENT from Image 2";

        prompt = `Act as a professional fashion stylist and photo editor.
        Image 1 is the MODEL. The subsequent images are CLOTHING ITEMS.
        
        TASK: Dress the MODEL in ${clothingDescription}.
        
        SPECIFIC INSTRUCTIONS FOR ITEMS:
        ${itemInstructions}
        
        ADDITIONAL INSTRUCTIONS:
        ${modelDescription ? `- ${modelDescription}` : ''}
        
        CRITICAL RULES:
        - Keep the MODEL'S face, hair, body shape, and pose exactly as they are in Image 1 unless the additional instructions say otherwise.
        - The GARMENT(S) from the subsequent images must be applied realistically to the model's body, respecting physics, folds, and lighting.
        - PRESERVE the garment's texture, logo, text, and pattern exactly as shown in the clothing images. Do not hallucinate new patterns.
        - Style any missing items (e.g., if only a top is provided, generate matching pants/shoes) to create a complete look.
        - Output a single, high-fidelity, photorealistic 8k image.
        - The output image aspect ratio should be ${ratioDesc}.`;
    } else {
        // Generation mode (no user model)
        const desc = modelDescription.trim() ? modelDescription : "a professional fashion model suitable for the clothing style";
        prompt = `Act as a professional fashion stylist.
        The provided images are CLOTHING ITEMS.
        
        TASK: Generate a photorealistic fashion model wearing ALL these items.
        
        SPECIFIC INSTRUCTIONS FOR ITEMS:
        ${itemInstructions}
        
        CRITICAL RULES:
        - Create ${desc}.
        - Choose a suitable pose and background.
        - PRESERVE the garment's texture, logo, text, and pattern exactly as shown in the clothing images.
        - Ensure a cohesive, high-fashion look.
        - Output a single, high-fidelity, photorealistic 8k image.
        - The output image aspect ratio should be ${ratioDesc}.`;
    }

    // 4. Send to Gemini
    return runImageEdit([...parts, { text: withQualitySuffix(prompt) }], model, aspectRatio);
};

export const dressSavedModel = async (modelImage: File, clothingImage: File, aspectRatio: AspectRatio = '9:16', model: string = 'gemini-3-pro-image-preview'): Promise<string> => {
    return performVirtualTryOn(modelImage, [{ file: clothingImage, instruction: "Dress the model in this." }], () => { }, model, '', aspectRatio);
};

export const generateBaseAndTryOn = async (
    clothingImage: File,
    scenePrompt: string,
    category: 'upper_body' | 'lower_body' | 'dresses',
    onProgress: (status: string) => void,
    model: string = 'gemini-3-pro-image-preview'
): Promise<string> => {
    const description = `a professional model in a ${scenePrompt || "studio setting"}`;
    return performVirtualTryOn(null, [{ file: clothingImage, instruction: "Use this item." }], onProgress, model, description, '9:16');
};

export const extractModelFromImage = async (image: File, model: string = 'gemini-3-pro-image-preview'): Promise<string> => {
    const resized = await resizeImage(image, 1024);
    const imagePart = await fileToGeminiPart(resized);
    const textPart = { text: "Create a new image featuring the person from the original photo. Preserve the person's original face and head. Generate a new, full-body, photorealistic figure matching the person's physique, neutral pose, simple neutral clothing. 9:16 aspect ratio." };
    return runImageEdit([imagePart, textPart], model, '9:16');
};


export const dressModelAndApplyScene = async (modelImage: File, clothingImage: File, scenePrompt: string, aspectRatio: string, model: string = 'gemini-3-pro-image-preview'): Promise<string> => {
    return performVirtualTryOn(modelImage, [{ file: clothingImage, instruction: "Dress the model in this." }], () => { }, model, '', aspectRatio as AspectRatio);
};

export const generatePhotoshootSequence = async (
    clothingFile: File,
    basePrompt: string,
    shotPrompts: string[],
    aspectRatio: AspectRatio,
    model: string = 'gemini-3-pro-image-preview'
): Promise<string[]> => {
    const promises = shotPrompts.map(shotPrompt => {
        const fullDescription = basePrompt ? `${basePrompt}. ${shotPrompt}` : shotPrompt;
        return performVirtualTryOn(
            null,
            [{ file: clothingFile, instruction: "Use this item." }],
            () => { },
            model,
            fullDescription,
            aspectRatio
        );
    });

    return Promise.all(promises);
};


//
// Text Generation Services
//

export const generateTextFromPrompt = async (prompt: string): Promise<string> => {
    const response = await getAi().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
    });
    return response.text as string;
};

export const generateSpeech = async (text: string): Promise<string> => {
    const response = await getAi().models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("Audio generation failed, no audio data received.");
    }
    return base64Audio;
};

export const enhancePrompt = async (prompt: string): Promise<string> => {
    const fullPrompt = `You are a creative assistant that enhances prompts for an AI image generator. Take the user's input and make it more vivid, descriptive, and detailed. Add details about style, lighting, composition, and mood. Return only the enhanced prompt, without any extra text or labels. The user's prompt is: "${prompt}"`;
    const response = await getAi().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: fullPrompt,
    });
    return response.text?.trim() || prompt;
};

export const generateAdCopy = async (
    info: { name: string; description: string; benefits: string; audience: string, cta: string, tone: string }
): Promise<AdCopy[]> => {
    const prompt = `
        Generate 3 distinct, highly creative, and professional-grade ad creatives for a product.
        Product Name: ${info.name}
        Description: ${info.description}
        Key Benefits: ${info.benefits}
        Target Audience: ${info.audience}
        Call to Action: ${info.cta}
        Tone of voice: ${info.tone}
        For each creative, provide a headline, body text, and a visual concept prompt for an AI image generator.
    `;
    const response = await getAi().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        headline: { type: Type.STRING },
                        body: { type: Type.STRING },
                        imagePrompt: { type: Type.STRING },
                    },
                    required: ['headline', 'body', 'imagePrompt'],
                },
            },
        },
    });

    return JSON.parse(response.text!) as AdCopy[];
};

export const generateContentPlan = async (topic: string, language: string): Promise<ContentPlanItem[]> => {
    const prompt = `
        Create a 7-day, professional-grade social media content plan for the topic: "${topic}".
        The plan should be in ${language === 'ru' ? 'Russian' : 'English'}.
        For each day, provide:
        1. Day of the week.
        2. A specific, engaging post topic.
        3. A detailed visual idea that can be used as a prompt for an AI image generator.
        4. A sample caption for the post.
        5. A list of relevant hashtags.
    `;
    const response = await getAi().models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
            responseMimeType: 'application/json',
            responseSchema: {
                type: Type.ARRAY,
                items: {
                    type: Type.OBJECT,
                    properties: {
                        day: { type: Type.STRING },
                        topic: { type: Type.STRING },
                        visualIdea: { type: Type.STRING },
                        sampleText: { type: Type.STRING },
                        hashtags: { type: Type.STRING },
                    },
                    required: ['day', 'topic', 'visualIdea', 'sampleText', 'hashtags'],
                },
            },
        },
    });

    return JSON.parse(response.text!) as ContentPlanItem[];
};

export const generateProductScene = async (productImage: File, scenePrompt: string, aspectRatio: AspectRatio = '1:1', model: string = 'gemini-3-pro-image-preview'): Promise<string[]> => {
    const imagePart = await fileToGeminiPart(productImage);
    const textPart = { text: `Please take the isolated product from the provided image and place it realistically into the following scene: "${scenePrompt}". The final images should be professional-grade, photorealistic, high-resolution, with sharp details and professional lighting.` };

    // Execute 4 parallel requests to generate 4 variations
    const promises = [];
    for (let i = 0; i < 4; i++) {
        promises.push(runImageEdit([imagePart, textPart], model, aspectRatio));
    }

    const results = await Promise.allSettled(promises);
    return results
        .filter(r => r.status === 'fulfilled')
        .map(r => (r as PromiseFulfilledResult<string>).value);
};

export const generateImagesFromPrompt = async (prompt: string, numImages: number, aspectRatio: AspectRatio, model: string = 'gemini-3-pro-image-preview'): Promise<string[]> => {
    const enhancedPrompt = `${prompt.trim()}, 8k uhd, masterpiece, intricate textures, maximum detail, professional-grade photography, photorealistic, sharp focus, exceptional lighting, high fidelity`;

    let targetRatio = aspectRatio;
    let needsCrop = false;

    // Handle unsupported aspect ratios for both models
    if (aspectRatio === '2:3') {
        targetRatio = '3:4'; // Generate closest supported vertical ratio
        needsCrop = true;
    }

    if (model === 'gemini-3-pro-image-preview' || model === 'gemini-2.5-flash-image') {
        const promises = [];
        for (let i = 0; i < numImages; i++) {
            promises.push(runImageEdit([{ text: enhancedPrompt }], model, targetRatio));
        }
        const results = await Promise.all(promises);

        if (needsCrop && aspectRatio === '2:3') {
            return Promise.all(results.map(url => cropImageToRatio(url, 2, 3)));
        }
        return results;

    } else {
        // Fallback for Imagen or unknown models
        const response = await getAi().models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: enhancedPrompt,
            config: {
                numberOfImages: numImages,
                aspectRatio: targetRatio as any,
                outputMimeType: 'image/png',
            },
        });

        const generatedImages = response.generatedImages.map(img => `data:image/png;base64,${img.image.imageBytes}`);

        if (needsCrop && aspectRatio === '2:3') {
            const croppedImages = await Promise.all(generatedImages.map(imgUrl => cropImageToRatio(imgUrl, 2, 3)));
            return croppedImages;
        }

        return generatedImages;
    }
};

const runWithRetry = async <T>(operation: () => Promise<T>, maxRetries: number = 3): Promise<T> => {
    let attempt = 0;
    while (attempt < maxRetries) {
        try {
            return await operation();
        } catch (error: any) {
            attempt++;
            console.warn(`Gemini Service Attempt ${attempt} failed:`, error);

            // Handle SDK specific error structures or raw JSON errors
            let errorMessage = '';
            let is500 = false;

            if (typeof error === 'string') {
                errorMessage = error.toLowerCase();
            } else if (error instanceof Error) {
                errorMessage = error.message.toLowerCase();
            } else if (typeof error === 'object') {
                // Handle raw object errors (sometimes SDKs throw these)
                errorMessage = JSON.stringify(error).toLowerCase();
                if (error.code === 500 || error.status === 'Internal Server Error') {
                    is500 = true;
                }
                // Check specifically for the structure the user reported: {"error":{"message":"","code":500,"status":"Internal Server Error"}}
                if (error.error && error.error.code === 500) {
                    is500 = true;
                }
            }

            // Immediately fail on location errors
            if (errorMessage.includes('location') || errorMessage.includes('supported for the api use')) {
                throw new Error("Access Denied: The AI service is not available in your current location. Please use a VPN or a supported region.");
            }

            // Immediately fail on quota errors
            if (errorMessage.includes('quota') || errorMessage.includes('resource_exhausted') || error.code === 429) {
                throw new Error("Service Quota Exceeded: The free credit limit for this API key has been reached. Please add your own Google Gemini API Key in Settings to continue.");
            }

            // CRITICAL CHANGE: Immediately fail on safety/blocked errors.
            // Retrying these will typically result in the same error, wasting time and hitting retry limits.
            if (
                errorMessage.includes('safety') ||
                errorMessage.includes('blocked') ||
                errorMessage.includes('filtered') ||
                errorMessage.includes('policy') ||
                errorMessage.includes('conflicted') ||
                errorMessage.includes('operation name is required')
            ) {
                throw error;
            }

            const isRetryable =
                is500 ||
                // Removed safety/blocked related strings from retryable list
                errorMessage.includes('500') ||
                errorMessage.includes('internal server error') ||
                errorMessage.includes('overloaded') ||
                errorMessage.includes('unavailable') ||
                errorMessage.includes('fetch failed') ||
                errorMessage.includes('proxying failed') ||
                errorMessage.includes('load failed');

            if (isRetryable) {
                if (attempt < maxRetries) {
                    console.log(`Retrying operation due to error: ${errorMessage}`);
                    const delay = Math.pow(2, attempt) * 3000; // Increased delay: 3s, 6s, 12s
                    await new Promise(resolve => setTimeout(resolve, delay));
                    continue;
                } else {
                    // Final attempt failed, throw friendly error for 500s
                    throw new Error("The video generation service is temporarily unavailable (500). Please try again later.");
                }
            }

            throw error;
        }
    }
    throw new Error("Operation failed after multiple attempts.");
};

export const generateVideo = async (
    prompt: string,
    images: File[],
    aspectRatio: string,
    model: string,
    resolution: string,
    onStatusUpdate: (status: 'generating' | 'processing' | 'downloading') => void,
    includeAudio: boolean = false
): Promise<{ videoUrl: string, operation: any }> => {
    // Convert files to base64
    let imageInput: any = undefined;
    if (images.length > 0) {
        // Veo 3.1 supports image prompt.
        const base64 = await fileToBase64(images[0]);
        const mimeType = images[0].type;
        imageInput = {
            imageBytes: base64,
            mimeType: mimeType || 'image/png'
        };
    }

    // Define the core generation logic to allow retries with different models
    const attemptGeneration = async (currentModel: string) => {
        // Config with relaxed safety settings including CIVIC_INTEGRITY
        const config: any = {
            numberOfVideos: 1,
            aspectRatio: aspectRatio,
            resolution: resolution,
            // Ensure strictly boolean and only use includeAudio key
            includeAudio: !!includeAudio,
            safetySettings: [
                { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' }
            ]
        };

        console.log("Generating video with config:", { model: currentModel, includeAudio: config.includeAudio });

        // Handle multiple images if supported
        if (images.length > 1 && currentModel === 'veo-3.1-generate-preview') {
            const references = [];
            for (const img of images) {
                const b64 = await fileToBase64(img);
                references.push({
                    image: {
                        imageBytes: b64,
                        mimeType: img.type || 'image/png'
                    },
                    referenceType: 'ASSET' // VideoGenerationReferenceType.ASSET
                });
            }
            config.referenceImages = references;
            imageInput = undefined; // Clear single image input if using references
        }

        return runWithRetry(async () => {
            let operation: any;

            try {
                if (images.length > 1 && currentModel === 'veo-3.1-generate-preview') {
                    operation = await getAi().models.generateVideos({
                        model: currentModel,
                        prompt,
                        config
                    });
                } else {
                    operation = await getAi().models.generateVideos({
                        model: currentModel,
                        prompt,
                        image: imageInput,
                        config
                    });
                }
            } catch (e: any) {
                if (e.message && e.message.includes('500')) {
                    throw new Error("The video generation service is temporarily unavailable (500). Please try again later.");
                }
                throw e;
            }

            if (!operation || !operation.name) {
                throw new Error("Failed to start video generation: No operation returned.");
            }

            const operationName = operation.name;
            console.log(`Video generation started with Operation Name: ${operationName} (Model: ${currentModel})`);

            onStatusUpdate('processing');

            // Poll for completion
            let pollErrors = 0;
            while (true) {
                const isDone = operation && operation.done;
                if (isDone) break;

                await new Promise(resolve => setTimeout(resolve, 5000)); // 5s interval

                try {
                    const updatedOperation = await getAi().operations.getVideosOperation({
                        operation: operation
                    });

                    if (updatedOperation) {
                        operation = updatedOperation;
                        pollErrors = 0;
                    } else {
                        console.warn("Polling returned empty response, retrying...");
                    }
                } catch (pollError: any) {
                    console.error("Polling error caught:", pollError);
                    pollErrors++;
                    if (pollErrors > 5) {
                        throw pollError;
                    }
                    console.warn(`Polling failed (${pollErrors}/5), retrying...`);

                    if (pollError.message && (pollError.message.includes("t.name") || pollError.message.includes("undefined"))) {
                        console.warn("Caught SDK internal access error during polling. Waiting and retrying...");
                        continue;
                    }
                }
            }

            // Check for errors in the operation response
            if (operation.error) {
                const msg = operation.error.message || "Unknown error during video generation";
                throw new Error(`Video generation failed: ${msg}`);
            }

            // SPECIFIC FIX FOR SAFETY FILTERS
            if (operation.response?.raiMediaFilteredReasons && operation.response.raiMediaFilteredReasons.length > 0) {
                const hasVideo = operation.response?.generatedVideos?.[0]?.video?.uri;
                if (!hasVideo) {
                    const reasons = operation.response.raiMediaFilteredReasons.join(', ');
                    throw new Error(`Video generation blocked: ${reasons}`);
                }
            }

            const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (!videoUri) {
                throw new Error("The AI model completed the request but returned no video.");
            }

            onStatusUpdate('downloading');

            const downloadUrl = `${videoUri}${videoUri.includes('?') ? '&' : '?'}key=${getApiKey()}`;
            const videoResponse = await fetch(downloadUrl);

            if (!videoResponse.ok) {
                const errText = await videoResponse.text();
                throw new Error(`Failed to download video: ${videoResponse.status} ${videoResponse.statusText} - ${errText}`);
            }

            const videoBlob = await videoResponse.blob();
            if (videoBlob.size < 100) {
                throw new Error("Downloaded file is invalid or empty.");
            }

            return {
                videoUrl: URL.createObjectURL(videoBlob),
                operation: operation
            };
        });
    };

    onStatusUpdate('generating');

    // Attempt with requested model first, then fallback to alternative model if blocked by safety
    try {
        return await attemptGeneration(model);
    } catch (error: any) {
        // Fallback condition: Error contains specific safety keywords
        const errorMessage = error.message ? error.message.toLowerCase() : '';
        const isSafetyBlock = (
            errorMessage.includes('celebrity') ||
            errorMessage.includes('blocked') ||
            errorMessage.includes('safety') ||
            errorMessage.includes('likeness')
        );

        if (isSafetyBlock) {
            // If on Pro, try Fast
            if (model === 'veo-3.1-generate-preview') {
                console.warn(`Safety block detected on Pro model. Retrying with Fast model (veo-3.1-fast-generate-preview)...`);
                onStatusUpdate('generating');
                return await attemptGeneration('veo-3.1-fast-generate-preview');
            }
            // If on Fast, try Pro
            if (model === 'veo-3.1-fast-generate-preview') {
                console.warn(`Safety block detected on Fast model. Retrying with Pro model (veo-3.1-generate-preview)...`);
                onStatusUpdate('generating');
                return await attemptGeneration('veo-3.1-generate-preview');
            }
        }

        // Re-throw if no fallback applies
        throw error;
    }
};

export const extendVideo = async (
    previousOperation: any,
    prompt: string,
    aspectRatio: string,
    onStatusUpdate: (status: 'generating' | 'processing' | 'downloading') => void
): Promise<{ videoUrl: string, operation: any }> => {
    // Check if we have a valid previous operation to extend from
    if (!previousOperation || !previousOperation.response || !previousOperation.response.generatedVideos || previousOperation.response.generatedVideos.length === 0) {
        throw new Error("Cannot extend: Previous video data is missing or invalid.");
    }

    const previousVideoResource = previousOperation.response.generatedVideos[0].video;

    if (!previousVideoResource) {
        throw new Error("Cannot extend: No valid video resource found in the previous operation.");
    }

    onStatusUpdate('generating');

    return runWithRetry(async () => {
        let operation;
        try {
            operation = await getAi().models.generateVideos({
                model: 'veo-3.1-generate-preview', // Must be the edit/generate model
                prompt: prompt,
                video: previousVideoResource,
                config: {
                    numberOfVideos: 1,
                    aspectRatio: aspectRatio,
                    resolution: '720p', // Only 720p is supported for extension currently
                    // Relax safety settings as much as possible
                    safetySettings: [
                        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
                        { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' }
                    ]
                }
            });
        } catch (e: any) {
            // Specific catch for 404 during extension request
            if (e.message && e.message.includes('404') || (e.error && e.error.code === 404)) {
                throw new Error("The video session has expired. Please generate a new video to extend.");
            }
            throw e;
        }

        if (!operation || !operation.name) {
            throw new Error("Failed to start video extension: No operation returned.");
        }

        const operationName = operation.name;
        console.log("Video extension started with Operation Name:", operationName);

        onStatusUpdate('processing');

        // Poll
        let pollErrors = 0;
        while (true) {
            const isDone = operation && operation.done;
            if (isDone) break;

            await new Promise(resolve => setTimeout(resolve, 5000));

            try {
                // Correct parameter: pass the full operation object as expected by the SDK
                const updatedOperation = await getAi().operations.getVideosOperation({
                    operation: operation
                });

                if (updatedOperation) {
                    operation = updatedOperation;
                    pollErrors = 0;
                } else {
                    console.warn("Polling returned empty response, retrying...");
                }
            } catch (pollError: any) {
                console.error("Polling error caught:", pollError);

                // Allow a few failures during polling
                pollErrors++;
                if (pollErrors > 5) {
                    throw pollError;
                }
                console.warn(`Polling failed (${pollErrors}/5), retrying...`);

                if (pollError.message && (pollError.message.includes("t.name") || pollError.message.includes("undefined"))) {
                    console.warn("Caught SDK internal access error during polling. Waiting and retrying...");
                    continue;
                }
            }
        }

        // Check for errors in the operation response
        if (operation.error) {
            const msg = operation.error.message || "Unknown error during video extension";
            throw new Error(`Video extension failed: ${msg}`);
        }

        // SPECIFIC FIX FOR SAFETY FILTERS
        if (operation.response?.raiMediaFilteredReasons && operation.response.raiMediaFilteredReasons.length > 0) {
            // Check if we actually have a video despite the warnings
            const hasVideo = operation.response?.generatedVideos?.[0]?.video?.uri;
            if (!hasVideo) {
                const reasons = operation.response.raiMediaFilteredReasons.join(', ');
                throw new Error(`Video extension blocked: ${reasons}`);
            }
        }

        // Get video URI
        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!videoUri) {
            throw new Error("The AI model completed the request but returned no video.");
        }

        onStatusUpdate('downloading');

        // Download the video
        // Append API Key for authenticated download
        const downloadUrl = `${videoUri}${videoUri.includes('?') ? '&' : '?'}key=${getApiKey()}`;
        const videoResponse = await fetch(downloadUrl);

        if (!videoResponse.ok) {
            const errText = await videoResponse.text();
            throw new Error(`Failed to download video: ${videoResponse.status} ${videoResponse.statusText} - ${errText}`);
        }

        const videoBlob = await videoResponse.blob();
        if (videoBlob.size < 100) {
            // Too small, likely an error text returned as blob
            throw new Error("Downloaded file is invalid or empty.");
        }

        return {
            videoUrl: URL.createObjectURL(videoBlob),
            operation: operation
        };
    });
};