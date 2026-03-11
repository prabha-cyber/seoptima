import { gotScraping } from 'got-scraping';

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
];

export async function robustFetch(url: string, useBrowser: boolean = false): Promise<{ html: string; status: number; url: string; error?: string }> {
    const targetUrl = url.startsWith('http') ? url : `https://${url}`;
    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    // We no longer support local browser scraping in the serverless environment
    // to avoid massive build issues and runtime failures.
    // gotScraping provides excellent bypass capabilities without a full browser.

    try {
        console.log(`[robustFetch] Attempting got-scraping for ${targetUrl}`);
        const response = await gotScraping.get(targetUrl, {
            headers: {
                'user-agent': ua,
            },
            timeout: { request: 30000 },
            retry: { limit: 2 },
            followRedirect: true
        });

        const html = response.body;
        const isChallenge = html.includes('captcha') || html.includes('cloudflare') || html.includes('Just a moment') || html.includes('cf-challenge');

        if (!isChallenge && html.length > 500) {
            return { html, status: response.statusCode, url: response.url };
        }

        if (isChallenge) {
            console.log(`[robustFetch] got-scraping detected a challenge for ${targetUrl}`);
        }

        return { html, status: response.statusCode, url: response.url, error: isChallenge ? 'Blocked by Cloudflare challenge' : 'Empty or short response' };

    } catch (error: any) {
        console.log(`[robustFetch] got-scraping error: ${error.message} for ${targetUrl}`);

        // Fallback to basic fetch if gotScraping fails completely
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
