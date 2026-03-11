const { robustFetch } = require('./src/lib/seo/fetch');

async function verify() {
    const url = 'https://www.khazanajewellery.com/';
    console.log(`Verifying robustFetch for ${url}...`);

    try {
        const result = await robustFetch(url, true); // true to force browser
        console.log('Status:', result.status);
        console.log('URL:', result.url);
        console.log('HTML length:', result.html?.length);

        if (result.html && result.html.length > 5000 && !result.html.includes('Just a moment')) {
            console.log('SUCCESS: Bypass confirmed!');
        } else {
            console.log('FAILED: Still blocked or results incomplete.');
            if (result.error) console.log('Error:', result.error);
        }
    } catch (e) {
        console.error('Verification failed:', e.message);
    }
}

verify();
