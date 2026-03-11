const { firefox } = require('playwright-extra');
const stealthPlugin = require('puppeteer-extra-plugin-stealth')();

firefox.use(stealthPlugin);

async function run() {
    console.log('Testing Firefox with Stealth for khazanajewellery.com...');
    const browser = await firefox.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:122.0) Gecko/20100101 Firefox/122.0',
    });
    const page = await context.newPage();

    try {
        console.log('Navigating to https://www.khazanajewellery.com/ ...');
        const response = await page.goto('https://www.khazanajewellery.com/', {
            waitUntil: 'domcontentloaded',
            timeout: 60000
        });

        console.log('Initial Status:', response.status());

        // Wait for challenge to resolve
        for (let i = 0; i < 15; i++) {
            await page.waitForTimeout(2000);
            const title = await page.title();
            console.log(`[Wait ${i}] Title: ${title}`);
            if (!title.includes('Just a moment') && !title.includes('Attention Required') && title !== '') {
                break;
            }
        }

        // Wait for some content to be sure
        await page.waitForTimeout(5000);

        const html = await page.content();
        const finalTitle = await page.title();
        console.log('Final Title:', finalTitle);
        console.log('HTML length:', html.length);

        if (html.includes('jewelry') || html.includes('Khazana') || html.length > 50000) {
            console.log('SUCCESS: Content seems real!');
        } else {
            console.log('FAILED: Still seeing challenge or incomplete content.');
        }

        // Save HTML for inspection
        const fs = require('fs');
        fs.writeFileSync('/tmp/khazana_firefox.html', html);
        console.log('HTML saved to /tmp/khazana_firefox.html');

    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await browser.close();
    }
}

run();
