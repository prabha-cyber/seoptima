import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import { Crawler } from './crawler';
import { prisma } from '@/lib/prisma';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface GeneratedSchemaResult {
    pageType: string;
    schemaType: string;
    jsonLd: any;
    optimizedFor: string[];
}

export class AISchemaService {
    private crawler: Crawler;

    constructor(maxPages: number = 20) {
        this.crawler = new Crawler(maxPages);
    }

    async generateSchemasForUrl(url: string, userId: string, websiteId?: string) {
        console.log(`[AISchemaService] Starting generation for ${url} (User: ${userId})`);

        // 1. Crawl the URL
        const crawlResults = await this.crawler.crawl(url);
        const results = [];

        // 2. Process each page
        for (const [pageUrl, result] of Object.entries(crawlResults)) {
            if (result.status === 200 && result.html) {
                try {
                    console.log(`[AISchemaService] Generating schema for ${pageUrl}`);
                    const schemaData = await this.generateSchemaForPage(pageUrl, result.html);

                    // 3. Save to database
                    const savedSchema = await prisma.aiSchema.create({
                        data: {
                            url: pageUrl,
                            websiteId: websiteId || null,
                            pageType: schemaData.pageType,
                            schemaType: schemaData.schemaType,
                            generatedSchema: schemaData.jsonLd as any,
                            optimizedFor: schemaData.optimizedFor || ["SEO", "AEO", "GEO", "SXO"],
                            status: "GENERATED"
                        }
                    });

                    results.push(savedSchema);
                } catch (error) {
                    console.error(`[AISchemaService] Error generating schema for ${pageUrl}:`, error);
                }
            }
        }

        return results;
    }

