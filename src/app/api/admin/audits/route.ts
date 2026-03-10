import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');

    try {
        const reports = await prisma.seoReport.findMany({
            where: query ? {
                website: {
                    OR: [
                        { name: { contains: query } },
                        { domain: { contains: query } }
                    ]
                }
            } : {},
            include: {
                website: {
                    select: {
                        name: true,
                        domain: true,
                        user: { select: { name: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(reports);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch audit reports' }, { status: 500 });
    }
}
