async function run() {
    const { gotScraping } = await import('got-scraping');
    try {
        console.log('Fetching khazanajewellery.com with got-scraping...');
        const response = await gotScraping({
            url: 'https://www.khazanajewellery.com/',
            method: 'GET',
            headerGeneratorOptions: {
                browsers: [{ name: 'chrome', minVersion: 110 }],
                devices: ['desktop'],
                locales: ['en-US'],
                operatingSystems: ['windows', 'macos'],
            }
        });

        console.log('Status code:', response.statusCode);
        console.log('Title extracted:', response.body.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1]);
        console.log('HTML length:', response.body.length);

        if (response.body.includes('Just a moment')) {
            console.log('Blocked: Received Cloudflare challenge.');
        } else {
            console.log('Success: Looks like real content!');
        }
    } catch (err) {
        console.error('Request failed:', err.message);
        if (err.response) {
            console.log('Status code:', err.response.statusCode);
            console.log('Body length:', err.response.body.length);
        }
    }
}

run();
