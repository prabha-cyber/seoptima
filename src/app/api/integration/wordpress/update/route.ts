import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import crypto from "crypto";

// Helper to solve ByetHost/InfinityFree security wall
const solveSecurityWall = (html: string): string | null => {
    try {
        const matches = html.match(/toNumbers\("([a-f0-9]+)"\)/g);
        if (!matches || matches.length < 3) return null;

        const hexValues = matches.map((m) => m.match(/"([a-f0-9]+)"/)?.[1] || "");
        const ct = Buffer.from(hexValues[0], "hex");
        const key = Buffer.from(hexValues[1], "hex");
        const iv = Buffer.from(hexValues[2], "hex");

        const decipher = crypto.createDecipheriv("aes-128-cbc", key, iv);
        decipher.setAutoPadding(false);
        let decrypted = decipher.update(ct);
        decrypted = Buffer.concat([decrypted, decipher.final()]);

        return decrypted.toString("hex");
    } catch (e) {
        console.error("Failed to solve security wall", e);
        return null;
    }
};

export async function POST(req: NextRequest) {
    try {
        const { url, username, appPassword, postId, postType, data, cookie } =
            await req.json();
        const auth = Buffer.from(`${username}:${appPassword}`).toString("base64");
        const baseUrl = url.replace(/\/$/, "");

        // Determine endpoint based on postType
        const endpoint = postType === "page" ? "pages" : "posts";

        const getHeaders = (cookieValue?: string) => {
            const headers: any = {
                Authorization: `Basic ${auth}`,
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                Accept: "application/json, text/plain, */*",
                Referer: baseUrl + "/",
            };

            let cookieStr = "TestCookie=1";
            if (cookieValue) {
                const val = cookieValue.includes("=") ? cookieValue : `__test=${cookieValue}`;
                cookieStr = `${val}; TestCookie=1`;
            }
            headers["Cookie"] = cookieStr;

            return headers;
        };

        let currentCookie = cookie;
        let response = await axios.post(
            `${baseUrl}/wp-json/wp/v2/${endpoint}/${postId}`,
            data,
            {
                headers: getHeaders(currentCookie),
                timeout: 15000,
                validateStatus: () => true,
            }
        );

        // If we hit the wall, try to solve it automatically
        if (typeof response.data === "string" && response.data.includes("aes.js")) {
            const solvedCookie = solveSecurityWall(response.data);
            if (solvedCookie) {
                currentCookie = solvedCookie;
                response = await axios.post(
                    `${baseUrl}/wp-json/wp/v2/${endpoint}/${postId}`,
                    data,
                    {
                        headers: getHeaders(currentCookie),
                        timeout: 15000,
                        validateStatus: () => true,
                    }
                );
            }
        }

        if (response.status >= 200 && response.status < 300) {
            return NextResponse.json(response.data);
        }

        // Try plain permalinks fallback
        let fallbackResponse = await axios.post(
            `${baseUrl}/index.php?rest_route=/wp/v2/${endpoint}/${postId}`,
            data,
            {
                headers: getHeaders(currentCookie),
                timeout: 15000,
                validateStatus: () => true,
            }
        );

        if (
            typeof fallbackResponse.data === "string" &&
            fallbackResponse.data.includes("aes.js")
        ) {
            const solvedCookie = solveSecurityWall(fallbackResponse.data);
            if (solvedCookie) {
                currentCookie = solvedCookie;
                fallbackResponse = await axios.post(
                    `${baseUrl}/index.php?rest_route=/wp/v2/${endpoint}/${postId}`,
                    data,
                    {
                        headers: getHeaders(currentCookie),
                        timeout: 15000,
                        validateStatus: () => true,
                    }
                );
            }
        }

        if (fallbackResponse.status >= 200 && fallbackResponse.status < 300) {
            return NextResponse.json(fallbackResponse.data);
        }

        return NextResponse.json(
            {
                message: `WordPress returned status ${response.status}`,
                data: response.data,
            },
            { status: response.status || 500 }
        );
    } catch (error: any) {
        return NextResponse.json(
            {
                message: error.message,
                data: error.response?.data,
            },
            { status: error.response?.status || 500 }
        );
    }
}
