import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const statusPages = await (prisma as any).statusPage.findMany({
            where: { userId: user.id },
            include: { monitors: true }
        });

        return NextResponse.json({ statusPages });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const body = await request.json();
        const { name, slug, description, theme, isPublic, monitorIds } = body;

        const statusPage = await (prisma as any).statusPage.create({
            data: {
                userId: user.id,
                name,
                slug,
                description,
                theme: theme || 'DARK',
                isPublic: isPublic ?? true,
                monitors: {
                    connect: monitorIds.map((id: string) => ({ id }))
                }
            },
            include: { monitors: true }
        });

        return NextResponse.json({ statusPage }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });

        await (prisma as any).statusPage.delete({
            where: { id, userId: user.id }
        });

        return NextResponse.json({ message: 'Status page deleted' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
