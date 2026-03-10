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

            if (process.env.OPENAI_API_KEY) {
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
            } else {
                generatedTitle = `[Demo] Optimized Title for ${page.url}`.substring(0, 60);
                generatedDesc = `[Demo] Optimized Meta Description for ${page.url}. Visit us for more information and SEO tips.`.substring(0, 160);
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
