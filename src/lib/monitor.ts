import { prisma } from './prisma';
import { sendSiteCrawlReport, sendDowntimeAlert } from './email';
import * as cheerio from 'cheerio';
import { analyzeTechnical } from './seo/technical';
import { calculateSeoResults, calculateOverallScore } from './seo/scoring';
import { checkRobots, checkSitemap, checkCustom404, checkAssetCaching } from './seo/technical';
import { robustFetch } from './seo/fetch';
import tls from 'tls';
import dns from 'dns/promises';
import axios from 'axios';

// Polyfill for File and Blob in Node.js 18 (required for Next.js 14 / undici / fetch)
if (typeof global.File === 'undefined' || typeof global.Blob === 'undefined') {
    try {
        const { File, Blob } = require('node:buffer');
        if (File && typeof global.File === 'undefined') (global as any).File = File;
        if (Blob && typeof global.Blob === 'undefined') (global as any).Blob = Blob;
    } catch (e) {
        // Fallback for environments where node:buffer doesn't have File/Blob
    }

    if (typeof global.File === 'undefined') {
        (global as any).File = class File extends (global.Blob || class { }) {
            name: string;
            lastModified: number;
            constructor(chunks: any[], name: string, options?: any) {
                // @ts-ignore
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
    html?: string;
}

export async function checkSingleUrl(url: string, type: string = 'HTTP', config: any = {}): Promise<PageResult> {
    const start = Date.now();
    try {
        if (type === 'API') {
            return await checkApiUrl(url, config);
        } else if (type === 'SSL') {
            return await checkSslStatus(url, config);
        } else if (type === 'DNS') {
            return await checkDnsStatus(url, config);
        }

        // Default HTTP check
        const { html, status, url: finalUrl, error: fetchError } = await robustFetch(url);
        const responseTime = Date.now() - start;
        const isUp = status >= 200 && status < 400;
        const redirected = finalUrl !== url;

        return {
            url,
            statusCode: status,
            responseTime,
            isUp,
            error: fetchError || (isUp ? null : `HTTP ${status}`),
            redirected,
            finalUrl: redirected ? finalUrl : undefined,
            html: html || '',
        };
    } catch (err: any) {
        const responseTime = Date.now() - start;
        return { url, statusCode: null, responseTime, isUp: false, error: err.message || 'Failed to connect', redirected: false, html: '' };
    }
}

async function checkApiUrl(url: string, config: any): Promise<PageResult> {
    const start = Date.now();
    const { method = 'GET', headers = {}, body = null, expectedStatus = 200, expectedJSON = null } = config;
    try {
        const response = await axios({
            url,
            method,
            headers,
            data: body,
            timeout: 30000,
            validateStatus: () => true
        });

        const responseTime = Date.now() - start;
        let isUp = response.status === expectedStatus;
        let error = isUp ? null : `Expected status ${expectedStatus}, got ${response.status}`;

        if (isUp && expectedJSON) {
            // Basic JSON containment check
            const respDataStr = JSON.stringify(response.data);
            const expectedStr = typeof expectedJSON === 'string' ? expectedJSON : JSON.stringify(expectedJSON);
            if (!respDataStr.includes(expectedStr)) {
                isUp = false;
                error = 'JSON response does not contain expected pattern';
            }
        }

        return {
            url,
            statusCode: response.status,
            responseTime,
            isUp,
            error,
            redirected: false
        };
    } catch (err: any) {
        return { url, statusCode: null, responseTime: Date.now() - start, isUp: false, error: err.message, redirected: false };
    }
}

async function checkSslStatus(url: string, config: any): Promise<PageResult> {
    const start = Date.now();
    let hostname = url.replace(/https?:\/\//, '').split('/')[0].split(':')[0];
    const port = config.port || 443;

    return new Promise((resolve) => {
        const socket = tls.connect(port, hostname, { servername: hostname, timeout: 10000 }, () => {
            const cert = socket.getPeerCertificate();
            const responseTime = Date.now() - start;
            if (!cert || !Object.keys(cert).length) {
                resolve({ url, statusCode: null, responseTime, isUp: false, error: 'No certificate found', redirected: false });
            } else {
                const validTo = new Date(cert.valid_to).getTime();
                const now = Date.now();
                const daysRemaining = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));

                if (daysRemaining < 0) {
                    resolve({ url, statusCode: null, responseTime, isUp: false, error: 'Certificate expired', redirected: false });
                } else {
                    resolve({ url, statusCode: 200, responseTime, isUp: true, error: `Expires in ${daysRemaining} days`, redirected: false });
                }
            }
            socket.end();
        });

        socket.on('error', (err) => {
            resolve({ url, statusCode: null, responseTime: Date.now() - start, isUp: false, error: err.message, redirected: false });
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve({ url, statusCode: null, responseTime: Date.now() - start, isUp: false, error: 'Connection timed out', redirected: false });
        });
    });
}

async function checkDnsStatus(url: string, config: any): Promise<PageResult> {
    const start = Date.now();
    const hostname = url.replace(/https?:\/\//, '').split('/')[0].split(':')[0];
    const { recordType = 'A', expectedValue = null } = config;

    try {
        let results: any[] = [];
        if (recordType === 'A') results = await dns.resolve4(hostname);
        else if (recordType === 'AAAA') results = await dns.resolve6(hostname);
        else if (recordType === 'MX') results = await dns.resolveMx(hostname);
        else if (recordType === 'TXT') results = await dns.resolveTxt(hostname);
        else results = await dns.resolve(hostname, recordType);

        const responseTime = Date.now() - start;
        let isUp = results.length > 0;
        let error = isUp ? null : `No ${recordType} records found`;

        if (isUp && expectedValue) {
            const found = JSON.stringify(results).includes(expectedValue);
            if (!found) {
                isUp = false;
                error = `Expected record ${expectedValue} not found in results`;
            }
        }

        return {
            url,
            statusCode: 200,
            responseTime,
            isUp,
            error,
            redirected: false
        };
    } catch (err: any) {
        return { url, statusCode: null, responseTime: Date.now() - start, isUp: false, error: err.message, redirected: false };
    }
}

export async function discoverPages(startUrl: string, maxPages: number = 1000, seedUrls: string[] = []): Promise<string[]> {
    const visited = new Set<string>();
    const queue: string[] = seedUrls.map(u => u.trim());
    const discovered: string[] = [];

    // Normalize the start URL
    let normalizedUrl = startUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
        normalizedUrl = 'https://' + normalizedUrl;
    }

    // Establish domain
    let domain = '';
    try {
        const { url: finalUrlStr, status, html } = await robustFetch(normalizedUrl);
        const finalUrl = new URL(finalUrlStr || normalizedUrl);
        domain = finalUrl.hostname.replace(/^www\./, '');
        normalizedUrl = finalUrl.toString();
    } catch {
        return [normalizedUrl]; // At minimum, return the start URL itself
    }

    if (!queue.includes(normalizedUrl)) {
        queue.push(normalizedUrl);
    }
    console.log(`[discoverPages] Starting BFS for ${normalizedUrl}, domain: ${domain}`);

    const BANNED_EXTENSIONS = [
        '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico',
        '.mp4', '.webm', '.ogg', '.mp3', '.wav',
        '.pdf', '.zip', '.tar', '.gz', '.rar',
        '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
        '.css', '.js', '.json', '.xml', '.txt', '.csv', '.woff', '.woff2', '.ttf', '.eot'
    ];

    while (queue.length > 0 && visited.size < maxPages) {
        const url = queue.shift()!;
        if (visited.has(url)) continue;

        // Skip non-page resources based on extension
        try {
            const parsedUrl = new URL(url);
            const path = parsedUrl.pathname.toLowerCase();
            if (BANNED_EXTENSIONS.some(ext => path.endsWith(ext))) {
                console.log(`[discoverPages] Skipping banned extension: ${url}`);
                continue;
            }
        } catch (e) {
            // ignore invalid urls
        }

        visited.add(url);
        discovered.push(url);

        console.log(`[discoverPages] Processing (${visited.size}/${maxPages}): ${url}`);

        try {
            const { html, status, url: effectiveUrl, error: fetchError } = await robustFetch(url);
            console.log(`[discoverPages] Fetch result for ${url}: status ${status}, html length ${html?.length || 0}`);

            if (status >= 400 || fetchError || !html || html.includes('Database Error') || html.includes('Error establishing a database connection')) {
                console.log(`[discoverPages] Skipping link discovery for ${url} due to error/status or error text: ${fetchError || status}`);
                continue;
            }

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
                } catch (e: any) {
                    console.error(`[discoverPages] Error parsing URL ${href}:`, e.message);
                }
            });
            console.log(`[discoverPages] Discovered ${queue.length} new URLs from ${url}`);
        } catch (e: any) {
            console.error(`[discoverPages] Crawl error for ${url}:`, e.message);
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

    // Step 0: Try to get sitemap URLs first for better discovery
    let sitemapUrls: string[] = [];
    try {
        const { extractSitemapUrls } = await import('./seo/technical');
        sitemapUrls = await extractSitemapUrls(monitor.url);
    } catch (e) {
        console.error('[MonitorUtil] Failed to extract sitemap URLs:', e);
    }

    // Step 1: Discover all pages
    const pages = await discoverPages(monitor.url, maxPages, sitemapUrls);
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

        const config = JSON.parse(monitor.config || '{}');
        const result = await checkSingleUrl(pageUrl, monitor.type, config);
        results.push(result);

        // SEO Analysis — reuse HTML from the uptime check instead of re-fetching
        let seoScore = 0;
        let metaTitle = '';
        let metaDescription = '';

        try {
            const html = result.html || '';
            if (result.isUp && html && html.length > 100) {
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

    const normalize = (u: string) => u.replace(/\/$/, '');
    const mUrl = normalize(monitor.url);
    const isMainDown = downPages.some(r => normalize(r.url) === mUrl);

    await (prisma as any).uptimeMonitor.update({
        where: { id: monitor.id },
        data: {
            status: isMainDown ? 'DOWN' : 'UP',
            crawlProgress: 100,
            lastChecked: new Date(),
            lastStatus: downPages.length > 0 ? (downPages[0].statusCode || 0) : 200,
            lastResponseTime: avgResponseTime,
        },
    });

    // Step 4: Alert
    const alertEmails = monitor.emails.map((e: any) => e.email);
    const issuePages = [...downPages, ...redirectedPages];

    // Identify main site result for slow response check
    const mUrlNorm = normalize(monitor.url);
    const mainResultFound = results.find(r => normalize(r.url) === mUrlNorm);

    // Slow response check for the main site during crawl
    const threshold = monitor.responseTimeThreshold || 5000;
    const isSlow = mainResultFound && mainResultFound.responseTime > threshold;

    if (alertEmails.length > 0) {
        if (issuePages.length > 0) {
            console.log(`[MonitorUtil] Triggering crawl report email for monitor: ${monitor.name} to: ${alertEmails.join(',')}`);
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

        if (isSlow && mainResultFound) {
            console.log(`[MonitorUtil] Slow response detected for ${monitor.name} during crawl: ${mainResultFound.responseTime}ms > ${threshold}ms`);
            await sendDowntimeAlert(
                alertEmails,
                [{
                    name: `${monitor.name} (SLOW)`,
                    url: monitor.url,
                    statusCode: mainResultFound.statusCode,
                    error: `Response time ${mainResultFound.responseTime}ms exceeded threshold of ${threshold}ms during site-wide crawl`,
                    responseTime: mainResultFound.responseTime,
                    checkedAt: new Date()
                }]
            );
        }
    }

    return {
        results: results.map((r, idx) => ({ ...r, seoScore: seoResults[idx]?.seoScore || 0 })),
        summary: { total: results.length, up: upPages.length, down: downPages.length, redirects: redirectedPages.length },
        monitor
    };
}

export async function checkAllMonitorPages(monitorId: string) {
    const monitor = await (prisma as any).uptimeMonitor.findUnique({
        where: { id: monitorId },
        include: { emails: true, pages: { where: { active: true }, take: 1000 } },
    });

    if (!monitor) return null;

    // 1. Check main URL
    const config = JSON.parse(monitor.config || '{}');
    const mainResult = await checkSingleUrl(monitor.url, monitor.type, config);
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

    // 2. Check all discovered subpages (only if main site is UP)
    const pageResults = [];
    if (mainResult.isUp) {
        for (const page of monitor.pages) {
            const pResult = await checkSingleUrl(page.url, monitor.type, config);
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
    } else {
        console.log(`[MonitorUtil] Main site ${monitor.url} is DOWN. Skipping subpage checks to avoid timeouts.`);
    }

    // 3. Update overall status
    const overallIsUp = mainResult.isUp;

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

export async function checkMainUrlOnly(monitorId: string) {
    const monitor = await (prisma as any).uptimeMonitor.findUnique({
        where: { id: monitorId },
        include: { emails: true },
    });

    if (!monitor) return null;

    const config = JSON.parse(monitor.config || '{}');
    const mainResult = await checkSingleUrl(monitor.url, monitor.type, config);

    // Save the check
    await (prisma as any).uptimeCheck.create({
        data: {
            monitorId: monitor.id,
            statusCode: mainResult.statusCode,
            responseTime: mainResult.responseTime,
            isUp: mainResult.isUp,
            error: mainResult.error || (mainResult.redirected ? `Redirected to ${mainResult.finalUrl}` : null),
        },
    });

    // Update monitor overall status
    const threshold = monitor.responseTimeThreshold || 5000;
    const isSlow = mainResult.isUp && mainResult.responseTime > threshold;

    await (prisma as any).uptimeMonitor.update({
        where: { id: monitor.id },
        data: {
            status: mainResult.isUp ? 'UP' : 'DOWN',
            lastChecked: new Date(),
            lastStatus: mainResult.statusCode,
            lastResponseTime: mainResult.responseTime,
        },
    });

    if (isSlow && monitor.emails.length > 0) {
        console.log(`[MonitorUtil] Slow response detected for ${monitor.name}: ${mainResult.responseTime}ms > ${threshold}ms`);
        await sendDowntimeAlert(
            monitor.emails.map((e: any) => e.email),
            [{
                name: `${monitor.name} (SLOW)`,
                url: monitor.url,
                statusCode: mainResult.statusCode,
                error: `Response time ${mainResult.responseTime}ms exceeded threshold of ${threshold}ms`,
                responseTime: mainResult.responseTime,
                checkedAt: new Date()
            }]
        );
    }

    return mainResult;
}
