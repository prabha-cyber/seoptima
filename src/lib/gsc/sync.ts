import { google } from 'googleapis';
import oauth2Client, { setCredentials } from './client';
import { prisma } from '../prisma';

export async function getGscData(userId: string, siteUrl: string, startDate: string, endDate: string) {
    const gscToken = await prisma.gscToken.findUnique({
        where: { userId },
    });

    if (!gscToken) {
        throw new Error('GSC token not found for user');
    }

    setCredentials({
        access_token: gscToken.accessToken,
        refresh_token: gscToken.refreshToken,
        expiry_date: Number(gscToken.expiryDate),
    });

    const searchConsole = google.searchconsole('v1');

    const response = await searchConsole.searchanalytics.query({
        siteUrl,
        requestBody: {
            startDate,
            endDate,
            dimensions: ['query', 'page'],
            rowLimit: 1000,
        },
        auth: oauth2Client,
    });

    return response.data.rows || [];
}
