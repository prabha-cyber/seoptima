// This script simulates the Vercel Cron locally
// It simply pings the cron endpoint every 15 minutes

const CRON_URL = 'http://localhost:3000/api/cron/crawl';
const CRON_SECRET = process.env.CRON_SECRET || 'seoptima_secure_cron_token_123';
const INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

console.log(`[Local Cron] Started. Pinging ${CRON_URL} every 5 minutes...`);

async function runCron() {
    console.log(`\n[Local Cron] Triggering API at ${new Date().toLocaleTimeString()}...`);
    try {
        const res = await fetch(CRON_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${CRON_SECRET}`
            }
        });

        if (res.ok) {
            const data = await res.json();
            console.log(`[Local Cron] Success:`, data.message);
        } else {
            console.error(`[Local Cron] Failed with status: ${res.status}`);
            const text = await res.text();
            console.error(text);
        }
    } catch (err) {
        console.error(`[Local Cron] Error reaching server. Is Next.js running?`, err.message);
    }
}

// Run immediately once
runCron();

// Then run every 15 minutes
setInterval(runCron, INTERVAL_MS);
