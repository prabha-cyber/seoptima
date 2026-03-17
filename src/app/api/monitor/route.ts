import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { performSiteCrawl } from '@/lib/monitor';

// GET — list all monitors for the authenticated user
export async function GET() {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const monitors = await (prisma as any).uptimeMonitor.findMany({
            where: { userId: user.id },
            include: {
                emails: true,
                pages: {
                    include: {
                        checks: {
                            orderBy: { checkedAt: 'desc' },
                            take: 5,
                        },
                    },
                },
                checks: {
                    orderBy: { checkedAt: 'desc' },
                    take: 20,
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ monitors });
    } catch (error: any) {
        console.error('[Monitor API] GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST — create a new monitor
export async function POST(request: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const body = await request.json();
        const { url, name, interval, email, type, config, responseTimeThreshold, locations } = body;

        if (!url || !name) {
            return NextResponse.json({ error: 'URL and name are required' }, { status: 400 });
        }

        // Ensure URL has a protocol
        let normalizedUrl = url.trim();
        if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
            normalizedUrl = 'https://' + normalizedUrl;
        }

        const monitor = await (prisma as any).uptimeMonitor.create({
            data: {
                userId: user.id,
                url: normalizedUrl,
                name: name.trim(),
                type: type || 'HTTP',
                interval: interval || 5,
                config: typeof config === 'string' ? config : JSON.stringify(config || {}),
                responseTimeThreshold: responseTimeThreshold || 5000,
                locations: Array.isArray(locations) ? JSON.stringify(locations) : (locations || '["Global"]'),
            },
            include: { emails: true, checks: true },
        });

        // Add initial emails if provided (comma-separated list)
        if (email && email.trim()) {
            const emails = email.split(',').map((e: string) => e.trim().toLowerCase()).filter((e: string) => e);

            // Basic validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const validEmails = emails.filter((e: string) => emailRegex.test(e));

            if (validEmails.length > 0) {
                await (prisma as any).monitorEmail.createMany({
                    data: validEmails.map((validEmail: string) => ({
                        monitorId: monitor.id,
                        email: validEmail,
                    }))
                });
            }
        }

        // AUTOMATIC CRAWL: Immediately discover and scan pages
        console.log(`[AutoCrawl] Initiating for new monitor: ${monitor.id}`);
        // We await the crawl so the user sees results immediately on the next page load/refresh
        await performSiteCrawl(monitor.id, 1000).catch(err => {
            console.error('[AutoCrawl] Error during initial discovery:', err);
        });

        // Re-fetch monitor with pages for the final response
        const monitorWithPages = await (prisma as any).uptimeMonitor.findUnique({
            where: { id: monitor.id },
            include: { emails: true, checks: true, pages: { include: { checks: true } } }
        });

        return NextResponse.json({ monitor: monitorWithPages }, { status: 201 });
    } catch (error: any) {
        console.error('[Monitor API] POST error:', error);
        console.error('Stack trace:', error.stack);
        return NextResponse.json({
            error: error.message,
            details: error.stack,
            type: error.constructor.name
        }, { status: 500 });
    }
}

// PATCH — update a monitor or toggle active state
export async function PATCH(request: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const body = await request.json();
        const { id, name, url, interval, active, type, config, responseTimeThreshold, locations } = body;

        if (!id) return NextResponse.json({ error: 'Monitor ID required' }, { status: 400 });

        // Verify ownership
        const existing = await (prisma as any).uptimeMonitor.findFirst({
            where: { id, userId: user.id },
        });
        if (!existing) return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });

        const updateData: any = {};
        if (name !== undefined) updateData.name = name;
        if (url !== undefined) updateData.url = url;
        if (interval !== undefined) updateData.interval = interval;
        if (active !== undefined) updateData.active = active;
        if (type !== undefined) updateData.type = type;
        if (config !== undefined) updateData.config = typeof config === 'string' ? config : JSON.stringify(config);
        if (responseTimeThreshold !== undefined) updateData.responseTimeThreshold = responseTimeThreshold;
        if (locations !== undefined) updateData.locations = Array.isArray(locations) ? JSON.stringify(locations) : locations;

        const monitor = await prisma.uptimeMonitor.update({
            where: { id },
            data: updateData,
            include: { emails: true, checks: { orderBy: { checkedAt: 'desc' }, take: 20 } },
        });

        return NextResponse.json({ monitor });
    } catch (error: any) {
        console.error('[Monitor API] PATCH error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE — remove a monitor
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Monitor ID required' }, { status: 400 });

        // Verify ownership
        const existing = await (prisma as any).uptimeMonitor.findFirst({
            where: { id, userId: user.id },
        });
        if (!existing) return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });

        await (prisma as any).uptimeMonitor.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('[Monitor API] DELETE error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
