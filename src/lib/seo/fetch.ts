import axios from 'axios';

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
];

export async function robustFetch(url: string, useBrowser: boolean = false): Promise<{ html: string; status: number; url: string; error?: string }> {
    const targetUrl = url.startsWith('http') ? url : `https://${url}`;
    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    try {
        console.log(`[robustFetch] Attempting axios for ${targetUrl}`);
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': ua,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,static/view;q=0.8',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
            },
            timeout: 30000,
            validateStatus: () => true, // Accept all status codes
            maxRedirects: 5
        });

        const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
        const isChallenge = html.includes('captcha') || html.includes('cloudflare') || html.includes('Just a moment') || html.includes('cf-challenge');

        if (!isChallenge && html.length > 500) {
            return { html, status: response.status, url: response.config.url || targetUrl };
        }

        if (isChallenge) {
            console.log(`[robustFetch] Axios detected a challenge for ${targetUrl}`);
        }

        return {
            html,
            status: response.status,
            url: response.config.url || targetUrl,
            error: isChallenge ? 'Blocked by Cloudflare challenge' : 'Empty or short response'
        };

    } catch (error: any) {
        console.log(`[robustFetch] Axios error: ${error.message} for ${targetUrl}`);

        // Fallback to basic fetch if axios fails completely
        try {
            const res = await fetch(targetUrl, {
                headers: { 'User-Agent': ua },
                redirect: 'follow'
            });
            const html = await res.text();
            return { html, status: res.status, url: res.url };
        } catch (fetchError: any) {
            return { html: '', status: 0, url: targetUrl, error: error.message };
        }
    }
}
