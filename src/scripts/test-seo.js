const axios = require('axios');

async function testAnalysis() {
    const url = 'https://google.com';
    console.log(`Testing SEO Analysis for: ${url}`);

    try {
        const response = await axios.post('http://localhost:3000/api/analyze', {
            url: url
        });

        console.log('Analysis Results:', JSON.stringify(response.data.results, null, 2));
        console.log('Stats:', JSON.stringify(response.data.stats, null, 2));

        if (response.data.success) {
            console.log('✅ SEO Analysis API test passed!');
        } else {
            console.log('❌ SEO Analysis API test failed.');
        }
    } catch (error) {
        console.error('Test Error:', error.message);
        if (error.response) {
            console.error('Response Data:', error.response.data);
        }
    }
}

testAnalysis();
