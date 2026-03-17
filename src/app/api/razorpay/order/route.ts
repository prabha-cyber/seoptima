import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getRazorpayClient, getRazorpayConfig } from '@/lib/razorpay';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { planId } = await req.json();
        const config = await getRazorpayConfig();

        const planPrices: Record<string, number | undefined> = {
            GROWTH: config.prices.growth,
            PRO: config.prices.pro,
            AGENCY: config.prices.agency,
        };

        if (!planId || !planPrices[planId]) {
            return NextResponse.json({ error: 'Invalid plan selected or missing price configuration' }, { status: 400 });
        }

        const amount = planPrices[planId];
        const razorpay = await getRazorpayClient();

        // Create Razorpay Order
        const order = await razorpay.orders.create({
            amount: amount!,
            currency: config.currency,
            receipt: `receipt_${Date.now()}`,
            notes: {
                userId: session.user.id,
                planId: planId,
            },
        });

        return NextResponse.json({
            id: order.id,
            amount: order.amount,
            currency: order.currency,
            keyId: config.keyId, // Needed for frontend
        });
    } catch (error: any) {
        console.error('Razorpay Order Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
