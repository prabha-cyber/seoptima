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
    const type = searchParams.get('type');
    const source = searchParams.get('source');

    try {
        const logs = await prisma.systemLog.findMany({
            where: {
                AND: [
                    type ? { type } : {},
                    source ? { source } : {}
                ]
            },
            take: 200,
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(logs);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch system logs' }, { status: 500 });
    }
}
