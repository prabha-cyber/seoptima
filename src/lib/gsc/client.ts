import { google } from 'googleapis';

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXT_PUBLIC_APP_URL}/api/gsc/callback`
);

export const searchConsole = google.searchconsole('v1');

export function getAuthUrl() {
    const scopes = [
        'https://www.googleapis.com/auth/webmasters.readonly',
        'https://www.googleapis.com/auth/webmasters',
    ];

    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent',
    });
}

export async function getTokens(code: string) {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
}

export function setCredentials(tokens: any) {
    oauth2Client.setCredentials(tokens);
}

export default oauth2Client;
