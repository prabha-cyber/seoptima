import { NextResponse } from 'next/server';

const SERP_API_KEY = process.env.SERP_API_KEY;
const SERPAPI_BASE = 'https://serpapi.com/search.json';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const advertiserId = searchParams.get('advertiser_id');
    const creativeId = searchParams.get('creative_id');
    const region = searchParams.get('region') || '';

    if (!advertiserId || !creativeId) {
        return NextResponse.json(
            { error: 'advertiser_id and creative_id are required' },
            { status: 400 }
        );
    }

    if (!SERP_API_KEY) {
        return NextResponse.json(
            { error: 'SERP_API_KEY not configured' },
            { status: 500 }
        );
    }

    try {
        const params = new URLSearchParams({
            engine: 'google_ads_transparency_center_ad_details',
            advertiser_id: advertiserId,
            creative_id: creativeId,
            api_key: SERP_API_KEY,
        });
        if (region) params.set('region', region);

        const res = await fetch(`${SERPAPI_BASE}?${params.toString()}`);
        if (!res.ok) {
            throw new Error(`SerpAPI returned status ${res.status}`);
        }

        const data = await res.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error fetching ad details from SerpAPI:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch ad details' },
            { status: 500 }
        );
    }
}
