const { chromium } = require('playwright');

async function run() {
    console.log('Testing simple playwright (non-extra) for khazanajewellery.com...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    });
    const page = await context.newPage();

    try {
        const response = await page.goto('https://www.khazanajewellery.com/', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        console.log('Status:', response.status());

        // Wait for challenge
        for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 2000));
            const title = await page.title();
            console.log(`[Wait ${i}] Title: ${title}`);
            if (!title.includes('Just a moment') && title !== '') break;
        }

        const html = await page.content();
        console.log('HTML length:', html.length);
        console.log('Final Title:', await page.title());

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await browser.close();
    }
}

run();
