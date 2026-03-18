import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    try {
        const { action, title, content, keywords, url } = await req.json();
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json(
                { error: "Gemini API key not configured" },
                { status: 500 }
            );
        }

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        let prompt = "";
        if (action === "keywords") {
            prompt = `Analyze this website URL: ${url}. 
      Suggest 10 high-performing SEO keywords that would help this site rank better on Google.
      Return ONLY a JSON array of strings. Do not include markdown formatting.`;
        } else if (action === "optimize") {
            prompt = `You are a professional SEO expert. 
      Optimize the following content for these keywords: ${keywords.join(
                ", "
            )}.
      
      Current Title: ${title}
      Current Content Summary: ${content.substring(0, 1000)}...
      
      Suggest a new SEO-optimized Title and a Meta Description (max 160 chars).
      Return ONLY a JSON object with "title" and "description" fields. Do not include markdown formatting.`;
        } else {
            return NextResponse.json({ error: "Invalid action" }, { status: 400 });
        }

        const response = await fetch(apiUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt,
                            },
                        ],
                    },
                ],
            }),
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.error?.message || "Failed to call Gemini API");
        }

        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
        const cleanText = text.replace(/```json|```/g, "").trim();

        try {
            return NextResponse.json(JSON.parse(cleanText));
        } catch (e) {
            // Fallback if parsing fails
            const jsonStr = cleanText.match(/\[.*\]|\{.*\}/s)?.[0] || cleanText;
            return NextResponse.json(JSON.parse(jsonStr));
        }
    } catch (error: any) {
        console.error("Gemini Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
