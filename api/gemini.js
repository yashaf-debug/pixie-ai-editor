export const config = {
    runtime: 'nodejs',
    maxDuration: 60,
};

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { model, contents, config } = req.body;

        const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;

        if (!apiKey) {
            console.error('API key not configured');
            return res.status(500).json({ error: 'API key not configured' });
        }

        console.log('🔄 Proxying to Gemini:', model);

        // Dynamic import
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey });

        const response = await ai.models.generateContent({
            model,
            contents,
            config,
        });

        console.log('✅ Response received');
        return res.status(200).json(response);

    } catch (error) {
        console.error('❌ Error:', error.message);
        return res.status(500).json({
            error: {
                message: error.message || 'Unknown error',
                code: error.code || 500,
            },
        });
    }
}
