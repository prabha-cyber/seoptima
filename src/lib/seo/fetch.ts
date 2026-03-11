import { chromium } from 'playwright';

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
            const res = await fetch(targetUrl, {
                headers: {
                    'User-Agent': ua,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Upgrade-Insecure-Requests': '1',
                },
                redirect: 'follow',
            });

            if (res.ok) {
                const html = await res.text();
                const isChallenge = html.includes('captcha') || html.includes('cloudflare') || html.includes('Just a moment');
                if (!isChallenge) {
                    return { html, status: res.status, url: res.url };
                }
            }
        } catch (error: any) {
            // Fallthrough to browser
        }
    }

    try {
        const req = eval('require');
        const { chromium, firefox } = req('playwright-extra');
        const stealthPluginModule = req('puppeteer-extra-plugin-stealth');
        const StealthPlugin = stealthPluginModule.default || (stealthPluginModule as any);

        // Standard Playwright Stealth logic remains
        const tryBypass = async (browserType: any, options: any) => {
            console.log(`[robustFetch] Attempting bypass with ${options.name}...`);
            const plugin = StealthPlugin();
            browserType.use(plugin);

            const launchOptions: any = {
                headless: true,
                args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
            };

            if (options.executablePath) {
                launchOptions.executablePath = options.executablePath;
            }

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

        // Standard Chromium
        let result = await tryBypass(chromium, { name: 'Chromium' });

        // Fallback to Firefox
        if (!result) {
            result = await tryBypass(firefox, { name: 'Firefox' });
        }

        if (result) {
            const { html, status, url, browser: b } = result;
            await b.close();
            return { html, status, url };
        }

        throw new Error('All bypass attempts failed');

    } catch (error: any) {
        console.error(`[robustFetch] Final error: ${error.message}`);
        return { html: '', status: 0, url: targetUrl, error: error.message };
    }
}
