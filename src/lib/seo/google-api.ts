import axios from 'axios';

export async function getSearchConsoleData(url: string) {
    const SEARCH_CONSOLE_API_KEY = process.env.GOOGLE_SEARCH_CONSOLE_API_KEY;
    const CUSTOM_SEARCH_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;

    if (!SEARCH_CONSOLE_API_KEY) return null;

    try {
        // Note: Real GSC API requires OAuth2, but for "real time accuracy" 
        // we might use index inspection or other public endpoints if available
        // or a mock for this demo if we don't have full OAuth setup.
        // However, the user provided an API key (likely a Custom Search/Google Cloud key)

        // Custom Search can be used to check indexing status
        const response = await axios.get(`https://www.googleapis.com/customsearch/v1`, {
            params: {
                key: CUSTOM_SEARCH_API_KEY,
                cx: 'partner-pub-0000000000000000:00000000000', // Mock CX or need real one
                q: `site:${url}`
            }
        });

        return response.data;
    } catch (error) {
        console.error('GSC Data Error:', error);
        return null;
    }
}

export async function checkIndexStatus(url: string) {
    const CUSTOM_SEARCH_API_KEY = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
    if (!CUSTOM_SEARCH_API_KEY) return { indexed: false };

    try {
        const response = await axios.get(`https://www.googleapis.com/customsearch/v1`, {
            params: {
                key: CUSTOM_SEARCH_API_KEY,
                q: `info:${url}`
            }
        });

        const isIndexed = response.data.items && response.data.items.length > 0;
        return { indexed: isIndexed, raw: response.data };
    } catch (error) {
        console.error('Index Check Error:', error);
        return { indexed: false, error: 'Could not verify indexing' };
    }
}

export async function calculateAuthorityScoring(url: string, indexStatus: any) {
    let domainAuthority = 15;
    let spamScore = 5;

    if (indexStatus.indexed) {
        domainAuthority += 25;
        if (indexStatus.raw?.searchInformation?.totalResults > 1000) {
            domainAuthority += 30;
        } else if (indexStatus.raw?.searchInformation?.totalResults > 100) {
            domainAuthority += 15;
        }
    } else {
        spamScore += 20;
    }

    const hostname = new URL(url).hostname;
    if (hostname.length < 15) domainAuthority += 10;

    if (hostname.endsWith('.com') || hostname.endsWith('.org') || hostname.endsWith('.edu')) {
        domainAuthority += 10;
    } else if (hostname.endsWith('.xyz') || hostname.endsWith('.top') || hostname.endsWith('.work')) {
        spamScore += 15;
    }

    const spamKeywords = ['cheap', 'free', 'buy', 'pill', 'casino', 'money'];
    if (spamKeywords.some(word => hostname.toLowerCase().includes(word))) {
        spamScore += 30;
    }

    return {
        domainAuthority: Math.min(domainAuthority, 100),
        spamScore: Math.min(spamScore, 100)
    };
}
