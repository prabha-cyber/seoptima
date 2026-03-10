import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

// GET — list emails for a monitor
export async function GET(request: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const monitorId = searchParams.get('monitorId');

        if (!monitorId) return NextResponse.json({ error: 'monitorId required' }, { status: 400 });

        const emails = await prisma.monitorEmail.findMany({
            where: { monitorId },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json({ emails });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST — add an email to a monitor
export async function POST(request: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await prisma.user.findUnique({ where: { email: session.user.email } });
        if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });

        const body = await request.json();
        const { monitorId, email } = body;

        if (!monitorId || !email) {
            return NextResponse.json({ error: 'monitorId and email are required' }, { status: 400 });
        }

        // Process multiple comma-separated emails
        const emails = email.split(',').map((e: string) => e.toLowerCase().trim()).filter((e: string) => e);

        if (emails.length === 0) {
            return NextResponse.json({ error: 'No valid emails provided' }, { status: 400 });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = emails.filter((e: string) => !emailRegex.test(e));
        if (invalidEmails.length > 0) {
            return NextResponse.json({ error: `Invalid email format detected: ${invalidEmails.join(', ')}` }, { status: 400 });
        }

        // Verify monitor ownership
        const monitor = await prisma.uptimeMonitor.findFirst({
            where: { id: monitorId, userId: user.id },
            include: { emails: true }
        });
        if (!monitor) return NextResponse.json({ error: 'Monitor not found' }, { status: 404 });

        // Filter out existing emails
        const existingEmails = new Set(monitor.emails.map(e => e.email));
        const newEmails = emails.filter((e: string) => !existingEmails.has(e));

        if (newEmails.length === 0) {
            return NextResponse.json({ error: 'All provided emails are already registered for this monitor' }, { status: 409 });
        }

        // Create new email records
        await prisma.monitorEmail.createMany({
            data: newEmails.map((e: string) => ({
                monitorId,
                email: e,
            })),
        });

        // Fetch the newly created emails to return
        const createdEmails = await prisma.monitorEmail.findMany({
            where: {
                monitorId,
                email: { in: newEmails }
            }
        });

        // For backward compatibility, return the first created email as 'email' along with the full array
        return NextResponse.json({ email: createdEmails[0], emails: createdEmails }, { status: 201 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE — remove an email from a monitor
export async function DELETE(request: Request) {
    try {
        const session = await getServerSession();
        if (!session?.user?.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'Email ID required' }, { status: 400 });

        await prisma.monitorEmail.delete({ where: { id } });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
