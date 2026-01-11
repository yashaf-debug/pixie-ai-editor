import { GoogleGenAI, Modality } from '@google/genai';

export const config = {
    runtime: 'nodejs',
    maxDuration: 60, // 60 seconds for image generation
};

export default async function handler(req, res) {
    // Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { model, contents, config } = req.body;

        // Get API key from environment
        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

        if (!apiKey) {
            return res.status(500).json({ error: 'API key not configured' });
        }

        console.log('🔄 Proxying request to Gemini API:', { model, hasContents: !!contents, config });

        // Use full SDK on server - supports ALL features including imageSize, aspectRatio
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model,
            contents,
            config,
        });

        console.log('✅ Gemini API response received');

        // Return the full response
        return res.status(200).json(response);

    } catch (error) {
        console.error('❌ Gemini API Error:', error);

        return res.status(500).json({
            error: {
                message: error.message || 'Unknown error',
                code: error.code || 500,
                status: error.status || 'Internal Server Error',
            },
        });
    }
}
