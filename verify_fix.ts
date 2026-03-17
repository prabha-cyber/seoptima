import { PrismaClient } from '@prisma/client';
// Polyfill for File class in Node.js 18
if (typeof (global as any).File === 'undefined') {
    const { File } = require('node:buffer');
    if (File) { (global as any).File = File; }
}

import { checkMainUrlOnly } from './src/lib/monitor';

const prisma = new PrismaClient();

async function main() {
    console.log('--- MANUAL CLEANUP ---');

    // 1. Reset stuck monitors
    const result = await (prisma as any).uptimeMonitor.updateMany({
        where: { status: 'CRAWLING' },
        data: { status: 'UNKNOWN', crawlProgress: 0 }
    });
    console.log(`Reset ${result.count} stuck monitors.`);

    // 2. Trigger pings for active monitors to get fresh status
    const monitors = await (prisma as any).uptimeMonitor.findMany({ where: { active: true } });
    for (const m of monitors) {
        console.log(`Pinging ${m.name} (${m.url})...`);
        await checkMainUrlOnly(m.id);
    }

    console.log('Cleanup and check complete.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
