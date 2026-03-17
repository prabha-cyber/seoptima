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

        const [payments, revenueStats, activeSubscriptions, pendingOrders, refundedStats] = await Promise.all([
            prisma.payment.findMany({
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
            }),
            prisma.payment.aggregate({
                where: { status: { in: ['SUCCESS', 'COMPLETED'] } },
                _sum: { amount: true }
            }),
            prisma.subscription.count({
                where: { status: 'ACTIVE' }
            }),
            prisma.payment.count({
                where: { status: 'PENDING' }
            }),
            prisma.payment.aggregate({
                where: { status: 'REFUNDED' },
                _sum: { amount: true }
            })
        ]);

        return NextResponse.json({
            payments,
            stats: {
                totalRevenue: revenueStats._sum.amount || 0,
                activeSubscriptions,
                pendingOrders,
                refunded: refundedStats._sum.amount || 0
            }
        });
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
        const { id, name, isEnabled, isLive, publicKey, secretKey, webhookSecret, config } = data;

        const gatewayData = {
            name,
            isEnabled: isEnabled ?? true,
            isLive: isLive ?? false,
            publicKey,
            secretKey,
            webhookSecret,
            config: typeof config === 'string' ? config : JSON.stringify(config)
        };

        let gateway;
        if (id && id !== 'new') {
            gateway = await prisma.paymentGateway.update({
                where: { id },
                data: gatewayData
            });
        } else {
            // Check if a gateway with this name already exists to avoid duplicates
            const existing = await prisma.paymentGateway.findFirst({
                where: { name }
            });

            if (existing) {
                gateway = await prisma.paymentGateway.update({
                    where: { id: existing.id },
                    data: gatewayData
                });
            } else {
                gateway = await prisma.paymentGateway.create({
                    data: gatewayData
                });
            }
        }

        return NextResponse.json(gateway);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
