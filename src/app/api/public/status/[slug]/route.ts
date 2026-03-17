import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
    request: Request,
    { params }: { params: { slug: string } }
) {
    try {
        const { slug } = params;

        const statusPage = await (prisma as any).statusPage.findUnique({
            where: { slug, active: true },
            include: {
                monitors: {
                    include: {
                        checks: {
                            orderBy: { checkedAt: 'desc' },
                            take: 50
                        }
                    }
                }
            }
        });

        if (!statusPage) return NextResponse.json({ error: 'Status page not found' }, { status: 404 });

        // Basic check if it's public
        if (!statusPage.isPublic) {
            // In a real app, check for auth or password here
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        return NextResponse.json({ statusPage });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
