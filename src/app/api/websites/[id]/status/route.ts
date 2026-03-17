import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { status } = body;

        if (!status) {
            return NextResponse.json({ error: 'Status is required' }, { status: 400 });
        }

        // Verify the user owns the website before updating
        const website = await prisma.website.findUnique({
            where: { id: params.id }
        });

        if (!website || website.userId !== session.user.id) {
            return NextResponse.json({ error: 'Not found or unauthorized' }, { status: 404 });
        }

        const updatedWebsite = await prisma.website.update({
            where: { id: params.id },
            data: { status }
        });

        return NextResponse.json(updatedWebsite);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to update website status' }, { status: 500 });
    }
}
