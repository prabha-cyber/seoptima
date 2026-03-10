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
        const backlinks = await prisma.backlink.findMany({
            where: query ? {
                OR: [
                    { referringDomain: { contains: query } },
                    { anchorText: { contains: query } }
                ]
            } : {},
            include: {
                website: { select: { name: true, domain: true } }
            },
            take: 100,
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(backlinks);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch backlinks' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const backlink = await prisma.backlink.create({
            data: {
                websiteId: body.websiteId,
                referringDomain: body.referringDomain,
                anchorText: body.anchorText,
                linkType: body.linkType || 'dofollow',
                authorityScore: body.authorityScore || 0
            }
        });
        return NextResponse.json(backlink);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to create backlink' }, { status: 500 });
    }
}
