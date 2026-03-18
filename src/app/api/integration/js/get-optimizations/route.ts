import { NextRequest, NextResponse } from "next/server";

// In-memory store (simulation for demo, in production use Redis or Database)
const jsOptimizations: Record<string, Record<string, any>> = (global as any).jsOptimizations || {};
(global as any).jsOptimizations = jsOptimizations;

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const siteId = searchParams.get("siteId");
    const url = searchParams.get("url");

    if (!siteId || !url) {
        return NextResponse.json({ message: "Missing siteId or url" }, { status: 400 });
    }

    const siteOpts = jsOptimizations[siteId];
    if (siteOpts && siteOpts[url]) {
        return NextResponse.json(siteOpts[url]);
    } else {
        return NextResponse.json({ message: "No optimizations found" }, { status: 404 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { siteId, url, data } = await req.json();
        if (!jsOptimizations[siteId]) jsOptimizations[siteId] = {};
        jsOptimizations[siteId][url] = data;
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
