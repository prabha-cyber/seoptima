'use client';

import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { useWebsite } from '@/context/website-context';
import { Globe, ChevronDown, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'lucide-react';

export function WebsiteSwitcher() {
    const { websites, activeWebsite, setActiveWebsiteId, isLoading } = useWebsite();

    if (isLoading) {
        return (
            <div className="h-9 w-40 animate-pulse bg-white/5 rounded-lg border border-white/10" />
        );
    }

    if (websites.length === 0) return null;

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/40">
                    <Globe className="w-4 h-4 text-brand-400" />
                    <span className="truncate max-w-[120px]">
                        {activeWebsite?.name || 'Select Website'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    className="z-50 min-w-[200px] bg-surface/95 backdrop-blur-xl border border-white/10 rounded-xl p-1 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                    align="start"
                    sideOffset={5}
                >
                    <div className="px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                        My Websites
                    </div>
                    {websites.map((website) => (
                        <DropdownMenu.Item
                            key={website.id}
                            className={cn(
                                "flex items-center justify-between px-2 py-2 rounded-lg text-sm cursor-pointer outline-none transition-colors",
                                activeWebsite?.id === website.id
                                    ? "bg-brand-500/10 text-brand-400"
                                    : "hover:bg-white/5 text-muted-foreground hover:text-foreground"
                            )}
                            onClick={() => setActiveWebsiteId(website.id)}
                        >
                            <span className="truncate">{website.name}</span>
                            {activeWebsite?.id === website.id && (
                                <Check className="w-3.5 h-3.5" />
                            )}
                        </DropdownMenu.Item>
                    ))}

                    <DropdownMenu.Separator className="h-px bg-white/5 my-1" />

                    <DropdownMenu.Item asChild>
                        <a
                            href="/onboarding"
                            className="flex items-center gap-2 px-2 py-2 rounded-lg text-sm text-brand-400 hover:bg-brand-500/5 cursor-pointer outline-none"
                        >
                            <Plus className="w-3.5 h-3.5" />
                            Add New Site
                        </a>
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    );
}
