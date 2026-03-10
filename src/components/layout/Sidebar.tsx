'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
    LayoutDashboard, Globe, Search, Sparkles, ShoppingCart,
    BarChart3, Megaphone, Bot, FileText, Settings, LogOut,
    ChevronRight, Zap, Bell, CreditCard, Shield, Users, Activity,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
    {
        group: 'Main',
        items: [
            { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        ],
    },
    {
        group: 'SEO',
        items: [
            { href: '/seo', label: 'SEO Dashboard', icon: Search },
            { href: '/keyword-generator', label: 'Keyword Research', icon: Sparkles },
            { href: '/keywords', label: 'Rank Tracking', icon: BarChart3 },
            { href: '/competitors', label: 'Competitors', icon: Users },
            { href: '/technical-seo', label: 'Technical SEO', icon: Settings },
            { href: '/meta-content', label: 'Meta Optimizer', icon: FileText },
        ],
    },

    {
        group: 'Analytics',
        items: [
            { href: '/ads', label: 'Ads Analysis', icon: Megaphone },
            { href: '/reports', label: 'Reports', icon: FileText },
        ],
    },
    {
        group: 'Automation',
        items: [
            { href: '/automation', label: 'Automation', icon: Bot },
            { href: '/monitor', label: 'Uptime Monitor', icon: Activity },
        ],
    },
    {
        group: 'Account',
        items: [
            { href: '/billing', label: 'Billing', icon: CreditCard },
            { href: '/admin', label: 'Admin Panel', icon: Shield },
        ],
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    return (
        <aside className="fixed left-0 top-0 h-full w-64 bg-surface/80 backdrop-blur-xl border-r border-white/8 flex flex-col z-40 custom-scroll overflow-y-auto">
            {/* Logo */}
            <div className="p-4 border-b border-white/8">
                <Link href="/dashboard" className="flex items-center justify-center">
                    <img src="/seoptima-logo.png" alt="Seoptima" className="h-10 w-auto object-contain" />
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-6">
                {navItems.map((group) => (
                    <div key={group.group}>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 mb-2">
                            {group.group}
                        </p>
                        <ul className="space-y-0.5">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const isActive =
                                    item.href === '/dashboard'
                                        ? pathname === '/dashboard'
                                        : pathname.startsWith(item.href);

                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={cn('sidebar-item', isActive && 'active')}
                                        >
                                            <Icon className="w-4 h-4 flex-shrink-0" />
                                            <span className="flex-1">{item.label}</span>
                                            {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                ))}
            </nav>

            {/* Bottom user card */}
            <div className="p-3 border-t border-white/8">
                <div className="glass-card p-3 mb-2">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-accent-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                            {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{session?.user?.name || 'User'}</p>
                            <p className="text-xs text-muted-foreground truncate">{session?.user?.email}</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="w-full btn-ghost text-muted-foreground hover:text-red-400 justify-start py-2"
                >
                    <LogOut className="w-4 h-4" />
                    Sign out
                </button>
            </div>
        </aside>
    );
}