    private async generateSchemaForPage(url: string, html: string): Promise<GeneratedSchemaResult> {
        const $ = cheerio.load(html);

        // --- DEEP EXTRACTION FOR REAL-TIME DATA ---
        const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled Page';
        const description = $('meta[name="description"]').attr('content') ||
            $('meta[property="og:description"]').attr('content') || '';
        const h1 = $('h1').first().text().trim();
        const mainContent = $('main').text().trim().substring(0, 4000) ||
            $('.content').text().trim().substring(0, 4000) ||
            $('body').text().trim().substring(0, 4000);

        // 1. Extract FAQs from HTML patterns (details/summary or Q&A containers)
        const extractedFaqs: any[] = [];
        $('details').each((_, el) => {
            const q = $(el).find('summary').text().trim();
            const a = $(el).text().replace(q, '').trim();
            if (q && a) extractedFaqs.push({ name: q, acceptedAnswer: { text: a } });
        });
        if (extractedFaqs.length < 2) {
            // Fallback to common FAQ patterns (e.g., h3 followed by p)
            $('h2, h3').each((_, el) => {
                const text = $(el).text().trim();
                if (text.includes('?') || text.toLowerCase().includes('faq')) {
                    const next = $(el).next('p, div').text().trim();
                    if (next) extractedFaqs.push({ name: text, acceptedAnswer: { text: next } });
                }
            });
        }

        // 2. Extract Prices and Currency
        const priceMatch = html.match(/([\$\€\£])\s?(\d+([.,]\d{1,2})?)/);
        const extractedPrice = priceMatch ? priceMatch[2] : "29";
        const extractedCurrency = priceMatch ? (priceMatch[1] === '$' ? 'USD' : priceMatch[1] === '€' ? 'EUR' : 'GBP') : 'USD';

        // 3. Extract Organization Info
        const domain = new URL(url).hostname;
        const orgName = title.split('|')[0].split('-')[0].trim() || domain;
        const logo = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href') || '/logo.png';
        const absoluteLogo = logo.startsWith('http') ? logo : `${new URL(url).origin}${logo.startsWith('/') ? '' : '/'}${logo}`;

        // 4. Extract Location Signals
        const address = $('address').text().trim() ||
            $('[class*="address"], [class*="location"]').text().trim();
        const extractedLocation = address.substring(0, 200).replace(/\s+/g, ' ') || "Global";

        const prompt = `
            Analyze the following page content and generate a highly optimized JSON-LD schema using a @graph structure.
            URL: ${url}
            Title: ${title}
            Description: ${description}
            H1: ${h1}
            Content Snippet: ${mainContent}
            Extracted Signal: ${extractedPrice ? `Price: ${extractedPrice}` : 'No price'} | Location: ${extractedLocation} | FAQs Found: ${extractedFaqs.length}

            Instructions:
            1. Use the "@graph" structure to combine multiple schema types into one script.
            2. For each entity in the graph, provide a unique "@id" using the page URL with a fragment (e.g., "${url}#organization", "${url}#website").
            3. REQUIRED ENTITIES in the @graph:
               - Organization: name, url, logo, description, sameAs (socials), contactPoint.
               - WebSite: url, name, publisher (link to #organization).
               - Service: name (SEO optimized), provider (link to #organization), description (AEO optimized), areaServed.
               - Product: name, image, description, brand, offers (price, currency, availability), aggregateRating (if applicable).
               - Review: itemReviewed (link to #product), author, reviewRating, reviewBody (Generate a relevant high-quality sample review if not found in content).
               - FAQPage: Use the provided FAQs if found, otherwise generate 4 high-intent Questions and SEO-optimized Answers related to this specific page's content.
               - BreadcrumbList: Generate a logical breadcrumb based on the URL structure.
            4. Optimization Layer:
               - SEO: Use high-search volume keywords naturally.
               - AEO: FAQ answers must be persuasive and include soft promotion of the brand/website.
               - GEO: Include location signals (e.g., ${extractedLocation}) in Service and Organization schemas.
               - SXO: Use ratings and reviews to build trust and improve click-through rates.
            5. Return ONLY a JSON object with this structure:
               { "pageType": "...", "schemaType": "Graph", "jsonLd": { "@context": "https://schema.org", "@graph": [...] }, "optimizedFor": ["SEO", "AEO", "GEO", "SXO"] }
        `;

        if (process.env.OPENAI_API_KEY) {
            const completion = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    { role: 'system', content: 'You are an expert SEO and Structured Data specialist. Output only valid JSON.' },
                    { role: 'user', content: prompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.2
            });

            const rawContent = completion.choices[0]?.message?.content || '{}';
            const result = JSON.parse(rawContent);
            return result as GeneratedSchemaResult;
        } else {
            // REAL-TIME DATA FALLBACK (When AI is disabled)
            return {
                pageType: url === new URL(url).origin + '/' ? "HOMEPAGE" : "PAGE",
                schemaType: "Graph",
                jsonLd: {
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "Organization",
                            "@id": `${url}#organization`,
                            "name": orgName,
                            "url": new URL(url).origin,
                            "logo": absoluteLogo,
                            "description": description || `Providing top-tier services at ${domain}.`,
                            "areaServed": { "@type": "Place", "name": extractedLocation }
                        },
                        {
                            "@type": "WebSite",
                            "@id": `${url}#website`,
                            "url": url,
                            "name": orgName,
                            "publisher": { "@id": `${url}#organization` }
                        },
                        {
                            "@type": "Service",
                            "@id": `${url}#service`,
                            "name": h1 || title,
                            "provider": { "@id": `${url}#organization` },
                            "description": description || "Premium SEO and digital solutions.",
                            "areaServed": { "@type": "Place", "name": extractedLocation }
                        },
                        {
                            "@type": "FAQPage",
                            "@id": `${url}#faq`,
                            "mainEntity": extractedFaqs.length > 0 ? extractedFaqs.slice(0, 4) : [
                                {
                                    "@type": "Question",
                                    "name": `What services does ${orgName} provide?`,
                                    "acceptedAnswer": { "@type": "Answer", "text": `${orgName} offers specialized solutions including SEO analysis, technical audits, and performance optimization.` }
                                }
                            ]
                        }
                    ]
                },
                optimizedFor: ["SEO"]
            };
        }
    }

    async getSchemasByWebsiteId(websiteId: string) {
        return prisma.aiSchema.findMany({
            where: { websiteId },
            orderBy: { updatedAt: 'desc' }
        });
    }

    async updateSchema(id: string, data: Partial<{ status: string; generatedSchema: any }>) {
        return prisma.aiSchema.update({
            where: { id },
            data
        });
    }
}
