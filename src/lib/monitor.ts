import { prisma } from './prisma';
import { sendSiteCrawlReport } from './email';
import * as cheerio from 'cheerio';
import { analyzeTechnical } from './seo/technical';
import { calculateSeoResults, calculateOverallScore } from './seo/scoring';
import { checkRobots, checkSitemap, checkCustom404, checkAssetCaching } from './seo/technical';

// Polyfill for File class in Node.js 18 (required for Next.js 14 / undici)
if (typeof global.File === 'undefined') {
    const { File } = require('node:buffer');
    if (File) {
        (global as any).File = File;
    } else {
        // Fallback for older Node.js versions if needed
        (global as any).File = class File extends Blob {
            name: string;
            lastModified: number;
            constructor(chunks: any[], name: string, options?: any) {
                super(chunks, options);
                this.name = name;
                this.lastModified = options?.lastModified || Date.now();
            }
        };
    }
}

export interface PageResult {
    url: string;
    statusCode: number | null;
    responseTime: number;
    isUp: boolean;
    error: string | null;
    redirected: boolean;
    finalUrl?: string;
}

export async function checkSingleUrl(url: string): Promise<PageResult> {
    const start = Date.now();
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);

        const res = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
            redirect: 'follow',
            headers: { 'User-Agent': 'Seoptima-SiteCrawler/1.0' },
        });

        clearTimeout(timeout);
        const responseTime = Date.now() - start;
        const isUp = res.status >= 200 && res.status < 400;

        return {
            url,
            statusCode: res.status,
            responseTime,
            isUp,
            error: isUp ? null : `HTTP ${res.status} ${res.statusText}`,
            redirected: res.redirected,
            finalUrl: res.redirected ? res.url : undefined,
        };
    } catch (err: any) {
        const responseTime = Date.now() - start;
        let error = 'Unknown error';

        if (err.name === 'AbortError') error = 'Request timed out (15s)';
        else if (err.cause?.code === 'ENOTFOUND') error = 'DNS resolution failed';
        else if (err.cause?.code === 'ECONNREFUSED') error = 'Connection refused';
        else if (err.cause?.code === 'ECONNRESET') error = 'Connection reset';
        else if (err.cause?.code === 'CERT_HAS_EXPIRED') error = 'SSL certificate expired';
        else error = err.message || 'Failed to connect';

        return { url, statusCode: null, responseTime, isUp: false, error, redirected: false };
    }
}

export async function discoverPages(startUrl: string, maxPages: number = 1000): Promise<string[]> {
    const visited = new Set<string>();
    const queue: string[] = [];
    const discovered: string[] = [];

    // Normalize the start URL
    let normalizedUrl = startUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
    }

    // Establish domain
    let domain = '';
    try {
        const initialRes = await fetch(normalizedUrl, {
            headers: { 'User-Agent': 'Seoptima-SiteCrawler/1.0' },
            redirect: 'follow',
        });
        const finalUrl = new URL(initialRes.url);
        domain = finalUrl.hostname.replace(/^www\./, '');
        normalizedUrl = initialRes.url;
    } catch {
        return [normalizedUrl]; // At minimum, return the start URL itself
    }

    queue.push(normalizedUrl);

    while (queue.length > 0 && visited.size < maxPages) {
        const url = queue.shift()!;
        if (visited.has(url)) continue;
        visited.add(url);
        discovered.push(url);

        try {
            const res = await fetch(url, {
                headers: { 'User-Agent': 'Seoptima-SiteCrawler/1.0' },
                redirect: 'follow',
            });

            if (!res.ok) continue;

            const html = await res.text();
            const $ = cheerio.load(html);

            $('a[href]').each((_: number, el: any) => {
                const href = $(el).attr('href');
                if (!href) return;

                try {
                    const absoluteUrl = new URL(href, url);
                    const cleanUrl = `${absoluteUrl.protocol}//${absoluteUrl.host}${absoluteUrl.pathname}`;
                    const targetHost = absoluteUrl.hostname.replace(/^www\./, '');

                    if (targetHost === domain && !visited.has(cleanUrl) && !queue.includes(cleanUrl)) {
                        queue.push(cleanUrl);
                    }
                } catch {
                    // Invalid URL, skip
                }
            });
        } catch {
            // Crawl error, skip link discovery for this page
        }
    }

    return discovered;
}

