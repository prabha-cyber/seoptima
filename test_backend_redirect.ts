import { Buffer } from 'node:buffer';
if (!global.File) {
    (global as any).File = (Buffer as any).File || class File extends Blob {
        name: string;
        lastModified: number;
        constructor(chunks: any[], name: string, options?: any) {
            super(chunks, options);
            this.name = name;
            this.lastModified = options?.lastModified || Date.now();
        }
    };
}

import { prisma } from './src/lib/prisma';
import { checkAllMonitorPages } from './src/lib/monitor';

async function testRedirect() {
    const user = await prisma.user.findFirst();
    if (!user) {
        console.error("No user found");
        return;
    }

    // Create a temporary monitor for google.com (which we know redirects)
    const monitor = await prisma.uptimeMonitor.create({
        data: {
            userId: user.id,
            name: "Test Redirect Check",
            url: "http://google.com",
            interval: 5,
        }
    });

    console.log("Created monitor:", monitor.id);

    try {
        const result = await checkAllMonitorPages(monitor.id);
        console.log("Check result:", JSON.stringify(result, null, 2));

        const notifications = await prisma.notification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            take: 2
        });
        console.log("Recent notifications:", JSON.stringify(notifications, null, 2));
    } finally {
        await prisma.uptimeMonitor.delete({ where: { id: monitor.id } });
        console.log("Test monitor cleaned up");
    }
}

testRedirect().catch(console.error);
