import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET() {
    try {
        const flags = await prisma.featureFlag.findMany();
        return NextResponse.json(flags);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { name, enabled } = await req.json();

        if (!name) {
            return NextResponse.json({ error: 'Feature name is required' }, { status: 400 });
        }

        const flag = await prisma.featureFlag.upsert({
            where: { name },
            update: { enabled },
            create: { name, enabled },
        });

        return NextResponse.json(flag);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
