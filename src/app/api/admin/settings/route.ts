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
        const settings = await prisma.systemSetting.findMany({
            orderBy: { group: 'asc' }
        });

        // Convert array to object for easier frontend use
        const settingsMap = settings.reduce((acc: any, curr) => {
            acc[curr.key] = curr.value;
            return acc;
        }, {});

        return NextResponse.json(settingsMap);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { key, value, group } = body;

        const setting = await prisma.systemSetting.upsert({
            where: { key },
            update: { value, updatedAt: new Date() },
            create: { key, value, group: group || 'GENERAL' }
        });

        return NextResponse.json(setting);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
    }
}
