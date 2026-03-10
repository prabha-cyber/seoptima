import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

import bcrypt from 'bcryptjs';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    const role = searchParams.get('role');

    try {
        const users = await prisma.user.findMany({
            where: {
                AND: [
                    query ? {
                        OR: [
                            { name: { contains: query } },
                            { email: { contains: query } }
                        ]
                    } : {},
                    role ? { role } : {}
                ]
            },
            include: {
                websites: { select: { id: true } },
                subscription: true
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(users);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { name, email, password, role, plan } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json({ error: 'Email already in use' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'USER',
                subscription: {
                    create: {
                        plan: plan || 'FREE',
                        status: 'ACTIVE'
                    }
                }
            }
        });

        return NextResponse.json(user);
    } catch (error: any) {
        return NextResponse.json({ error: error.message || 'Failed to create user' }, { status: 500 });
    }
}
