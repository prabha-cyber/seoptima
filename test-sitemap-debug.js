if (typeof global.File === 'undefined') {
    const { File } = require('node:buffer');
    if (File) {
        global.File = File;
    }
}

const { extractSitemapUrls } = require('./src/lib/seo/technical');

async function test() {
    const url = 'https://iigindia.com/';
    console.log(`Testing sitemap extraction for ${url}`);
    const urls = await extractSitemapUrls(url);
    console.log(`Found ${urls.length} URLs`);
    if (urls.length > 0) {
        console.log('First 5 URLs:', urls.slice(0, 5));
    }
}

test();
