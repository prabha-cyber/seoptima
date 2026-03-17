import { discoverPages } from './src/lib/monitor';

async function test() {
    console.log("Starting test...");
    const urls = await discoverPages("https://iigindia.com", 20);
    console.log("Discovered pages:", urls.length);
    console.log(urls.slice(0, 5));
}

test().catch(console.error);
