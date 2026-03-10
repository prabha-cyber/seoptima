import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { businessName, industry, targetAudience } = await req.json();

        // Check AI Credits
        const aiCredits = await prisma.aiCredit.findUnique({
            where: { userId: session.user.id }
        });

        if (!aiCredits || aiCredits.used >= aiCredits.total) {
            return NextResponse.json({ error: 'Insufficent AI credits' }, { status: 403 });
        }

        // 1. Generate Content (Mocked for testing, real OpenAI integration would go here)
        const mockPrompt = `Generate a website for ${businessName} in the ${industry} industry. Audience: ${targetAudience}`;

        // 2. Fetch the latest website for this user to update
        const userWebsite = await prisma.website.findFirst({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' }
        });

        if (!userWebsite) {
            return NextResponse.json({ error: 'No website found to update' }, { status: 404 });
        }

        // 3. Update the HomePage with AI-generated content blocks
        const generatedBlocks = [
            { type: 'hero', title: `Welcome to ${businessName}`, subtitle: `The best ${industry} services for you.` },
            { type: 'features', title: 'Why Choose Us', features: ['Expertise', 'Quality', 'Support'] },
            { type: 'cta', text: 'Get Started Today' }
        ];

        // Update the home page
        await prisma.page.updateMany({
            where: { websiteId: userWebsite.id, isHomePage: true },
            data: {
                content: JSON.stringify(generatedBlocks),
                metaTitle: `${businessName} | ${industry} Experts`,
                metaDesc: `Welcome to ${businessName}. We specialize in ${industry}.`
            }
        });

        // 4. Deduct AI Credits & log usage
        await prisma.$transaction([
            prisma.aiCredit.update({
                where: { userId: session.user.id },
                data: { used: { increment: 5 } } // Assume website gen costs 5 credits
            }),
            prisma.aiUsage.create({
                data: {
                    creditId: aiCredits.id,
                    tool: 'WEBSITE_GENERATOR',
                    prompt: mockPrompt,
                    creditsUsed: 5
                }
            })
        ]);

        return NextResponse.json({
            success: true,
            websiteId: userWebsite.id
        });

    } catch (error) {
        console.error('[AI SITE GEN ERROR]', error);
        return NextResponse.json({ error: 'Failed to generate website' }, { status: 500 });
    }
}
