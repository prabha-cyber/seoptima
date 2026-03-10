'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from '@/components/ui/toaster';
import { WebsiteProvider } from '@/context/website-context';

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <WebsiteProvider>
                {children}
                <Toaster />
            </WebsiteProvider>
        </SessionProvider>
    );
}
