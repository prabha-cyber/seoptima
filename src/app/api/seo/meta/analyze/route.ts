import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { MetaAnalyzer } from '@/lib/seo/meta-analyzer';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { url } = await req.json();
        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const analyzer = new MetaAnalyzer(50); // Limit to 50 pages for now
        const results = await analyzer.analyze(url);

        return NextResponse.json({ results });
    } catch (error) {
        console.error('[META ANALYZE ERROR]', error);
        return NextResponse.json({ error: 'Analysis failed' }, { status: 500 });
    }
}
