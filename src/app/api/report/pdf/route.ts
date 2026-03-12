import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 });
  }

  let browser;
  try {
    const { chromium } = await import('playwright');
    const ua = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36';
    const reportUrl = `${origin}/report?url=${encodeURIComponent(targetUrl)}`;

    browser = await chromium.launch();
    const context = await browser.newContext({ userAgent: ua });
    const page = await context.newPage();
    await page.setViewportSize({ width: 1200, height: 1600 });

    // Navigate to the frontend report page
    await page.goto(reportUrl, { waitUntil: 'networkidle', timeout: 60000 });

    // The frontend fetches data from /api/analyze and shows a loading spinner first.
    // When done, it shows the report container with class .max-w-[720px]
    await page.waitForSelector('.max-w-\\[720px\\]', { state: 'attached', timeout: 60000 });

    // Wait a little bit extra to ensure all charts or images are fully rendered
    await page.waitForTimeout(2000);

    // Generate the PDF
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
      preferCSSPageSize: true
    });

    await browser.close();

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="SEO-Report-${targetUrl.replace(/[^a-z0-9]/gi, '-')}.pdf"`
      }
    });

  } catch (error) {
    console.error('PDF Generation Error:', error);
    if (browser) await browser.close();
    return NextResponse.json({ error: 'Failed to generate PDF' }, { status: 500 });
  }
}
