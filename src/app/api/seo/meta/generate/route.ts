import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { pages } = await req.json();
        if (!pages || !Array.isArray(pages)) {
            return NextResponse.json({ error: 'Pages array is required' }, { status: 400 });
        }

        // Check AI credits
        const credits = await prisma.aiCredit.findUnique({
            where: { userId: session.user.id },
        });

        if (!credits || credits.used + pages.length > credits.total) {
            return NextResponse.json({ error: 'Insufficient AI credits' }, { status: 402 });
        }

        const optimizedPages = await Promise.all(pages.map(async (page) => {
            const prompt = `Generate an SEO-optimized meta title and meta description for the following page content:
URL: ${page.url}
Title: ${page.title}
H1: ${page.h1}
Existing Description: ${page.description}

Rules:
1. Meta Title: Must be between 50 and 60 characters. Human-readable, includes high-search keywords naturally.
2. Meta Description: Must be between 150 and 160 characters. Compelling, include a call to action, and use high-search keywords.
3. Tone: Human-like, professional, and SEO-focused.

Format:
Title: [Generated Title]
Description: [Generated Description]`;

            let generatedTitle = '';
            let generatedDesc = '';

            const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

            if (apiKey) {
                try {
                    // Use Gemini if configured, otherwise fallback to OpenAI
                    if (process.env.GEMINI_API_KEY) {
                        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
                        const response = await fetch(apiUrl, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                contents: [{
                                    parts: [{
                                        text: `You are a professional SEO expert. 
                                        Analyze this page content and URL to generate a high-performing SEO meta title and meta description.
                                        
                                        URL: ${page.url}
                                        Current Title: ${page.title}
                                        Current H1: ${page.h1}
                                        Current Description: ${page.description}
                                        
                                        Goal: Extract and use high-search-volume keywords that are highly relevant to the actual content.
                                        
                                        Rules:
                                        1. Meta Title: 50-60 characters. Must be catchy and keyword-rich.
                                        2. Meta Description: 150-160 characters. Must include a clear call to action and natural keyword integration.
                                        
                                        Return ONLY a JSON object with "title" and "description" keys. Do not include markdown.`
                                    }]
                                }]
                            })
                        });

                        const result = await response.json();
                        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";
                        const cleanText = text.replace(/```json|```/g, "").trim();
                        const parsed = JSON.parse(cleanText);
                        generatedTitle = parsed.title || '';
                        generatedDesc = parsed.description || '';
                    } else if (process.env.OPENAI_API_KEY) {
                        const completion = await openai.chat.completions.create({
                            model: 'gpt-4o-mini',
                            messages: [
                                { role: 'system', content: 'You are an expert SEO specialist. Follow character limits strictly.' },
                                { role: 'user', content: prompt }
                            ],
                            temperature: 0.7,
                        });

                        const content = completion.choices[0]?.message?.content || '';
                        const lines = content.split('\n');
                        generatedTitle = lines.find(l => l.startsWith('Title:'))?.replace('Title:', '').trim() || '';
                        generatedDesc = lines.find(l => l.startsWith('Description:'))?.replace('Description:', '').trim() || '';
                    }
                } catch (err) {
                    console.error("AI Generation failed, using dummy fallback", err);
                    generatedTitle = (page.title || `Optimized Title for ${page.url}`).substring(0, 60);
                    generatedDesc = (page.description || `Optimized Meta Description for ${page.url}. Visit us for more information.`).substring(0, 160);
                }
            } else {
                generatedTitle = (page.title || `Optimized Title for ${page.url}`).substring(0, 60);
                generatedDesc = (page.description || `Optimized Meta Description for ${page.url}. Visit us for more information.`).substring(0, 160);
            }

            return {
                ...page,
                aiTitle: generatedTitle,
                aiDescription: generatedDesc
            };
        }));

        // Deduct credits
        await prisma.aiCredit.update({
            where: { userId: session.user.id },
            data: { used: { increment: pages.length } }
        });

        return NextResponse.json({ results: optimizedPages });
    } catch (error) {
        console.error('[META GENERATE ERROR]', error);
        return NextResponse.json({ error: 'Generation failed' }, { status: 500 });
    }
}
