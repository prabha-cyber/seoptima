import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getStripeClient, getStripeConfig } from '@/lib/stripe';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { planId } = await req.json();
        const config = await getStripeConfig();

        const priceIds: Record<string, string | undefined> = {
            GROWTH: config.priceIds.growth,
            PRO: config.priceIds.pro,
            AGENCY: config.priceIds.agency,
        };

        if (!planId || !priceIds[planId]) {
            return NextResponse.json({ error: 'Invalid plan selected or missing price configuration' }, { status: 400 });
        }

        const priceId = priceIds[planId];
        const stripe = await getStripeClient();

        const checkoutSession = await stripe.checkout.sessions.create({
            customer_email: session.user.email,
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            success_url: `${config.appUrl}/billing?success=true`,
            cancel_url: `${config.appUrl}/billing?canceled=true`,
            metadata: {
                userId: session.user.id,
                planId: planId,
            },
        });

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error: any) {
        console.error('Stripe Checkout Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
