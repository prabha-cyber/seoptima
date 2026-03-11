const { chromium, firefox, webkit } = require('playwright-extra');
const stealthPlugin = require('puppeteer-extra-plugin-stealth')();

chromium.use(stealthPlugin);
firefox.use(stealthPlugin);
webkit.use(stealthPlugin);

async function testBrowser(name, browserType) {
    console.log(`\n--- Testing ${name} ---`);
    let browser;
    try {
        browser = await browserType.launch({
            headless: true,
            // args: ['--no-sandbox']
        });
        const context = await browser.newContext({
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
            viewport: { width: 1920, height: 1080 }
        });
        const page = await context.newPage();

        await page.goto('https://www.khazanajewellery.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });

        for (let i = 0; i < 7; i++) {
            await page.waitForTimeout(2000);
            const title = await page.title();
            console.log(`[${name}] Title: ${title}`);
            if (!title.includes('Just a moment') && !title.includes('Attention Required')) {
                break;
            }
        }

        const html = await page.content();
        console.log(`[${name}] HTML length: ${html.length}`);

    } catch (e) {
        console.error(`[${name}] Error:`, e.message);
    } finally {
        if (browser) await browser.close();
    }
}

async function run() {
    await testBrowser('Chromium', chromium);
    await testBrowser('Firefox', firefox);
    // Webkit is not currently supported by playwright-extra out of the box in the same way, but it works
    await testBrowser('WebKit', webkit);
}

run().catch(console.error);