export async function performSiteCrawl(monitorId: string, maxPages: number = 1000) {
    const monitor = await (prisma as any).uptimeMonitor.findUnique({
        where: { id: monitorId },
        include: { emails: true },
    });

    if (!monitor) return null;

    // Set status to CRAWLING and progress to 0
    await (prisma as any).uptimeMonitor.update({
        where: { id: monitorId },
        data: {
            status: 'CRAWLING',
            crawlProgress: 0
        }
    });

    console.log(`[MonitorUtil] Starting auto-crawl for: ${monitor.url}`);

    // Step 1: Discover all pages
    const pages = await discoverPages(monitor.url, maxPages);
    const results: PageResult[] = [];
    const seoResults: any[] = [];
    const totalPages = pages.length;

    // Get site-wide SEO data once
    const robots = await checkRobots(monitor.url);
    const sitemap = await checkSitemap(monitor.url);
    const custom404 = await checkCustom404(monitor.url);

    // Step 2: Save and check pages
    for (let i = 0; i < totalPages; i++) {
        const pageUrl = pages[i];

        // Calculate progress matching front-end (0-99 during crawl, 100 at end)
        const currentProgress = totalPages > 0 ? Math.floor((i / totalPages) * 100) : 0;

        // Update database progress every 5 pages or if it's the first/last few to avoid DB spam
        if (i % 5 === 0 || i < 5 || i > totalPages - 5) {
            await (prisma as any).uptimeMonitor.update({
                where: { id: monitorId },
                data: { crawlProgress: currentProgress }
            });
        }

        const result = await checkSingleUrl(pageUrl);
        results.push(result);

        // SEO Analysis
        let seoScore = 0;
        let metaTitle = '';
        let metaDescription = '';

        try {
            // Fetch HTML for analysis (already fetched in discoverPages but we need it here)
            const res = await fetch(pageUrl, { headers: { 'User-Agent': 'Seoptima-SiteCrawler/1.0' } });
            if (res.ok) {
                const html = await res.text();
                const technical = await analyzeTechnical(html, pageUrl);
                const assets = await checkAssetCaching(pageUrl, html);

                const scoredResults = calculateSeoResults({
                    url: pageUrl,
                    html,
                    technical,
                    performance: { performanceScore: 0 }, // We don't have performance here
                    robots,
                    sitemap,
                    indexStatus: { indexed: true },
                    assets,
                    custom404
                });

                const { score } = calculateOverallScore(scoredResults);
                seoScore = score;
                metaTitle = technical.title || '';
                metaDescription = technical.metaDescription || '';
            }
        } catch (e) {
            console.error(`[MonitorUtil] SEO Analysis failed for ${pageUrl}:`, e);
        }

        seoResults.push({ url: pageUrl, seoScore, metaTitle, metaDescription });

        const monitorPage = await (prisma as any).monitorPage.upsert({
            where: {
                monitorId_url: {
                    monitorId: monitor.id,
                    url: pageUrl,
                },
            },
            update: {
                active: true,
                metaTitle,
                metaDescription,
                seoScore,
                lastAnalyzed: new Date(),
            },
            create: {
                monitorId: monitor.id,
                url: pageUrl,
                active: true,
                metaTitle,
                metaDescription,
                seoScore,
                lastAnalyzed: new Date(),
            },
        });

        await (prisma as any).uptimeCheck.create({
            data: {
                monitorId: monitor.id,
                pageId: monitorPage.id,
                statusCode: result.statusCode,
                responseTime: result.responseTime,
                seoScore,
                isUp: result.isUp,
                error: result.error ? result.error : (result.redirected ? `Redirected to ${result.finalUrl}` : null),
            },
        });

        if (result.redirected) {
            await (prisma as any).notification.create({
                data: {
                    userId: monitor.userId,
                    title: 'URL Redirect Detected',
                    message: `Monitor "${monitor.name}" URL redirected from ${result.url} to ${result.finalUrl}`,
                    type: 'WARNING',
                    link: `/monitor`,
                },
            });
        }
    }

    // Step 3: Global summary
    const upPages = results.filter((r) => r.isUp);
    const downPages = results.filter((r) => !r.isUp && !r.redirected);
    const redirectedPages = results.filter((r) => r.redirected);
    const avgResponseTime = results.length > 0
        ? Math.round(results.reduce((sum, r) => sum + r.responseTime, 0) / results.length)
        : 0;

    await (prisma as any).uptimeMonitor.update({
        where: { id: monitor.id },
        data: {
            status: downPages.length === 0 ? 'UP' : 'DOWN',
            crawlProgress: 100,
            lastChecked: new Date(),
            lastStatus: downPages.length > 0 ? (downPages[0].statusCode || 0) : 200,
            lastResponseTime: avgResponseTime,
        },
    });

    // Step 4: Alert
    const alertEmails = monitor.emails.map((e: any) => e.email);
    const issuePages = [...downPages, ...redirectedPages];
    if (alertEmails.length > 0 && issuePages.length > 0) {
        await sendSiteCrawlReport(alertEmails, {
            siteName: monitor.name,
            siteUrl: monitor.url,
            totalPages: results.length,
            upCount: upPages.length,
            downCount: downPages.length,
            redirectCount: redirectedPages.length,
            avgResponseTime,
            pages: results.map((r, idx) => ({
                ...r,
                seoScore: seoResults[idx]?.seoScore || 0,
                responseTime: r.responseTime || 0,
            })),
            checkedAt: new Date(),
        });
    }

    return {
        results: results.map((r, idx) => ({ ...r, seoScore: seoResults[idx]?.seoScore || 0 })),
        summary: { total: results.length, up: upPages.length, down: downPages.length, redirects: redirectedPages.length }
    };
}

