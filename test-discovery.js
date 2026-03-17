if (typeof global.File === 'undefined') {
    const { File } = require('node:buffer');
    if (File) {
        global.File = File;
    } else {
        global.File = class File extends Blob {
            constructor(chunks, name, options) {
                super(chunks, options);
                this.name = name;
                this.lastModified = options?.lastModified || Date.now();
            }
        };
    }
}

const { discoverPages } = require('./src/lib/monitor');

async function test() {
    console.log('Testing discovery for https://iigindia.com/ with sitemap seeds');
    try {
        // Mock sitemap URLs for testing
        const sitemapUrls = [
            'https://iigindia.com/course/gemology-graduate/',
            'https://iigindia.com/about-iig/',
            'https://iigindia.com/contact-us/'
        ];
        const pages = await discoverPages('https://iigindia.com/', 50, sitemapUrls);
        console.log(`Discovered ${pages.length} pages:`);
        console.log(pages);
    } catch (e) {
        console.error('Discovery failed:', e);
    }
}

test();
