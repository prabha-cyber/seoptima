import Razorpay from 'razorpay';
import { prisma } from './prisma';

export async function getRazorpayConfig() {
    // Try to get config from database first
    const gateway = await prisma.paymentGateway.findFirst({
        where: { name: 'Razorpay' }
    });

    const config = gateway?.config ? JSON.parse(gateway.config) : {};

    return {
        keyId: gateway?.publicKey || process.env.RAZORPAY_KEY_ID,
        keySecret: gateway?.secretKey || process.env.RAZORPAY_KEY_SECRET,
        prices: {
            growth: config.growthPrice || process.env.RAZORPAY_GROWTH_PRICE || 2900, // in paise
            pro: config.proPrice || process.env.RAZORPAY_PRO_PRICE || 7900,
            agency: config.agencyPrice || process.env.RAZORPAY_AGENCY_PRICE || 19900,
        },
        currency: config.currency || process.env.RAZORPAY_CURRENCY || 'INR',
        appUrl: config.appUrl || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    };
}

export async function getRazorpayClient() {
    const config = await getRazorpayConfig();

    if (!config.keyId || !config.keySecret) {
        throw new Error('Razorpay Key ID or Secret is missing. Please configure it in the Admin Dashboard or environment variables.');
    }

    return new Razorpay({
        key_id: config.keyId,
        key_secret: config.keySecret,
    });
}
