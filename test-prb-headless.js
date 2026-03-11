const { connect } = require("puppeteer-real-browser");

async function run() {
    try {
        console.log('Fetching khazanajewellery.com with puppeteer-real-browser...');
        console.log('Attempting to connect...');
        const { browser, page } = await connect({
            headless: true,
            turnstile: true,
            disableXvfb: true,
        });

        await page.goto('https://www.khazanajewellery.com/', { waitUntil: 'domcontentloaded', timeout: 60000 });

        console.log('Initial page title:', await page.title());

        // Wait for potential challenge to resolve
        for (let i = 0; i < 15; i++) {
            await new Promise(r => setTimeout(r, 2000));
            const title = await page.title();
            console.log(`[Wait ${i}] Title: ${title}`);
            if (!title.includes('Just a moment') && !title.includes('Attention Required') && title !== '') {
                break;
            }
        }

        const html = await page.content();
        const finalTitle = await page.title();
        console.log(`Final Title: ${finalTitle}`);
        console.log(`HTML length: ${html.length}`);

        if (html.includes('Just a moment')) {
            console.log('Blocked: Received Cloudflare challenge.');
        } else if (html.length < 5000) {
            console.log('Small HTML length - potentially still blocked or incomplete.');
        } else {
            console.log('Success: Looks like real content!');
        }

        await browser.close();
    } catch (err) {
        console.error('Request failed:', err.message);
    }
}

run();
