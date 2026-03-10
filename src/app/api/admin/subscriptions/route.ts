import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const subscriptions = await prisma.subscription.findMany({
            include: {
                user: { select: { name: true, email: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(subscriptions);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }
}

export async function PATCH(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const subscription = await prisma.subscription.update({
            where: { id: body.id },
            data: {
                plan: body.plan,
                status: body.status,
                currentPeriodEnd: body.currentPeriodEnd ? new Date(body.currentPeriodEnd) : undefined
            }
        });
        return NextResponse.json(subscription);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
    }
}
