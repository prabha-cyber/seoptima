'use client';

import { useState, useEffect } from 'react';
import {
    Search, Filter, Activity, Plus, Trash2,
    Link as LinkIcon, Globe, ShieldCheck,
    ArrowUpRight, BarChart3, Calendar, ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BacklinkDatabasePage() {
    const [backlinks, setBacklinks] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchBacklinks = async () => {
            try {
                const query = search ? `?q=${encodeURIComponent(search)}` : '';
                const res = await fetch(`/api/admin/backlinks${query}`);
                const data = await res.json();
                if (res.ok) setBacklinks(data);
            } catch (error) {
                console.error('Failed to fetch backlinks:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchBacklinks();
    }, [search]);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-display">Backlink Database</h1>
                    <p className="text-muted-foreground mt-1">Manage global backlink data, referring domains, and authority scores.</p>
                </div>
                <button className="btn-primary py-2 text-sm">
                    <Plus className="w-4 h-4" />
                    New Backlink
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search referring domains or anchor text..."
                    className="input-base pl-10 w-full"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="glass-card overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/8 bg-white/2">
                            <th className="px-6 py-4 text-xs font-semibold uppercase text-muted-foreground">Referring Domain</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase text-muted-foreground">Target Website</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase text-muted-foreground">Anchor Text</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase text-muted-foreground">Auth Score</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase text-muted-foreground text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/4">
                        {isLoading ? (
                            <tr><td colSpan={5} className="p-12 text-center text-muted-foreground italic">Loading...</td></tr>
                        ) : backlinks.length === 0 ? (
                            <tr><td colSpan={5} className="p-12 text-center text-muted-foreground italic">No backlinks tracked.</td></tr>
                        ) : backlinks.map(bl => (
                            <tr key={bl.id} className="hover:bg-white/2 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-accent-500/20 flex items-center justify-center text-accent-400">
                                            <LinkIcon className="w-4 h-4" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{bl.referringDomain}</p>
                                            <p className="text-[10px] text-muted-foreground uppercase">{bl.linkType}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-xs">
                                        <p className="font-medium text-foreground">{bl.website?.name}</p>
                                        <p className="text-muted-foreground truncate max-w-[150px]">{bl.website?.domain || 'Internal'}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs font-mono text-brand-300 italic">"{bl.anchorText || 'None'}"</span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className={cn(
                                        "inline-flex items-center justify-center w-8 h-8 rounded-lg font-bold text-xs ring-4 ring-white/5",
                                        bl.authorityScore >= 70 ? "bg-green-500/10 text-green-400" :
                                            bl.authorityScore >= 40 ? "bg-brand-500/10 text-brand-400" :
                                                "bg-red-500/10 text-red-400"
                                    )}>
                                        {bl.authorityScore}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
