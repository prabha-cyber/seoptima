import * as cheerio from 'cheerio';
import robotsParser from 'robots-parser';

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
            const res = await fetch(robotsUrl);
            if (res.ok) {
                const text = await res.text();
                this.robots = robotsParser(robotsUrl, text);
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
            const initialRes = await fetch(normalizedUrl, {
                headers: { 'User-Agent': 'AntigravityCrawler/1.0' },
                redirect: 'follow',
                next: { revalidate: 0 }
            });

            const finalUrl = new URL(initialRes.url);
            this.domain = finalUrl.hostname.replace(/^www\./, '');
            normalizedUrl = initialRes.url;

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
                console.log(`Crawling: ${url}`);

                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'AntigravityCrawler/1.0 (SEO Audit Tool)'
                    },
                    redirect: 'follow',
                    next: { revalidate: 0 }
                });

                if (!response.ok) {
                    results[url] = { url, html: '', status: response.status };
                    continue;
                }

                const effectiveUrl = response.url;
                const html = await response.text();
                results[url] = { url: effectiveUrl, html, status: response.status };

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

        return results;
    }
}
