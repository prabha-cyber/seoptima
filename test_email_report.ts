import { sendSiteCrawlReport } from './src/lib/email';

async function testEmail() {
    console.log('Sending test site crawl report...');
    await sendSiteCrawlReport(['test@example.com'], {
        siteName: 'Example Corp',
        siteUrl: 'https://example.com',
        totalPages: 10,
        upCount: 6,
        downCount: 1,
        redirectCount: 3,
        avgResponseTime: 125,
        checkedAt: new Date(),
        pages: [
            { url: 'https://example.com/about', statusCode: 200, responseTime: 80, isUp: true, error: null },
            { url: 'https://example.com/contact-us-very-long-url-that-might-break-layout-so-we-need-to-wrap-it', statusCode: 301, responseTime: 140, isUp: true, error: null, redirected: true, finalUrl: 'https://example.com/contact' },
            { url: 'https://example.com/broken', statusCode: 404, responseTime: 45, isUp: false, error: 'HTTP 404 Not Found' },
        ]
    });
    console.log('Test email triggered (check ethereal or local SMTP output).');
}

testEmail().catch(console.error);
