import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { websiteId, term, targetUrl } = await req.json();

        if (!websiteId || !term) {
            return NextResponse.json({ error: 'Website ID and term are required' }, { status: 400 });
        }

        // Check if keyword already exists for this website
        const existing = await prisma.keyword.findUnique({
            where: {
                websiteId_term: {
                    websiteId,
                    term,
                },
            },
        });

        if (existing) {
            return NextResponse.json({ error: 'Keyword already being tracked' }, { status: 400 });
        }

        const keyword = await prisma.keyword.create({
            data: {
                websiteId,
                term,
                targetUrl,
            },
        });

        return NextResponse.json(keyword);
    } catch (error: any) {
        console.error('Error tracking keyword:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to track keyword' },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Keyword ID is required' }, { status: 400 });
        }

        await prisma.keyword.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting keyword:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete keyword' },
            { status: 500 }
        );
    }
}

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const websiteId = searchParams.get('websiteId');

        if (!websiteId) {
            return NextResponse.json({ error: 'Website ID is required' }, { status: 400 });
        }

        const keywords = await prisma.keyword.findMany({
            where: { websiteId },
            include: {
                rankings: {
                    orderBy: { recordedAt: 'desc' },
                    take: 7, // Get last 7 days of rankings
                },
            },
        });

        return NextResponse.json(keywords);
    } catch (error: any) {
        console.error('Error fetching keywords:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch keywords' },
            { status: 500 }
        );
    }
}
