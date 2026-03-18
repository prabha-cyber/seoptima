import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
    try {
        const { url, bridgeSecret, action, postId, data } = await req.json();
        const baseUrl = url.replace(/\/$/, "");

        if (action === "posts") {
            const response = await axios.get(`${baseUrl}/seo-bridge.php`, {
                params: {
                    secret: bridgeSecret,
                    action: "posts",
                },
                timeout: 15000,
            });
            return NextResponse.json(response.data);
        } else if (action === "update") {
            const response = await axios.post(`${baseUrl}/seo-bridge.php`, data, {
                params: {
                    secret: bridgeSecret,
                    action: "update",
                    id: postId,
                },
                timeout: 15000,
            });
            return NextResponse.json(response.data);
        }

        return NextResponse.json({ message: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json(
            {
                message: `Bridge Error: ${error.message}`,
                data: error.response?.data,
            },
            { status: error.response?.status || 500 }
        );
    }
}
