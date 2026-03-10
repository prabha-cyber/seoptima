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
        const websites = await prisma.website.findMany({
            where: query ? {
                OR: [
                    { name: { contains: query } },
                    { domain: { contains: query } },
                    { subdomain: { contains: query } }
                ]
            } : {},
            include: {
                user: { select: { name: true, email: true } },
                seoReports: { orderBy: { createdAt: 'desc' }, take: 1 }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(websites);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch websites' }, { status: 500 });
    }
}
