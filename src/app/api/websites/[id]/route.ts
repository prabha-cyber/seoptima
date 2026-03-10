import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const website = await prisma.website.findUnique({
            where: { id: params.id },
            include: { user: true }
        });

        if (!website) {
            return NextResponse.json({ error: 'Website not found' }, { status: 404 });
        }

        if (website.user.email !== session.user.email) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await prisma.website.delete({
            where: { id: params.id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Delete website error:', error);
        return NextResponse.json({ error: 'Failed to delete website' }, { status: 500 });
    }
}
