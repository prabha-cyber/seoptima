import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getRazorpayConfig } from '@/lib/razorpay';
import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export async function POST(req: Request) {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            planId,
            amount
        } = await req.json();

        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const config = await getRazorpayConfig();

        // 1. Verify Payment Signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", config.keySecret!)
            .update(body.toString())
            .digest("hex");

        const isSignatureValid = expectedSignature === razorpay_signature;

        if (!isSignatureValid) {
            return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
        }

        // 2. Signature is valid, update database status
        const currentPeriodStart = new Date();
        const currentPeriodEnd = new Date();
        currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1); // Monthly subscription

        // Update Subscription
        await prisma.subscription.upsert({
            where: { userId: session.user.id },
            update: {
                plan: planId,
                status: 'ACTIVE',
                currentPeriodStart,
                currentPeriodEnd,
            },
            create: {
                userId: session.user.id,
                plan: planId,
                status: 'ACTIVE',
                currentPeriodStart,
                currentPeriodEnd,
            }
        });

        // 3. Create Order & Payment records for history
        const order = await prisma.order.create({
            data: {
                websiteId: 'PLATFORM_SUBSCRIPTION',
                customerEmail: session.user.email || 'unknown@example.com',
                customerName: session.user.name || 'User',
                total: amount / 100, // Convert paise to currency unit
                status: 'COMPLETED',
            }
        });

        await prisma.payment.create({
            data: {
                orderId: order.id,
                amount: amount / 100,
                currency: config.currency,
                provider: 'RAZORPAY',
                providerPaymentId: razorpay_payment_id,
                status: 'SUCCESS',
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Razorpay Verification Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
