import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateKeywordRankings } from '@/lib/seo/rank-tracker';

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { websiteId } = await req.json();

        if (!websiteId) {
            return NextResponse.json({ error: 'Website ID is required' }, { status: 400 });
        }

        await updateKeywordRankings(websiteId);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error syncing keywords:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to sync keywords' },
            { status: 500 }
        );
    }
}
