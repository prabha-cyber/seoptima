import { EXHAUSTIVE_CHECKS } from './checks';

export interface ScoringParams {
    url: string;
    html: string;
    technical: any;
    performance: any;
    robots?: any;
    sitemap?: any;
    indexStatus?: any;
    brokenLinksCount?: number;
    structuredData?: any[];
    assets?: any;
    custom404?: any;
}

export function calculateSeoResults(params: ScoringParams) {
    const {
        url,
        html,
        technical,
        performance,
        robots = { exists: false },
        sitemap = { exists: false },
        indexStatus = { indexed: true },
        brokenLinksCount = 0,
        structuredData = [],
        assets = { isOptimized: true },
        custom404 = { isCustom: true }
    } = params;

    const perfScore = performance.performanceScore || 0;

    const results: Record<string, string> = {
        // Indexing & Authority
        google_index: indexStatus.indexed ? 'pass' : (robots.exists ? 'warning' : 'critical'),
        analytics: technical.hasAnalytics ? 'pass' : 'warning',
        speed: perfScore > 85 ? 'pass' : (perfScore > 50 ? 'warning' : 'critical'),
        robots: robots.exists ? 'pass' : 'critical',
        sitemap: sitemap.exists ? 'pass' : 'critical',
        friendly_url: technical.isFriendlyUrl ? 'pass' : 'warning',
        broken_links: brokenLinksCount === 0 ? 'pass' : 'critical',

        // Content Quality
        meta_desc: technical.metaDescription
            ? (technical.metaDescription.length > 50 && technical.metaDescription.length < 160 ? 'pass' : 'warning')
            : 'critical',
        meta_title: technical.title
            ? (technical.title.length > 30 && technical.title.length < 65 ? 'pass' : 'warning')
            : 'critical',
        keywords: technical.wordCount > 500 ? 'pass' : (technical.wordCount > 200 ? 'warning' : 'critical'),
        duplicate: technical.hasDuplicateTitle ? 'critical' : 'pass',
        canonical: technical.canonical ? 'pass' : 'warning',
        h1_tags: technical.h1Count === 1 ? 'pass' : (technical.h1Count === 0 ? 'critical' : 'warning'),
        h2_tags: technical.h2Count > 2 ? 'pass' : 'warning',

        // Media Optimization
        alt_tags: technical.totalImages === 0 ? 'pass' : (technical.imagesWithoutAlt === 0 ? 'pass' : 'warning'),
        responsive_img: technical.totalImages === 0 ? 'pass' : (technical.responsiveImages / technical.totalImages > 0.8 ? 'pass' : 'warning'),
        modern_img: technical.totalImages === 0 ? 'pass' : (technical.modernFormatImages / technical.totalImages > 0.5 ? 'pass' : 'warning'),
        img_alt_check: technical.totalImages > 0 && technical.imagesWithoutAlt === 0 ? 'pass' : (technical.totalImages > 0 ? 'warning' : 'info'),

        // Technical & Code
        inline_css: technical.inlineCssCount < 5 ? 'pass' : (technical.inlineCssCount < 20 ? 'warning' : 'critical'),
        deprecated_html: technical.deprecatedTagsCount === 0 ? 'pass' : 'critical',
        css_minification: html.includes('.min.css') || html.length < 10000 ? 'pass' : 'info',
        html_size: (technical.htmlSize / 1024) < 100 ? 'pass' : (technical.htmlSize / 1024 < 300 ? 'warning' : 'critical'),

        // Core Web Vitals (Performance Details)
        lcp: performance.largestContentfulPaint && performance.largestContentfulPaint !== 'N/A' && performance.largestContentfulPaint !== '0' ? 'pass' : 'warning',
        cls: performance.cumulativeLayoutShift && performance.cumulativeLayoutShift !== 'N/A' && performance.cumulativeLayoutShift !== '0' ? 'pass' : 'warning',
        img_caching: assets.isOptimized ? 'pass' : 'warning',
        js_caching: assets.isOptimized ? 'pass' : 'warning',
        css_caching: assets.isOptimized ? 'pass' : 'warning',

        // Structure & Others
        error_404: custom404.isCustom ? 'pass' : 'warning',
        nofollow: technical.externalLinkCount > 0
            ? (technical.noFollowExternalCount > 0 ? 'pass' : 'warning')
            : 'pass',
        favicon: technical.hasFavicon ? 'pass' : 'warning',

        // Logic for common checks like title length etc.
        canonical_check: technical.canonical ? 'pass' : 'warning',
        structured_data: structuredData && structuredData.length > 0 ? 'pass' : 'warning',
    };

    // Ensure all exhaustive checks have a value, even if default
    EXHAUSTIVE_CHECKS.forEach(check => {
        if (!results[check.id]) {
            results[check.id] = 'pass'; // Default fallback
        }
    });

    return results;
}

export function calculateOverallScore(results: Record<string, string>) {
    const relevantCheckIds = EXHAUSTIVE_CHECKS.map(c => c.id);
    const statuses = relevantCheckIds.map(id => (results[id] || 'pending').toLowerCase());

    const passCount = statuses.filter(s => s === 'pass').length;
    const criticalCount = statuses.filter(s => s === 'critical').length;
    const warningCount = statuses.filter(s => s === 'warning').length;

    const score = Math.round((passCount / relevantCheckIds.length) * 100);

    return {
        score,
        passCount,
        criticalCount,
        warningCount,
        totalChecks: relevantCheckIds.length
    };
}
