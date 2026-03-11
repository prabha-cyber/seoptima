import { NextResponse } from 'next/server';

export async function GET() {
    console.log('Diagnostic: Testing Playwright capability...');
    try {
        const req = eval('require');
        const { chromium } = req('playwright-extra');
        const browser = await chromium.launch({ headless: true });
        const version = browser.version();
        await browser.close();
        return NextResponse.json({ status: 'ok', version });
    } catch (e: any) {
        console.error('Diagnostic error:', e);
        return NextResponse.json({ status: 'error', message: e.message, stack: e.stack }, { status: 500 });
    }
}
