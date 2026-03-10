import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { performSiteCrawl } from '@/lib/monitor';

// POST — crawl a website, check all pages, send email report
export async function POST(request: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const body = await request.json();
        const { monitorId, maxPages } = body;

        if (!monitorId) {
            return NextResponse.json({ error: 'monitorId is required' }, { status: 400 });
        }

        // Verify monitor belongs to user
        const monitor = await prisma.uptimeMonitor.findFirst({
            where: { id: monitorId, userId: user.id },
        });

        if (!monitor) {
            return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });
        }

        console.log(`[SiteCrawl] Starting crawl for: ${monitor.url}`);

        const crawlData = await performSiteCrawl(monitorId, maxPages || 50);

        if (!crawlData) {
            return NextResponse.json({ error: 'Crawl failed to initialize' }, { status: 500 });
        }

        return NextResponse.json({
            message: `Crawled and checked ${crawlData.summary.total} pages`,
            summary: crawlData.summary,
            pages: crawlData.results,
        });
    } catch (error: any) {
        console.error('[SiteCrawl] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
