import { prisma } from '../prisma';

export async function checkRankChanges(keywordId: string, websiteId: string, oldRank: number, newRank: number) {
    const threshold = 5; // Alert if rank changes by more than 5 positions
    const change = oldRank - newRank; // Positive means rank improved (e.g. 10 -> 5)

    if (Math.abs(change) >= threshold) {
        const keyword = await prisma.keyword.findUnique({
            where: { id: keywordId },
        });

        if (!keyword) return;

        const message = change > 0
            ? `Ranking improved! "${keyword.term}" moved from ${oldRank} to ${newRank}.`
            : `Ranking dropped! "${keyword.term}" moved from ${oldRank} to ${newRank}.`;

        const type = change > 0 ? 'SUCCESS' : 'WARNING';

        // Create a notification for the user
        const website = await prisma.website.findUnique({
            where: { id: websiteId },
            select: { userId: true },
        });

        if (website) {
            await prisma.notification.create({
                data: {
                    userId: website.userId,
                    title: 'Keyword Rank Change',
                    message: message,
                    type: type as any, // Cast to match Prisma enum if necessary
                    read: false,
                },
            });
        }
    }
}
