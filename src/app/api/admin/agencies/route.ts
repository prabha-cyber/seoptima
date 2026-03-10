import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q') || '';

        const agencies = await prisma.agency.findMany({
            where: {
                OR: [
                    { name: { contains: query } },
                    { description: { contains: query } },
                ],
            },
            include: {
                _count: {
                    select: { members: true, websites: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(agencies);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await req.json();
        const { name, description, logo, website, features } = data;

        if (!name) {
            return NextResponse.json({ error: 'Name is required' }, { status: 400 });
        }

        const agency = await prisma.agency.create({
            data: {
                name,
                description,
                logo,
                website,
                features: {
                    create: features?.map((f: any) => ({
                        feature: f.feature,
                        enabled: f.enabled ?? true,
                        limit: f.limit
                    })) || []
                }
            }
        });

        return NextResponse.json(agency);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
