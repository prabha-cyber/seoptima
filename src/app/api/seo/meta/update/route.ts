import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { url, metaTitle, metaDesc, websiteId } = await req.json();
        if (!url || !websiteId) {
            return NextResponse.json({ error: 'URL and Website ID are required' }, { status: 400 });
        }

        // The URL from the crawler might be absolute, we need to map it to a Page or Post slug
        // For simplicity in this specialized tool, we'll try to find an existing Page by slug
        // If not found, we'll create a new Page record for this website

        const path = new URL(url).pathname;
        const slug = path === '/' ? '/' : path.replace(/\/$/, '').slice(1);

        const page = await prisma.page.upsert({
            where: {
                websiteId_slug: {
                    websiteId,
                    slug
                }
            },
            update: {
                metaTitle,
                metaDesc
            },
            create: {
                websiteId,
                slug,
                title: metaTitle || 'Untitled Page',
                metaTitle,
                metaDesc,
                content: '[]',
                published: true
            }
        });

        return NextResponse.json({ success: true, page });
    } catch (error) {
        console.error('[META UPDATE ERROR]', error);
        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }
}
