import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const websiteId = searchParams.get('websiteId');

        if (!websiteId) {
            return NextResponse.json({ error: 'Website ID is required' }, { status: 400 });
        }

        const reports = await prisma.seoReport.findMany({
            where: {
                websiteId,
                website: {
                    userId: session.user.id
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        return NextResponse.json(reports);
    } catch (error) {
        console.error('[REPORTS_GET]', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
