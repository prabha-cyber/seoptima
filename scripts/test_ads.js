const { chromium } = require('playwright');

async function run() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
        console.log("Navigating to Google Ads Transparency Center...");
        // Search for ads from Apple (known advertiser)
        await page.goto('https://adstransparency.google.com/?region=US&domain=apple.com', { waitUntil: 'networkidle' });

        await page.waitForTimeout(3000); // wait for dynamic content

        const title = await page.title();
        console.log("Page title:", title);

        // Let's print out the text of the page to see if we got data or blocked
        // look for ad elements or advertiser name
        const textContext = await page.evaluate(() => document.body.innerText);
        console.log("Page content snippet:", textContext.substring(0, 500));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await browser.close();
    }
}

run();
