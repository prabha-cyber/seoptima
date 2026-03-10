import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTokens } from '@/lib/gsc/client';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    try {
        const tokens = await getTokens(code);

        // Save tokens to the GscToken model
        await prisma.gscToken.upsert({
            where: { userId: session.user.id },
            update: {
                accessToken: tokens.access_token || '',
                refreshToken: tokens.refresh_token || '',
                expiryDate: BigInt(tokens.expiry_date || 0),
            },
            create: {
                userId: session.user.id,
                accessToken: tokens.access_token || '',
                refreshToken: tokens.refresh_token || '',
                expiryDate: BigInt(tokens.expiry_date || 0),
            },
        });

        console.log('GSC Tokens saved for user:', session.user.id);

        // Redirect back to the dashboard or settings page
        return NextResponse.redirect(`${process.env.NEXT_PUBLIC_APP_URL}/dashboard?gsc=success`);
    } catch (error) {
        console.error('Error getting GSC tokens:', error);
        return NextResponse.json({ error: 'Failed to authenticate with GSC' }, { status: 500 });
    }
}
