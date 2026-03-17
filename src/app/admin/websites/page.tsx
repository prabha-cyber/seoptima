'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Globe, Search, SearchCode, Trash2, ExternalLink,
    AlertCircle, CheckCircle2, RefreshCw, Filter,
    LayoutGrid, BarChart3, User, Calendar, ShieldCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function WebsiteManagementPage() {
    const [websites, setWebsites] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        async function fetchWebsites() {
            try {
                const query = search ? `?q=${encodeURIComponent(search)}` : '';
                const res = await fetch(`/api/admin/websites${query}`);
                const data = await res.json();
                if (res.ok) setWebsites(data);
            } catch (error) {
                console.error('Failed to fetch websites:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchWebsites();
    }, [search]);

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this website? This will remove all associated pages and reports.')) return;
        try {
            const res = await fetch(`/api/admin/websites/${id}`, { method: 'DELETE' });
            if (res.ok) setWebsites(websites.filter(w => w.id !== id));
        } catch (error) {
            alert('Failed to delete website');
        }
    };

    const toggleStatus = async (site: any) => {
        const newStatus = site.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE';
        if (!confirm(`Are you sure you want to ${newStatus === 'ACTIVE' ? 'enable' : 'disable'} this website?`)) return;

        try {
            const res = await fetch(`/api/admin/websites/${site.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            });

            if (res.ok) {
                setWebsites(websites.map(w => w.id === site.id ? { ...w, status: newStatus } : w));
            } else {
                const error = await res.json();
                alert(error.error || 'Failed to update website status');
            }
        } catch (error) {
            alert('Failed to update website status');
        }
    };

    const triggerAudit = async (id: string) => {
        alert('Audit trigger logic would go here (calling technical SEO audit API)');
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-display">Website Management</h1>
                    <p className="text-muted-foreground mt-1">Monitor and manage all user-added websites and domains.</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn-secondary py-2 text-sm flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Sync Domains
                    </button>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Filter by domain, name or owner..."
                        className="input-base pl-10 w-full"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <button className="btn-secondary h-full px-4 flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filters
                </button>
            </div>

            {/* Websites Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/8 bg-white/2">
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Website</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Owner</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">SEO Status</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pages</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Added</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/4">
                            {isLoading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">Loading websites...</td></tr>
                            ) : websites.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">No websites found.</td></tr>
                            ) : websites.map((site) => {
                                const report = site.seoReports?.[0];
                                const score = report?.overallScore || 0;
                                return (
                                    <tr key={site.id} className="hover:bg-white/2 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-brand-400">
                                                    <Globe className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{site.name}</p>
                                                    <a
                                                        href={site.domain || `https://${site.subdomain}.antigravity.run`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-[11px] text-muted-foreground hover:text-brand-400 flex items-center gap-1 transition-colors"
                                                    >
                                                        {site.domain || `${site.subdomain}.antigravity.run`}
                                                        <ExternalLink className="w-2.5 h-2.5" />
                                                    </a>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] font-bold text-blue-400">
                                                    {site.user?.name?.[0] || 'U'}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium truncate">{site.user?.name || 'Unknown'}</p>
                                                    <p className="text-[10px] text-muted-foreground truncate">{site.user?.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {report ? (
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-8 h-8 rounded border flex items-center justify-center text-xs font-bold",
                                                        score >= 80 ? "bg-green-500/10 border-green-500/20 text-green-400" :
                                                            score >= 50 ? "bg-brand-500/10 border-brand-500/20 text-brand-400" :
                                                                "bg-red-500/10 border-red-500/20 text-red-400"
                                                    )}>
                                                        {score}
                                                    </div>
                                                    <div className="text-[10px]">
                                                        <p className="font-medium">SEO Score</p>
                                                        <p className="text-muted-foreground italic">Last: {new Date(report.createdAt).toLocaleDateString()}</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
                                                    <AlertCircle className="w-3.5 h-3.5" />
                                                    No Audit Yet
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-bold uppercase border",
                                                site.status === 'ACTIVE'
                                                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                                                    : "bg-red-500/10 text-red-400 border-red-500/20"
                                            )}>
                                                <div className={cn(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    site.status === 'ACTIVE' ? "bg-green-400 animate-pulse" : "bg-red-400"
                                                )} />
                                                {site.status || 'ACTIVE'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-xs font-medium text-foreground">
                                            {site._count?.pages || 0} Pages
                                        </td>
                                        <td className="px-6 py-4 text-xs text-muted-foreground">
                                            {new Date(site.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-end gap-3">
                                                {/* Persistent Toggle */}
                                                <button
                                                    onClick={() => toggleStatus(site)}
                                                    className={cn(
                                                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 focus:ring-offset-background",
                                                        site.status === 'ACTIVE' ? 'bg-green-500' : 'bg-white/20'
                                                    )}
                                                    title={site.status === 'ACTIVE' ? 'Disable Website' : 'Enable Website'}
                                                >
                                                    <span className="sr-only">Toggle status</span>
                                                    <span
                                                        aria-hidden="true"
                                                        className={cn(
                                                            "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                            site.status === 'ACTIVE' ? 'translate-x-4' : 'translate-x-0'
                                                        )}
                                                    />
                                                </button>

                                                <div className="h-4 w-px bg-white/10 hidden sm:block" />

                                                <div className="flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => triggerAudit(site.id)}
                                                        className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
                                                        title="Run Technical Audit"
                                                    >
                                                        <SearchCode className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
                                                        title="View Site Builder"
                                                    >
                                                        <LayoutGrid className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(site.id)}
                                                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-all"
                                                        title="Delete Website"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className="px-6 py-4 border-t border-white/8 bg-white/2 flex items-center justify-between text-xs text-muted-foreground">
                    <p>Total {websites.length} websites monitored</p>
                    <div className="flex gap-2">
                        <button className="px-2 py-1 rounded border border-white/8 hover:bg-white/5 disabled:opacity-50" disabled>Previous</button>
                        <button className="px-2 py-1 rounded border border-white/8 hover:bg-white/5 disabled:opacity-50" disabled>Next</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
