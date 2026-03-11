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

                // Add randomized delay before navigation
                await page.waitForTimeout(Math.floor(Math.random() * 2000) + 1000);

                const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });
                if (!response) throw new Error('No response');

                // Wait for Cloudflare to resolve with improved logic
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

                // Final wait for dynamic content
                await page.waitForTimeout(3000);
                try {
                    await page.waitForLoadState('networkidle', { timeout: 10000 });
                } catch (e) { }

                const finalHtml = await page.content();
                const finalStatus = response.status();
                const finalUrl = page.url();

                // If it's still clearly a challenge page, it's a failure
                if (finalHtml.includes('cf-challenge') || finalHtml.includes('Just a moment')) {
                    await b.close();
                    return null;
                }

                console.log(`[robustFetch] ${options.name} SUCCESS. Status: ${finalStatus}, URL: ${finalUrl}, HTML length: ${finalHtml?.length}`);

                // DUMP TO FILE FOR DEBUGGING
                const fs = await import('fs/promises');
                await fs.writeFile('/tmp/cloudflare_debug.html', finalHtml, 'utf8');

                return { html: finalHtml, status: finalStatus, url: finalUrl, browser: b };
            } catch (err: any) {
                console.error(`[robustFetch] ${options.name} error: ${err.message}`);
                await b.close();
                return null;
            }
        };

        const tryRealBrowserBypass = async () => {
            console.log('[robustFetch] Attempting bypass with puppeteer-real-browser...');
            try {
                const { connect } = await import('puppeteer-real-browser');
                const { browser, page } = await connect({
                    headless: true,
                    turnstile: true,
                    disableXvfb: true,
                });

                // Add randomized delay
                await new Promise(r => setTimeout(r, Math.floor(Math.random() * 2000) + 1000));

                await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 60000 });

                let isResolved = false;
                for (let i = 0; i < 15; i++) {
                    await new Promise(r => setTimeout(r, 2000));
                    const title = await page.title();
                    const content = await page.content();

                    if (!title.includes('Just a moment') &&
                        !title.includes('Attention Required') &&
                        !content.includes('cf-challenge') &&
                        title !== '') {
                        isResolved = true;
                        break;
                    }
                    console.log(`[robustFetch] puppeteer-real-browser waiting... Title: ${title}`);
                }

                if (!isResolved) {
                    console.log('[robustFetch] puppeteer-real-browser failed to resolve challenge.');
                    await browser.close();
                    return null;
                }

                await new Promise(r => setTimeout(r, 3000));

                const finalHtml = await page.content();
                const finalStatus = 200; // puppeteer-real-browser doesn't always expose the original status easily after challenge
                const finalUrl = page.url();

                if (finalHtml.includes('cf-challenge') || finalHtml.includes('Just a moment')) {
                    await browser.close();
                    return null;
                }

                console.log(`[robustFetch] puppeteer-real-browser SUCCESS. URL: ${finalUrl}, HTML length: ${finalHtml?.length}`);

                const fs = await import('fs/promises');
                await fs.writeFile('/tmp/cloudflare_debug.html', finalHtml, 'utf8');

                return { html: finalHtml, status: finalStatus, url: finalUrl, browser };
            } catch (err: any) {
                console.error(`[robustFetch] puppeteer-real-browser error: ${err.message}`);
                return null;
            }
        };

        // 1. Try Chromium with system Google Chrome
        let result = await tryBypass(chromium, { name: 'Chromium (Chrome)', executablePath: '/usr/bin/google-chrome' });

        // 2. Fallback to standard Chromium if Chrome fails
        if (!result) {
            result = await tryBypass(chromium, { name: 'Chromium (Default)' });
        }

        // 3. Fallback to Firefox
        if (!result) {
            result = await tryBypass(firefox, { name: 'Firefox' });
        }

        // 4. Final resort: puppeteer-real-browser
        if (!result) {
            result = await tryRealBrowserBypass();
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
