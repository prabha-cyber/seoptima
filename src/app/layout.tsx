import type { Metadata } from 'next';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({
    subsets: ['latin'],
    variable: '--font-inter',
    display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
    subsets: ['latin'],
    variable: '--font-jakarta',
    display: 'swap',
});

export const metadata: Metadata = {
    title: {
        default: 'Seoptima — AI SEO & Website Platform',
        template: '%s | Seoptima',
    },
    description:
        'AI-powered website optimization platform. Auto-fix SEO, generate content, analyze ads, and grow your website on autopilot.',
    keywords: ['SEO', 'AI', 'website builder', 'SEO optimization', 'content AI'],
    authors: [{ name: 'Seoptima' }],
    openGraph: {
        type: 'website',
        siteName: 'Seoptima',
        title: 'Seoptima — AI Auto Website Optimization Platform',
        description:
            'Self-healing SEO + Website Builder + Ads Intelligence. The only platform that optimizes itself.',
    },
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className={`${inter.variable} ${jakarta.variable}`} suppressHydrationWarning>
            <body className="min-h-screen bg-background antialiased">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
