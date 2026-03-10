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

        const { websiteId, name, url } = await req.json();

        if (!websiteId || !name || !url) {
            return NextResponse.json({ error: 'Website ID, name, and URL are required' }, { status: 400 });
        }

        const competitor = await prisma.competitor.create({
            data: {
                websiteId,
                name,
                url,
            },
        });

        return NextResponse.json(competitor);
    } catch (error: any) {
        console.error('Error adding competitor:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to add competitor' },
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
            return NextResponse.json({ error: 'Competitor ID is required' }, { status: 400 });
        }

        await prisma.competitor.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting competitor:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to delete competitor' },
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

        const competitors = await prisma.competitor.findMany({
            where: { websiteId },
        });

        return NextResponse.json(competitors);
    } catch (error: any) {
        console.error('Error fetching competitors:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch competitors' },
            { status: 500 }
        );
    }
}
