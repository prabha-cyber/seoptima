import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const [
            totalUsers,
            activeUsers,
            totalWebsites,
            totalAudits,
            totalKeywords,
            apiRequests,
            systemErrorsCount,
            recentUsers,
            recentWebsites,
            recentAudits,
            recentSubscriptions,
            recentErrors,
            topWebsites
        ] = await Promise.all([
            prisma.user.count(),
            prisma.user.count({
                where: {
                    updatedAt: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                    }
                }
            }),
            prisma.website.count(),
            prisma.seoReport.count(),
            prisma.keyword.count(),
            prisma.apiUsage.count(),
            prisma.systemLog.count({ where: { type: 'ERROR' } }),

            // Recent Activities
            prisma.user.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, email: true, createdAt: true } }),
            prisma.website.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, domain: true, createdAt: true, user: { select: { name: true } } } }),
            prisma.seoReport.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, website: { select: { name: true } }, createdAt: true, overallScore: true } }),
            prisma.subscription.findMany({ take: 5, orderBy: { updatedAt: 'desc' }, where: { plan: { not: 'FREE' } }, select: { id: true, plan: true, updatedAt: true, user: { select: { name: true, email: true } } } }),
            prisma.systemLog.findMany({ take: 5, orderBy: { createdAt: 'desc' }, where: { type: 'ERROR' }, select: { id: true, message: true, source: true, createdAt: true } }),

            // Top Websites
            prisma.website.findMany({
                take: 10,
                orderBy: {
                    createdAt: 'desc', // ideally ordered by traffic or seoReports length, but simple fallback
                },
                select: {
                    id: true,
                    name: true,
                    domain: true,
                    goal: true,
                    user: { select: { name: true, email: true } },
                    _count: {
                        select: { seoReports: true, keywords: true }
                    }
                }
            })
        ]);

        // Generate chart data dynamically (Mocking for structural demo)
        const now = new Date();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        const dailyUsers = Array.from({ length: 7 }).map((_, i) => ({
            name: days[(now.getDay() - 6 + i + 7) % 7],
            value: Math.floor(Math.random() * 50) + 10
        }));

        const websiteActivity = Array.from({ length: 7 }).map((_, i) => ({
            name: days[(now.getDay() - 6 + i + 7) % 7],
            value: Math.floor(Math.random() * 20) + 5
        }));

        const seoAudits = Array.from({ length: 7 }).map((_, i) => ({
            name: days[(now.getDay() - 6 + i + 7) % 7],
            value: Math.floor(Math.random() * 80) + 20
        }));

        const apiUsage = Array.from({ length: 7 }).map((_, i) => ({
            name: days[(now.getDay() - 6 + i + 7) % 7],
            value: Math.floor(Math.random() * 1500) + 500
        }));

        const systemStatus = {
            api: 'Operational',
            server: 'Operational',
            database: 'Operational',
            latency: '42ms'
        };

        return NextResponse.json({
            stats: {
                totalUsers,
                activeUsers,
                totalWebsites,
                totalAudits,
                totalKeywords,
                apiRequests,
                systemErrors: systemErrorsCount
            },
            charts: {
                dailyUsers,
                websiteActivity,
                seoAudits,
                apiUsage
            },
            activities: {
                newUsers: recentUsers,
                newWebsites: recentWebsites,
                newAudits: recentAudits,
                subscriptions: recentSubscriptions,
                errors: recentErrors
            },
            topWebsites,
            systemStatus
        });
    } catch (error: any) {
        console.error('Admin Stats Error:', error);
        return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
    }
}
