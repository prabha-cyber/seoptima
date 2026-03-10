import { checkSingleUrl } from './src/lib/monitor';

async function test() {
    console.log('Testing redirect detection for http://google.com...');
    const result = await checkSingleUrl('http://google.com');
    console.log('Result:', JSON.stringify(result, null, 2));
}

test().catch(console.error);
