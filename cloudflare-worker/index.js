export default {
    async fetch(request, env) {
        // Handle CORS preflight
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                headers: {
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-goog-api-key',
                    'Access-Control-Max-Age': '86400',
                },
            });
        }

        // Only allow POST requests
        if (request.method !== 'POST') {
            return new Response('Method not allowed', { status: 405 });
        }

        try {
            const url = new URL(request.url);

            // Extract the Gemini API path from the request
            // Example: /v1beta/models/gemini-3-pro-image-preview:generateContent
            const geminiPath = url.pathname;

            // Build the actual Gemini API URL
            const geminiUrl = `https://generativelanguage.googleapis.com${geminiPath}${url.search}`;

            // Forward headers (including API key)
            const headers = new Headers(request.headers);
            headers.set('Content-Type', 'application/json');

            // Read the request body
            const requestBody = await request.text();

            // Forward the request to Gemini API
            const geminiResponse = await fetch(geminiUrl, {
                method: 'POST',
                headers: headers,
                body: requestBody,
            });

            // Read the response body completely
            const responseBody = await geminiResponse.text();

            // Create new response with CORS headers
            return new Response(responseBody, {
                status: geminiResponse.status,
                statusText: geminiResponse.statusText,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-goog-api-key',
                },
            });

        } catch (error) {
            console.error('Proxy error:', error);
            return new Response(JSON.stringify({
                error: {
                    message: error.message || 'Proxy error',
                    code: 500,
                    status: 'Internal Server Error'
                }
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                },
            });
        }
    },
};
