import { chromium, firefox } from 'playwright-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { gotScraping } from 'got-scraping';

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
];

export async function robustFetch(url: string, useBrowser: boolean = false): Promise<{ html: string; status: number; url: string; error?: string }> {
    const targetUrl = url.startsWith('http') ? url : `https://${url}`;
    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];

    if (!useBrowser) {
        try {
            console.log(`[robustFetch] Attempting got-scraping for ${targetUrl}`);
            const response = await gotScraping.get(targetUrl, {
                headers: {
                    'user-agent': ua,
                },
                timeout: { request: 30000 },
                retry: { limit: 2 }
            });

            const html = response.body;
            const isChallenge = html.includes('captcha') || html.includes('cloudflare') || html.includes('Just a moment');

            if (!isChallenge && html.length > 500) {
                return { html, status: response.statusCode, url: response.url };
            }
            console.log(`[robustFetch] got-scraping returned challenge or empty content. Falling back to browser if available.`);
        } catch (error: any) {
            console.log(`[robustFetch] got-scraping error: ${error.message}. Falling back to browser if available.`);
            if (error.response) {
                const html = error.response.body;
                const isChallenge = html.includes('captcha') || html.includes('cloudflare') || html.includes('Just a moment');
                // Even if error, if it looks like actual content, maybe use it? 
                // But usually 403/503 is a block.
            }
        }
    }

    // Browser fallthrough fallback
    try {
        // Standard Playwright Stealth logic
        const tryBypass = async (browserType: any, options: any) => {
            console.log(`[robustFetch] Attempting bypass with ${options.name}...`);
            const plugin = StealthPlugin();
            browserType.use(plugin);

            const launchOptions: any = {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
            };

            const b = await browserType.launch(launchOptions);
            try {
                const context = await b.newContext({
                    userAgent: ua,
                    viewport: { width: 1920, height: 1080 }
                });
                const page = await context.newPage();

                await page.waitForTimeout(Math.floor(Math.random() * 2000) + 1000);

                const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
                if (!response) throw new Error('No response');

                let isResolved = false;
                for (let i = 0; i < 15; i++) {
                    await page.waitForTimeout(2000);
                    const title = await page.title();
                    const content = await page.content();

                    if (!title.includes('Just a moment') &&
                        !title.includes('Attention Required') &&
                        !content.includes('cf-challenge') &&
                        title !== '') {
                        isResolved = true;
                        break;
                    }
                    console.log(`[robustFetch] ${options.name} waiting... Title: ${title}`);
                }

                if (!isResolved) {
                    console.log(`[robustFetch] ${options.name} failed to resolve challenge.`);
                    await b.close();
                    return null;
                }

                await page.waitForTimeout(3000);
                try {
                    await page.waitForLoadState('networkidle', { timeout: 10000 });
                } catch (e) { }

                const finalHtml = await page.content();
                const finalStatus = response.status();
                const finalUrl = page.url();

                if (finalHtml.includes('cf-challenge') || finalHtml.includes('Just a moment')) {
                    await b.close();
                    return null;
                }

                console.log(`[robustFetch] ${options.name} SUCCESS. Status: ${finalStatus}, URL: ${finalUrl}`);

                return { html: finalHtml, status: finalStatus, url: finalUrl, browser: b };
            } catch (err: any) {
                console.error(`[robustFetch] ${options.name} error: ${err.message}`);
                await b.close();
                return null;
            }
        };

        let result = await tryBypass(chromium, { name: 'Chromium' });

        if (!result) {
            result = await tryBypass(firefox, { name: 'Firefox' });
        }

        if (result) {
            const { html, status, url, browser: b } = result;
            await b.close();
            return { html, status, url };
        }

        throw new Error('All bypass attempts failed (browser unavailable or blocked)');

    } catch (error: any) {
        console.error(`[robustFetch] Final error: ${error.message}`);
        return { html: '', status: 0, url: targetUrl, error: error.message };
    }
}
