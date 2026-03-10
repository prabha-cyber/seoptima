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
    const country = searchParams.get('country');

    try {
        const keywords = await prisma.keyword.findMany({
            where: {
                AND: [
                    query ? { term: { contains: query } } : {},
                    // Add country/lang filters if we add them to schema
                ]
            },
            include: {
                website: { select: { name: true, domain: true } }
            },
            take: 100,
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(keywords);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch keywords' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const keyword = await prisma.keyword.create({
            data: {
                term: body.term,
                websiteId: body.websiteId,
                status: body.status || 'TRACKING'
            }
        });
        return NextResponse.json(keyword);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create keyword' }, { status: 500 });
    }
}
