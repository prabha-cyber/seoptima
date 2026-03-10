import { NextResponse } from 'next/server';

// Polyfill for File if missing (needed for some ESM libs like undici/cheerio)
if (typeof File === 'undefined') {
    (global as any).File = class File extends Blob {
        name: string;
        lastModified: number;
        constructor(parts: any[], name: string, options?: any) {
            super(parts, options);
            this.name = name;
            this.lastModified = options?.lastModified || Date.now();
        }
    };
}
import { checkRobots, checkSitemap, analyzeTechnical, checkCustom404, checkAssetCaching } from '@/lib/seo/technical';
import { getSearchConsoleData, checkIndexStatus, calculateAuthorityScoring } from '@/lib/seo/google-api';
import { extractStructuredData, validateStructuredData } from '@/lib/seo/structured-data';
import { checkBrokenLinks } from '@/lib/seo/links';
import { getPerformanceMetrics, calculateHeuristicPerformance } from '@/lib/seo/performance';

export async function POST(req: Request) {
    try {
        const { url, websiteId } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        // Import prisma dynamically
        const { prisma } = await import('@/lib/prisma');
        const targetUrl = url.startsWith('http') ? url : `https://${url}`;
        const startTime = Date.now();

        // 1. Fetch main document
        let html = '';
        let responseStatus = 200;

        try {
            const res = await fetch(targetUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36',
                }
            });
            responseStatus = res.status;
            html = await res.text();
        } catch (error) {
            console.error('Fetch error:', error);
            return NextResponse.json({
                error: 'Failed to fetch the website. Make sure the URL is correct and accessible.'
            }, { status: 400 });
        }

        // 2. Run All checks in parallel for "real time accuracy"
        const [
            robots,
            sitemap,
            technical,
            indexStatus,
            structuredData,
            brokenLinks,
            performance,
            custom404,
            assets
        ] = await Promise.all([
            checkRobots(targetUrl),
            checkSitemap(targetUrl),
            analyzeTechnical(html, targetUrl),
            checkIndexStatus(targetUrl),
            extractStructuredData(html),
            checkBrokenLinks(targetUrl, html),
            getPerformanceMetrics(targetUrl),
            checkCustom404(targetUrl),
            checkAssetCaching(targetUrl, html)
        ]);

        const authority = await calculateAuthorityScoring(targetUrl, indexStatus);

        // 3. Compile Results matching the 32 exhausting checks in the UI
        let perfData = performance as any;
        if (perfData.isSimulated || !perfData.performanceScore) {
            const simulation = calculateHeuristicPerformance(html, technical);
            perfData = {
                ...perfData,
                performanceScore: simulation.score,
                largestContentfulPaint: simulation.lcp,
                firstContentfulPaint: simulation.fcp,
                cumulativeLayoutShift: simulation.cls,
                totalBlockingTime: simulation.tbt,
                speedIndex: simulation.speedIndex,
                isSimulated: true
            };
        }
        const perfScore = perfData.performanceScore;

        const { calculateSeoResults, calculateOverallScore } = await import('@/lib/seo/scoring');
        const results = calculateSeoResults({
            url: targetUrl,
            html,
            technical,
            performance: perfData,
            robots,
            sitemap,
            indexStatus,
            brokenLinksCount: brokenLinks.brokenLinks,
            structuredData,
            assets,
            custom404
        });

        const { score: overallScore, passCount, criticalCount, warningCount } = calculateOverallScore(results);

        const stats = {
            loadTimeMs: Date.now() - startTime,
            totalLinks: brokenLinks.totalLinks,
            scannedLinks: brokenLinks.scannedLinks,
            brokenLinks: brokenLinks.brokenLinks,
            brokenDetails: brokenLinks.brokenDetails,
            allLinks: brokenLinks.allLinks,
            performance: perfData,
            authority: authority,
            structuredDataCount: structuredData.length,
            robots: robots,
            sitemap: sitemap,
            custom404: custom404
        };

        // 4. Persist to DB if websiteId is provided
        if (websiteId) {
            try {
                await prisma.seoReport.create({
                    data: {
                        websiteId,
                        overallScore,
                        technicalScore: overallScore,
                        contentScore: overallScore,
                        speedScore: perfScore,
                        crawledPages: 1,
                        issuesFound: criticalCount + warningCount,
                        fullResults: JSON.stringify(results),
                    }
                });
            } catch (dbError) {
                console.error('[DB PERSIST ERROR]', dbError);
            }
        }

        return NextResponse.json({
            success: true,
            results,
            overallScore,
            criticalCount,
            warningCount,
            passCount,
            technical,
            structuredData,
            stats
        });
    } catch (error: any) {
        console.error('Analyzer error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
