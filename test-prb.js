async function run() {
    const { connect } = await import("puppeteer-real-browser");

    try {
        console.log('Fetching khazanajewellery.com with puppeteer-real-browser...');
        const { browser, page } = await connect({
            headless: false,
            turnstile: true,
            disableXvfb: true, // User cannot run sudo to install xvfb
        });

        await page.goto('https://www.khazanajewellery.com/', { waitUntil: 'domcontentloaded', timeout: 30000 });

        for (let i = 0; i < 7; i++) {
            await new Promise(r => setTimeout(r, 2000));
            const title = await page.title();
            console.log(`Title: ${title}`);
            if (!title.includes('Just a moment') && !title.includes('Attention Required')) {
                break;
            }
        }

        const html = await page.content();
        console.log(`HTML length: ${html.length}`);

        if (html.includes('Just a moment')) {
            console.log('Blocked: Received Cloudflare challenge.');
        } else {
            console.log('Success: Looks like real content!');
        }

        await browser.close();
    } catch (err) {
        console.error('Request failed:', err.message);
    }
}

run();
