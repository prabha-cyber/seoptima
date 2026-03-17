import Stripe from 'stripe';
import { prisma } from './prisma';

export async function getStripeConfig() {
    // Try to get config from database first
    const gateway = await prisma.paymentGateway.findFirst({
        where: { name: 'Stripe' }
    });

    const config = gateway?.config ? JSON.parse(gateway.config) : {};

    return {
        secretKey: gateway?.secretKey || process.env.STRIPE_SECRET_KEY,
        publicKey: gateway?.publicKey || process.env.STRIPE_PUBLISHABLE_KEY,
        webhookSecret: gateway?.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET,
        priceIds: {
            growth: config.growthPriceId || process.env.STRIPE_GROWTH_PRICE_ID,
            pro: config.proPriceId || process.env.STRIPE_PRO_PRICE_ID,
            agency: config.agencyPriceId || process.env.STRIPE_AGENCY_PRICE_ID,
        },
        appUrl: config.appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    };
}

export async function getStripeClient() {
    const config = await getStripeConfig();
    if (!config.secretKey) {
        throw new Error('Stripe Secret Key is missing. Please configure it in the Admin Dashboard or environment variables.');
    }
    return new Stripe(config.secretKey, {
        apiVersion: '2025-02-24.acacia',
        typescript: true,
    });
}

// Keep the static export for backward compatibility if possible, but it might fail if key is missing
// Better to use getStripeClient() in API routes now.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'dummy_key', {
    apiVersion: '2025-02-24.acacia',
    typescript: true,
});

export const getStripeSession = async (sessionId: string) => {
    const client = await getStripeClient();
    return await client.checkout.sessions.retrieve(sessionId);
};

export const createCheckoutSession = async ({
    userId,
    userEmail,
    priceId,
    planName,
    successUrl,
    cancelUrl,
}: {
    userId: string;
    userEmail: string;
    priceId: string;
    planName: string;
    successUrl: string;
    cancelUrl: string;
}) => {
    const client = await getStripeClient();
    return await client.checkout.sessions.create({
        customer_email: userEmail,
        payment_method_types: ['card'],
        line_items: [
            {
                price: priceId,
                quantity: 1,
            },
        ],
        mode: 'subscription',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
            userId,
            planName,
        },
        subscription_data: {
            metadata: {
                userId,
                planName,
            },
        },
    });
};
