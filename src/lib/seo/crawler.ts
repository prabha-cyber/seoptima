import * as cheerio from 'cheerio';
import robotsParser from 'robots-parser';
import { robustFetch } from './fetch';

export interface CrawlResult {
    url: string;
    html: string;
    status: number;
}

export class Crawler {
    private visited: Set<string> = new Set();
    private queue: string[] = [];
    private maxPages: number;
    private domain: string = '';
    private robots: any = null;

    constructor(maxPages: number = 1000) {
        this.maxPages = maxPages;
    }

    private async fetchRobots(baseUrl: string) {
        try {
            const robotsUrl = new URL('/robots.txt', baseUrl).toString();
            const { html, status } = await robustFetch(robotsUrl);
            if (status === 200 && html) {
                this.robots = robotsParser(robotsUrl, html);
            }
        } catch (e) {
            console.error('Failed to fetch robots.txt', e);
        }
    }

    private isAllowed(url: string): boolean {
        if (!this.robots) return true;
        return this.robots.isAllowed(url, 'AntigravityCrawler');
    }

    async crawl(startUrl: string): Promise<Record<string, CrawlResult>> {
        const results: Record<string, CrawlResult> = {};

        let normalizedUrl = startUrl.trim();
        if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
            normalizedUrl = `https://${normalizedUrl}`;
        }

        // Establish base domain by following initial redirect
        try {
            console.log(`[Crawler] Initial fetch for ${normalizedUrl}`);
            const { url: finalUrlStr, status, html, error: fetchError } = await robustFetch(normalizedUrl);
            console.log(`[Crawler] Initial fetch status: ${status}, Html length: ${html?.length}`);

            if (fetchError || (status >= 400 || status === 0) && (!html || html.length < 100 || html.includes('Just a moment') || html.includes('cf-challenge'))) {
                throw new Error(fetchError || `Initial fetch failed with status ${status}`);
            }

            const finalUrl = new URL(finalUrlStr || normalizedUrl);
            this.domain = finalUrl.hostname.replace(/^www\./, '');
            normalizedUrl = finalUrl.toString();

            console.log(`Base domain established: ${this.domain} from ${normalizedUrl}`);
        } catch (e) {
            console.error('Initial connection failed:', normalizedUrl);
            return {};
        }

        this.queue.push(normalizedUrl);
        await this.fetchRobots(normalizedUrl);

        while (this.queue.length > 0 && this.visited.size < this.maxPages) {
            const url = this.queue.shift()!;
            if (this.visited.has(url)) continue;

            if (!this.isAllowed(url)) {
                console.log(`Blocked by robots.txt: ${url}`);
                continue;
            }

            try {
                this.visited.add(url);
                console.log(`[Crawler] Processing queue item: ${url}`);

                const { html, status, url: effectiveUrl, error: fetchError } = await robustFetch(url);
                console.log(`[Crawler] Queue item fetch result: ${url} -> status ${status}, html length ${html?.length}`);

                if (fetchError || (status >= 400 || status === 0) && (!html || html.length < 100 || html.includes('Just a moment') || html.includes('cf-challenge'))) {
                    console.error(`[Crawler] Block or failure detected for ${url}: ${fetchError || status}`);
                    results[url] = { url, html: '', status: status || 0 };
                    continue;
                }

                results[url] = { url: effectiveUrl, html, status };

                const $ = cheerio.load(html);
                $('a[href]').each((_, el) => {
                    const href = $(el).attr('href');
                    if (!href) return;

                    try {
                        const absoluteUrl = new URL(href, effectiveUrl);
                        const cleanUrl = `${absoluteUrl.protocol}//${absoluteUrl.host}${absoluteUrl.pathname}`;

                        const targetHost = absoluteUrl.hostname.replace(/^www\./, '');

                        if (targetHost === this.domain && !this.visited.has(cleanUrl)) {
                            this.queue.push(cleanUrl);
                        }
                    } catch (e) {
                        // Invalid URL
                    }
                });
            } catch (error) {
                console.error(`Error crawling ${url}:`, error);
                results[url] = { url, html: '', status: 500 };
            }
        }

        console.log(`[Crawler] Finished. Crawled ${Object.keys(results).length} pages.`);
        return results || {};
    }
}
