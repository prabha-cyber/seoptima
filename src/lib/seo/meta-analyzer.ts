import * as cheerio from 'cheerio';
import { Crawler } from './crawler';

export interface MetaData {
    url: string;
    title: string;
    description: string;
    h1: string;
    status: number;
}

export class MetaAnalyzer {
    private crawler: Crawler;

    constructor(maxPages: number = 50) {
        this.crawler = new Crawler(maxPages);
    }

    async analyze(url: string): Promise<MetaData[]> {
        const crawlResults = await this.crawler.crawl(url);
        const analyzedData: MetaData[] = [];

        for (const [pageUrl, result] of Object.entries(crawlResults)) {
            if (result.status === 200 && result.html) {
                const $ = cheerio.load(result.html);

                const title = $('title').text().trim() || '';
                const description = $('meta[name="description"]').attr('content')?.trim() || '';
                const h1 = $('h1').first().text().trim() || '';

                analyzedData.push({
                    url: pageUrl,
                    title,
                    description,
                    h1,
                    status: result.status
                });
            } else {
                analyzedData.push({
                    url: pageUrl,
                    title: '',
                    description: '',
                    h1: '',
                    status: result.status
                });
            }
        }

        return analyzedData;
    }
}
