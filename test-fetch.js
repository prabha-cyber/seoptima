if (typeof global.File === 'undefined') {
    const { File } = require('node:buffer');
    if (File) {
        global.File = File;
    }
}

const { robustFetch } = require('./src/lib/seo/fetch');

async function test() {
    console.log('Testing robustFetch for https://iigindia.com/');
    try {
        const result = await robustFetch('https://iigindia.com/');
        console.log('Result:', {
            status: result.status,
            url: result.url,
            htmlLength: result.html?.length,
            error: result.error
        });
        if (result.html) {
            console.log('HTML Preview (first 1000 chars):');
            console.log(result.html.substring(0, 1000));
            const linkCount = (result.html.match(/<a /g) || []).length;
            console.log(`Approximate <a> tag count: ${linkCount}`);
        }
    } catch (e) {
        console.error('Fetch failed:', e);
    }
}

test();
