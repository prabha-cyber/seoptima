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

    let browser;
    try {
        // Use eval('require') to prevent Next.js webpack from trying to bundle these plugins statically
        // since they contain dynamic requires that break the build
        const req = eval('require');
        const { chromium } = req('playwright-extra');
        const stealthPluginModule = req('puppeteer-extra-plugin-stealth');

        // Handle common default export patterns
        const StealthPlugin = stealthPluginModule.default || (stealthPluginModule as any);
        chromium.use(StealthPlugin());

        browser = await chromium.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
        });
        const context = await browser.newContext({
            userAgent: ua,
            viewport: { width: 1920, height: 1080 }
        });
        const page = await context.newPage();
        const response = await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
        if (!response) throw new Error('No response');

        // Wait up to 15 seconds for Cloudflare to resolve
        for (let i = 0; i < 7; i++) {
            await page.waitForTimeout(2000);
            const title = await page.title();
            if (!title.includes('Just a moment') && !title.includes('Attention Required')) {
                break;
            }
        }

        // Final network idle wait to ensure page loads after challenge
        try {
            await page.waitForLoadState('networkidle', { timeout: 10000 });
        } catch (e) { /* ignore timeout on networkidle */ }

        const finalHtml = await page.content();
        const finalStatus = response.status();
        const finalUrl = page.url();
        console.log(`[robustFetch] Browser bypass done. Status: ${finalStatus}, URL: ${finalUrl}, HTML length: ${finalHtml?.length}`);

        // DUMP TO FILE FOR DEBUGGING
        const fs = await import('fs/promises');
        await fs.writeFile('/tmp/cloudflare_debug.html', finalHtml, 'utf8');

        await browser.close();
        return { html: finalHtml, status: finalStatus, url: finalUrl };
    } catch (error: any) {
        console.error(`[robustFetch] Browser error: ${error.message}`);
        if (browser) await browser.close();
        return { html: '', status: 0, url: targetUrl, error: error.message };
    }
}
