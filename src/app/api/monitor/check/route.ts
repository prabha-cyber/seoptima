import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { sendDowntimeAlert } from '@/lib/email';
import { checkAllMonitorPages } from '@/lib/monitor';

async function checkUrl(url: string): Promise<{ statusCode: number | null; responseTime: number; isUp: boolean; error: string | null }> {
    const start = Date.now();
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const res = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
            redirect: 'follow',
            headers: {
                'User-Agent': 'Seoptima-UptimeMonitor/1.0',
            },
        });

        clearTimeout(timeout);
        const responseTime = Date.now() - start;
        const isUp = res.status >= 200 && res.status < 400;

        return {
            statusCode: res.status,
            responseTime,
            isUp,
            error: isUp ? null : `HTTP ${res.status} ${res.statusText}`,
        };
    } catch (err: any) {
        const responseTime = Date.now() - start;
        let error = 'Unknown error';

        if (err.name === 'AbortError') {
            error = 'Request timed out (15s)';
        } else if (err.cause?.code === 'ENOTFOUND') {
            error = 'DNS resolution failed — domain not found';
        } else if (err.cause?.code === 'ECONNREFUSED') {
            error = 'Connection refused';
        } else if (err.cause?.code === 'ECONNRESET') {
            error = 'Connection reset';
        } else if (err.cause?.code === 'CERT_HAS_EXPIRED') {
            error = 'SSL certificate expired';
        } else {
            error = err.message || 'Failed to connect';
        }

        return { statusCode: null, responseTime, isUp: false, error };
    }
}

// POST — run uptime checks
export async function POST(request: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        // Optionally check a single monitor
        let body: any = {};
        try { body = await request.json(); } catch { /* no body is fine */ }
        const monitorId = body?.monitorId;

        const whereClause: any = { userId: user.id, active: true };
        if (monitorId) whereClause.id = monitorId;

        const monitors = await prisma.uptimeMonitor.findMany({
            where: whereClause,
            include: { emails: true },
        });

        if (!monitors.length) {
            return NextResponse.json({ message: 'No active monitors found', results: [] });
        }

        const results: any[] = [];
        const downPages: any[] = [];

        for (const monitor of monitors) {
            const checkData = await checkAllMonitorPages(monitor.id);
            if (!checkData) continue;

            results.push({
                monitorId: monitor.id,
                name: monitor.name,
                ...checkData.mainResult,
                subpagesChecked: checkData.subpagesChecked,
                subpagesDown: checkData.subpagesDown,
            });

            if (checkData.downPagesForAlert.length > 0) {
                downPages.push(...checkData.downPagesForAlert);
            }
        }

        // Send email alerts for DOWN pages grouped by email recipients
        const emailMap = new Map<string, any[]>();
        for (const dp of downPages) {
            for (const email of (dp.emails as string[])) {
                if (!emailMap.has(email)) emailMap.set(email, []);
                emailMap.get(email)!.push(dp);
            }
        }

        // Send grouped alerts
        const emailEntries = Array.from(emailMap.entries());
        for (const [email, pages] of emailEntries) {
            await sendDowntimeAlert([email], pages);
        }

        return NextResponse.json({
            message: `Checked ${monitors.length} monitor(s)`,
            results,
            alertsSent: downPages.length > 0,
            downCount: downPages.length,
        });
    } catch (error: any) {
        console.error('[Monitor Check] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
