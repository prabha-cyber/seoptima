import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { performSiteCrawl } from '@/lib/monitor';

// POST /api/cron/crawl
// Triggered by Vercel Cron or an external cron job
export async function POST(request: Request) {
    try {
        // Basic Security Check: Require an authorization token
        const authHeader = request.headers.get('authorization');
        const expectedToken = process.env.CRON_SECRET || 'seoptima_secure_cron_token_123';

        if (authHeader !== `Bearer ${expectedToken}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[Cron] Starting automated site crawls...');

        // Find all active monitors
        const monitors = await (prisma as any).uptimeMonitor.findMany({
            where: { active: true }
        });

        if (monitors.length === 0) {
            return NextResponse.json({ message: 'No active monitors found' });
        }

        const results = [];
        const errors = [];

        // Crawl them (using a simple for-loop to avoid overloading the server/database with Promise.all)
        // If there are many monitors, a queue system is better, but this works for small-to-medium scale
        for (const monitor of monitors) {
            // Check if interval has elapsed logic
            let shouldCrawl = true;
            if (monitor.lastChecked) {
                const elapsedMs = Date.now() - new Date(monitor.lastChecked).getTime();
                const elapsedMins = elapsedMs / (1000 * 60);
                // Apply a small threshold (e.g. 0.5 mins) to account for slight cron execution delays
                if (elapsedMins < (monitor.interval - 0.5)) {
                    shouldCrawl = false;
                }
            }

            if (!shouldCrawl) {
                console.log(`[Cron] Skipping monitor ${monitor.id} (interval ${monitor.interval}m not yet elapsed)`);
                continue;
            }

            try {
                // Discover up to 1000 pages per site and check them
                const crawlData = await performSiteCrawl(monitor.id, 1000);
                if (crawlData) {
                    results.push({
                        monitorId: monitor.id,
                        name: monitor.name,
                        summary: crawlData.summary
                    });
                }
            } catch (err: any) {
                console.error(`[Cron] Error crawling monitor ${monitor.id}:`, err);
                errors.push({ monitorId: monitor.id, error: err.message });
            }
        }

        console.log(`[Cron] Completed crawl for ${results.length} monitors.`);

        return NextResponse.json({
            message: 'Cron crawl completed successfully',
            processed: results.length,
            errors: errors.length,
            details: results,
            errorDetails: errors
        });

    } catch (error: any) {
        console.error('[Cron] General Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
