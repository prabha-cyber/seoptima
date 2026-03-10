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
        const type = searchParams.get('type') || 'history'; // history | gateways

        if (type === 'gateways') {
            const gateways = await prisma.paymentGateway.findMany();
            return NextResponse.json(gateways);
        }

        const payments = await prisma.payment.findMany({
            include: {
                order: {
                    select: {
                        customerEmail: true,
                        customerName: true,
                        total: true,
                        couponCode: true,
                        discount: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(payments);
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
        const { name, isEnabled, isLive, publicKey, secretKey, webhookSecret, config } = data;

        const gateway = await prisma.paymentGateway.upsert({
            where: { id: data.id || 'new' },
            update: {
                name,
                isEnabled,
                isLive,
                publicKey,
                secretKey,
                webhookSecret,
                config: typeof config === 'string' ? config : JSON.stringify(config)
            },
            create: {
                name,
                isEnabled,
                isLive,
                publicKey,
                secretKey,
                webhookSecret,
                config: typeof config === 'string' ? config : JSON.stringify(config)
            }
        });

        return NextResponse.json(gateway);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
