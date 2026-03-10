import { NextResponse } from 'next/server';

const SERP_API_KEY = process.env.SERP_API_KEY;
const SERPAPI_BASE = 'https://serpapi.com/search.json';

interface TransparencyCreative {
    advertiser_id: string;
    advertiser: string;
    ad_creative_id: string;
    format: string;
    image?: string;
    link?: string;
    target_domain?: string;
    width?: number;
    height?: number;
    total_days_shown?: number;
    first_shown?: number;
    last_shown?: number;
    details_link?: string;
    serpapi_details_link?: string;
}

interface AdDetail {
    search_information?: {
        format?: string;
        last_shown?: number;
        region_name?: string;
        more_ads_by_advertiser?: string;
        ad_funded_by?: string;
        regions?: Array<{
            region: number;
            region_name: string;
            first_shown?: number;
            last_shown?: number;
            times_shown?: string;
        }>;
    };
    ad_creatives?: Array<{
        call_to_action?: string;
        title?: string;
        headline?: string;
        long_headline?: string;
        snippet?: string;
        visible_link?: string;
        link?: string;
        image?: string;
        advertiser_logo?: string;
        advertiser_logo_alt?: string;
        sitelink_texts?: string[];
        sitelink_descriptions?: string[];
        video_link?: string;
        raw_video_link?: string;
        video_duration?: string;
        thumbnail?: string;
        height?: number;
        width?: number;
        rating?: number;
        reviews?: number;
        is_verified?: boolean;
        extensions?: string[];
    }>;
}

async function fetchAdDetails(advertiserId: string, creativeId: string, region?: string): Promise<AdDetail | null> {
    try {
        const params = new URLSearchParams({
            engine: 'google_ads_transparency_center_ad_details',
            advertiser_id: advertiserId,
            creative_id: creativeId,
            api_key: SERP_API_KEY!,
        });
        if (region) params.set('region', region);

        const res = await fetch(`${SERPAPI_BASE}?${params.toString()}`);
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get('text') || searchParams.get('q') || '';
    const advertiserId = searchParams.get('advertiser_id') || '';
    const region = searchParams.get('region') || '';
    const creativeFormat = searchParams.get('creative_format') || '';
    const num = searchParams.get('num') || '20';

    if (!SERP_API_KEY) {
        return NextResponse.json(
            { error: 'SERP_API_KEY not configured' },
            { status: 500 }
        );
    }

    // If no search query or advertiser ID, return empty state
    if (!text && !advertiserId) {
        return NextResponse.json({
            empty: true,
            message: 'Enter a domain or advertiser name to search for ads.',
        });
    }

    try {
        // Step 1: Search the Ads Transparency Center
        const searchParams2 = new URLSearchParams({
            engine: 'google_ads_transparency_center',
            api_key: SERP_API_KEY,
            num,
        });

        if (advertiserId) {
            searchParams2.set('advertiser_id', advertiserId);
        }
        if (text) {
            searchParams2.set('text', text);
        }
        if (region) {
            searchParams2.set('region', region);
        }
        if (creativeFormat) {
            searchParams2.set('creative_format', creativeFormat);
        }

        console.log(`[AdsAPI] Searching Ads Transparency Center: text=${text}, advertiser=${advertiserId}`);
        const searchRes = await fetch(`${SERPAPI_BASE}?${searchParams2.toString()}`);

        if (!searchRes.ok) {
            const errText = await searchRes.text();
            console.error('[AdsAPI] SerpAPI search error:', errText);
            throw new Error(`SerpAPI returned status ${searchRes.status}`);
        }

        const searchData = await searchRes.json();
        const creatives: TransparencyCreative[] = searchData.ad_creatives || [];
        const totalResults = searchData.search_information?.total_results || creatives.length;
        const nextPageToken = searchData.serpapi_pagination?.next_page_token || null;

        // Step 2: Fetch details for up to the first 6 creatives
        const detailsLimit = Math.min(creatives.length, 6);
        const detailPromises: Promise<AdDetail | null>[] = [];

        for (let i = 0; i < detailsLimit; i++) {
            const c = creatives[i];
            if (c.advertiser_id && c.ad_creative_id) {
                detailPromises.push(fetchAdDetails(c.advertiser_id, c.ad_creative_id, region));
            }
        }

        const detailResults = await Promise.all(detailPromises);

        // Step 3: Merge results
        const enrichedCreatives = creatives.map((creative, idx) => {
            const detail = idx < detailResults.length ? detailResults[idx] : null;
            const adCopy = detail?.ad_creatives?.[0] || null;
            const searchInfo = detail?.search_information || null;

            return {
                // From search results
                advertiser_id: creative.advertiser_id,
                advertiser: creative.advertiser,
                ad_creative_id: creative.ad_creative_id,
                format: creative.format,
                thumbnail: creative.image,
                target_domain: creative.target_domain,
                link: creative.link,
                width: creative.width,
                height: creative.height,
                total_days_shown: creative.total_days_shown,
                first_shown: creative.first_shown ? new Date(creative.first_shown * 1000).toISOString() : null,
                last_shown: creative.last_shown ? new Date(creative.last_shown * 1000).toISOString() : null,
                details_link: creative.details_link,

                // From ad details (enriched)
                title: adCopy?.title || null,
                headline: adCopy?.headline || null,
                long_headline: adCopy?.long_headline || null,
                snippet: adCopy?.snippet || null,
                visible_link: adCopy?.visible_link || null,
                destination_link: adCopy?.link || null,
                advertiser_logo: adCopy?.advertiser_logo || null,
                sitelink_texts: adCopy?.sitelink_texts || [],
                sitelink_descriptions: adCopy?.sitelink_descriptions || [],
                video_link: adCopy?.video_link || null,
                raw_video_link: adCopy?.raw_video_link || null,
                video_duration: adCopy?.video_duration || null,
                call_to_action: adCopy?.call_to_action || null,
                image: adCopy?.image || creative.image || null,
                rating: adCopy?.rating || null,
                reviews: adCopy?.reviews || null,
                is_verified: adCopy?.is_verified || false,
                extensions: adCopy?.extensions || [],
                ad_funded_by: searchInfo?.ad_funded_by || null,
                regions: searchInfo?.regions || [],
                hasDetails: !!adCopy,
            };
        });

        // Derive advertiser name from first creative
        const advertiserName = creatives[0]?.advertiser || text || 'Unknown';

        return NextResponse.json({
            advertiser: advertiserName,
            totalResults,
            searchQuery: text || advertiserId,
            region: region || 'anywhere',
            creativeFormat: creativeFormat || 'all',
            adCreatives: enrichedCreatives,
            nextPageToken,
        });
    } catch (error: any) {
        console.error('[AdsAPI] Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch ads data' },
            { status: 500 }
        );
    }
}
