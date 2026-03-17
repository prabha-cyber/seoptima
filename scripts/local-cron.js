// This script simulates the Vercel Cron locally
// It simply pings the cron endpoint every 15 minutes

const CRON_URL = 'http://localhost:3000/api/cron/crawl';
const CRON_SECRET = process.env.CRON_SECRET || 'seoptima_secure_cron_token_123';
const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

console.log(`[Local Cron] Started. Pinging ${CRON_URL} every 5 minutes...`);

async function runCron() {
    console.log(`\n[Local Cron] [${new Date().toLocaleTimeString()}] Triggering API: ${CRON_URL}...`);
    try {
        const res = await fetch(CRON_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CRON_SECRET}`
            }
        });

        if (res.ok) {
            const data = await res.json();
            console.log(`[Local Cron] Success! Found ${data.processed || 0} monitors, Errors: ${data.errors || 0}`);
            if (data.details && data.details.length > 0) {
                data.details.forEach(res => {
                    console.log(` - Crawled "${res.name}": ${res.summary?.total || 0} pages`);
                });
            }
        } else {
            console.error(`[Local Cron] Failed with status: ${res.status}`);
            const text = await res.text();
            console.error(` Response: ${text.substring(0, 200)}...`);
        }
    } catch (err) {
        console.error(`[Local Cron] Error reaching server: ${err.message}`);
        console.log(`[Local Cron] Is the Next.js server running at http://localhost:3000?`);
    }
}

// Run immediately once
runCron();

// Then run every 15 minutes
setInterval(runCron, INTERVAL_MS);
