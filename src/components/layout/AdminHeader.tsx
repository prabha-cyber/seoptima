'use client';

import { useSession } from 'next-auth/react';
import { Bell, Search, Settings } from 'lucide-react';
import { NotificationsDropdown } from './NotificationsDropdown';

export function AdminHeader() {
    const { data: session } = useSession();
    const hour = new Date().getHours();
    const greeting =
        hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

    return (
        <header className="sticky top-0 z-30 h-16 border-b border-white/8 bg-background/80 backdrop-blur-xl flex items-center px-6 gap-4">
            {/* Greeting */}
            <div className="flex-1 flex items-center gap-4">
                <p className="text-sm text-muted-foreground">
                    {greeting}, <span className="text-foreground font-medium">{session?.user?.name?.split(' ')[0] || 'Admin'}</span> (Admin) 🛡️
                </p>
            </div>

            {/* Search */}
            <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search platform..."
                    className="input-base pl-9 w-64 h-9 text-sm"
                />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
                <button className="w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 text-muted-foreground hover:text-foreground transition-all">
                    <Settings className="w-4 h-4" />
                </button>
                <NotificationsDropdown />
            </div>
        </header>
    );
}
