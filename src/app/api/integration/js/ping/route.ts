import { NextRequest, NextResponse } from "next/server";

// In-memory store (simulation for demo, in production use Redis or Database)
const activeJsSites: Record<string, any> = (global as any).activeJsSites || {};
(global as any).activeJsSites = activeJsSites;

export async function POST(req: NextRequest) {
    try {
        const { siteId, url, title, description } = await req.json();
        activeJsSites[siteId] = { url, title, description, lastSeen: Date.now() };
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
