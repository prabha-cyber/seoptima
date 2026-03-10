import * as jsonld from 'jsonld';
import * as htmlparser2 from 'htmlparser2';
import * as domutils from 'domutils';

export async function extractStructuredData(html: string) {
    const dom = htmlparser2.parseDocument(html);

    // 1. JSON-LD extraction
    const scripts = domutils.findAll(
        (ele) => ele.name === 'script' && ele.attribs.type === 'application/ld+json',
        dom.children
    );

    const results: any[] = [];

    scripts.forEach((element) => {
        try {
            const content = domutils.textContent(element);
            if (content) {
                const data = JSON.parse(content);
                if (Array.isArray(data)) {
                    results.push(...data);
                } else {
                    results.push(data);
                }
            }
        } catch (error) {
            console.error('JSON-LD Parse Error:', error);
        }
    });

    // 2. Simple Microdata detection (Itemscope)
    const microdataNodes = domutils.findAll((ele) => !!ele.attribs.itemscope, dom.children);
    microdataNodes.forEach(node => {
        results.push({
            '@type': node.attribs.itemtype || 'Microdata',
            'isMicrodata': true
        });
    });

    return results;
}

export async function validateStructuredData(data: any) {
    try {
        // Dynamic import for jsonld if needed, but for now we try standard
        const expanded = await jsonld.expand(data);
        return { valid: true, expanded };
    } catch (error) {
        return { valid: false, error: (error as Error).message };
    }
}