export async function checkAllMonitorPages(monitorId: string) {
    const monitor = await (prisma as any).uptimeMonitor.findUnique({
        where: { id: monitorId },
        include: { emails: true, pages: { where: { active: true }, take: 50 } },
    });

    if (!monitor) return null;

    // 1. Check main URL
    const mainResult = await checkSingleUrl(monitor.url);
    await (prisma as any).uptimeCheck.create({
        data: {
            monitorId: monitor.id,
            statusCode: mainResult.statusCode,
            responseTime: mainResult.responseTime,
            isUp: mainResult.isUp,
            error: mainResult.error || (mainResult.redirected ? `Redirected to ${mainResult.finalUrl}` : null),
        },
    });

    if (mainResult.redirected) {
        await (prisma as any).notification.create({
            data: {
                userId: monitor.userId,
                title: 'URL Redirect Detected',
                message: `Monitor "${monitor.name}" main URL redirected from ${monitor.url} to ${mainResult.finalUrl}`,
                type: 'WARNING',
                link: `/monitor`,
            },
        });
    }

    const downPagesForAlert: any[] = [];
    if (!mainResult.isUp || mainResult.redirected) {
        downPagesForAlert.push({
            monitor,
            name: monitor.name,
            url: monitor.url,
            statusCode: mainResult.statusCode,
            error: mainResult.error || (mainResult.redirected ? `Redirected to ${mainResult.finalUrl}` : null),
            responseTime: mainResult.responseTime,
            checkedAt: new Date(),
            emails: monitor.emails.map((e: any) => e.email),
            redirected: mainResult.redirected,
        });
    }

    // 2. Check all discovered subpages
    const pageResults = [];
    for (const page of monitor.pages) {
        const pResult = await checkSingleUrl(page.url);
        await (prisma as any).uptimeCheck.create({
            data: {
                monitorId: monitor.id,
                pageId: page.id,
                statusCode: pResult.statusCode,
                responseTime: pResult.responseTime,
                isUp: pResult.isUp,
                error: pResult.error || (pResult.redirected ? `Redirected to ${pResult.finalUrl}` : null),
            },
        });

        if (pResult.redirected) {
            await (prisma as any).notification.create({
                data: {
                    userId: monitor.userId,
                    title: 'Subpage Redirect Detected',
                    message: `Monitor "${monitor.name}" subpage ${page.url} redirected to ${pResult.finalUrl}`,
                    type: 'WARNING',
                    link: `/monitor`,
                },
            });
        }

        if (!pResult.isUp || pResult.redirected) {
            downPagesForAlert.push({
                monitor,
                name: `${monitor.name} - ${page.url}`,
                url: page.url,
                statusCode: pResult.statusCode,
                error: pResult.error || (pResult.redirected ? `Redirected to ${pResult.finalUrl}` : null),
                responseTime: pResult.responseTime,
                checkedAt: new Date(),
                emails: monitor.emails.map((e: any) => e.email),
                redirected: pResult.redirected,
            });
        }
        pageResults.push(pResult);
    }

    // 3. Update overall status
    const anySubpageDown = pageResults.some(r => !r.isUp);
    const overallIsUp = mainResult.isUp && !anySubpageDown;

    await (prisma as any).uptimeMonitor.update({
        where: { id: monitor.id },
        data: {
            status: overallIsUp ? 'UP' : 'DOWN',
            lastChecked: new Date(),
            lastStatus: mainResult.statusCode,
            lastResponseTime: mainResult.responseTime,
        },
    });

    return {
        monitorId: monitor.id,
        mainResult,
        subpagesChecked: monitor.pages.length,
        subpagesDown: pageResults.filter(r => !r.isUp).length,
        downPagesForAlert,
    };
}
