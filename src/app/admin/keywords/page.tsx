'use client';

import { useState, useEffect } from 'react';
import {
    Search, Filter, Database, Plus, Trash2, Edit2,
    ArrowUpRight, BarChart3, Globe, Shield, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function KeywordDatabasePage() {
    const [keywords, setKeywords] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        const fetchKeywords = async () => {
            try {
                const query = search ? `?q=${encodeURIComponent(search)}` : '';
                const res = await fetch(`/api/admin/keywords${query}`);
                const data = await res.json();
                if (res.ok) setKeywords(data);
            } catch (error) {
                console.error('Failed to fetch keywords:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchKeywords();
    }, [search]);

    const deleteKeyword = async (id: string) => {
        if (!confirm('Delete this keyword?')) return;
        // API call would go here
        setKeywords(keywords.filter(k => k.id !== id));
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-display">Keyword Database</h1>
                    <p className="text-muted-foreground mt-1">Manage global keyword data, search volume, and tracking status.</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn-secondary py-2 text-sm flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Update Volumes
                    </button>
                    <button className="btn-primary py-2 text-sm">
                        <Plus className="w-4 h-4" />
                        Add Keyword
                    </button>
                </div>
            </div>

            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search keywords..."
                        className="input-base pl-10 w-full"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button className="btn-secondary h-full px-4 flex items-center gap-2">
                    <Filter className="w-4 h-4" /> Filter
                </button>
            </div>

            <div className="glass-card overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-white/8 bg-white/2">
                            <th className="px-6 py-4 text-xs font-semibold uppercase text-muted-foreground">Keyword</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase text-muted-foreground">Assigned Site</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase text-muted-foreground">Stats (Vol/Diff)</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase text-muted-foreground">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase text-muted-foreground text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/4">
                        {isLoading ? (
                            <tr><td colSpan={5} className="p-12 text-center text-muted-foreground italic">Loading...</td></tr>
                        ) : keywords.length === 0 ? (
                            <tr><td colSpan={5} className="p-12 text-center text-muted-foreground italic">No keywords found.</td></tr>
                        ) : keywords.map(kw => (
                            <tr key={kw.id} className="hover:bg-white/2 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <Database className="w-4 h-4 text-brand-400" />
                                        <span className="text-sm font-medium">{kw.term}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-xs">
                                        <p className="font-medium text-foreground">{kw.website?.name}</p>
                                        <p className="text-muted-foreground">{kw.website?.domain || 'Internal'}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-4">
                                        <div className="text-xs">
                                            <p className="text-muted-foreground">Volume</p>
                                            <p className="font-bold">1.2k</p>
                                        </div>
                                        <div className="text-xs">
                                            <p className="text-muted-foreground">Diff</p>
                                            <p className="font-bold text-orange-400">45</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px] font-bold uppercase border border-green-500/20">
                                        {kw.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-muted-foreground"><Edit2 className="w-3.5 h-3.5" /></button>
                                        <button onClick={() => deleteKeyword(kw.id)} className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/20 text-muted-foreground hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
