'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import {
    LayoutDashboard, Users, Globe, Search, BarChart3,
    Megaphone, FileText, Settings, LogOut, ChevronRight,
    Shield, Key, Database, Mail, Bell,
    Newspaper, Lock, ScrollText, CreditCard, Activity, Bot, ToggleRight, DollarSign
} from 'lucide-react';
import { cn } from '@/lib/utils';

const adminNavItems = [
    {
        group: 'Platform',
        items: [
            { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, hideToggle: true },
            { href: '/admin/users', label: 'User Management', icon: Users, hideToggle: true },
            { href: '/admin/websites', label: 'Website Management', icon: Globe },
        ],
    },
    {
        group: 'SEO & Data',
        items: [
            { href: '/admin/audits', label: 'SEO Audits', icon: Search },
            { href: '/admin/keywords', label: 'Keyword Database', icon: Database },
            { href: '/admin/competitors', label: 'Competitor Data', icon: BarChart3 },
            { href: '/admin/backlinks', label: 'Backlink Database', icon: Activity },
            { href: '/admin/reports', label: 'Reports', icon: FileText },
        ],
    },
    {
        group: 'System',
        items: [
            { href: '/admin/api', label: 'API Management', icon: Key },
            { href: '/admin/payments', label: 'Revenue & Gateways', icon: DollarSign },
            { href: '/admin/subscriptions', label: 'Subscriptions', icon: CreditCard },
            { href: '/admin/notifications', label: 'Notifications', icon: Bell },
            { href: '/admin/monitor', label: 'Uptime Monitor', icon: Activity },
            { href: '/admin/automation', label: 'Automation', icon: Bot },
            { href: '/admin/cms', label: 'Blog / CMS', icon: Newspaper },
        ],
    },
    {
        group: 'Configuration',
        items: [
            { href: '/admin/settings', label: 'System Settings', icon: Settings },
            { href: '/admin/features', label: 'Feature Management', icon: ToggleRight },
            { href: '/admin/security', label: 'Security', icon: Shield },
            { href: '/admin/logs', label: 'System Logs', icon: ScrollText },
        ],
    },
];

export function AdminSidebar() {
    const pathname = usePathname();
    const { data: session } = useSession();

    // Feature status state - using simple record for visual feedback
    const [featureStatus, setFeatureStatus] = useState<Record<string, boolean>>({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchFeatures();
    }, []);

    const fetchFeatures = async () => {
        try {
            const res = await fetch('/api/admin/features');
            if (res.ok) {
                const data = await res.json();
                const statusMap: Record<string, boolean> = {};

                // Set defaults based on adminNavItems
                adminNavItems.forEach(group => {
                    group.items.forEach(item => {
                        statusMap[item.href] = true;
                    });
                });

                // Override with DB data
                data.forEach((flag: any) => {
                    statusMap[flag.name] = flag.enabled;
                });

                setFeatureStatus(statusMap);
            }
        } catch (error) {
            console.error('Failed to fetch features');
        } finally {
            setIsLoading(false);
        }
    };

    const toggleFeature = async (href: string, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        const newStatus = !featureStatus[href];

        // Optimistic UI update
        setFeatureStatus(prev => ({
            ...prev,
            [href]: newStatus
        }));

        try {
            const res = await fetch('/api/admin/features', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: href, enabled: newStatus })
            });

            if (!res.ok) {
                // Rollback if failed
                setFeatureStatus(prev => ({
                    ...prev,
                    [href]: !newStatus
                }));
                alert('Failed to save feature status');
            }
        } catch (error) {
            setFeatureStatus(prev => ({
                ...prev,
                [href]: !newStatus
            }));
            alert('Error updating feature status');
        }
    };

    return (
        <aside className="fixed left-0 top-0 h-full w-64 bg-surface/80 backdrop-blur-xl border-r border-white/8 flex flex-col z-40 custom-scroll overflow-y-auto">
            {/* Logo */}
            <div className="p-4 border-b border-white/8">
                <Link href="/admin" className="flex items-center justify-center gap-2">
                    <img src="/seoptima-logo.png" alt="Seoptima" className="h-8 w-auto object-contain" />
                    <span className="text-xs font-bold px-1.5 py-0.5 rounded bg-brand-500/20 text-brand-400 border border-brand-500/20">ADMIN</span>
                </Link>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 space-y-6">
                {adminNavItems.map((group) => (
                    <div key={group.group}>
                        <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 mb-2">
                            {group.group}
                        </p>
                        <ul className="space-y-0.5">
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;
                                const isEnabled = featureStatus[item.href];

                                return (
                                    <li key={item.href}>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                'sidebar-item relative group/item',
                                                isActive && 'active',
                                                !isEnabled && 'opacity-60 grayscale-[0.5]'
                                            )}
                                        >
                                            <Icon className="w-4 h-4 flex-shrink-0" />
                                            <span className="flex-1 transition-all">{item.label}</span>

                                            {/* Feature Toggle */}
                                            {!(item as any).hideToggle && (
                                                <div
                                                    onClick={(e) => toggleFeature(item.href, e)}
                                                    className={cn(
                                                        "relative inline-flex h-4 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                                        isEnabled ? 'bg-brand-500' : 'bg-white/20'
                                                    )}
                                                    title={isEnabled ? 'Disable Feature' : 'Enable Feature'}
                                                >
                                                    <span
                                                        aria-hidden="true"
                                                        className={cn(
                                                            "pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                            isEnabled ? 'translate-x-3' : 'translate-x-0'
                                                        )}
                                                    />
                                                </div>
                                            )}

                                            {isActive && <ChevronRight className="w-3 h-3 opacity-60 ml-1" />}
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
                            {session?.user?.name?.[0]?.toUpperCase() || 'A'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{session?.user?.name || 'Admin'}</p>
                            <span className="text-[10px] font-bold text-brand-400 uppercase">Administrator</span>
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
