'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Building2, Search, Filter, MoreVertical, Edit2, Trash2,
    CheckCircle2, XCircle, Plus, Users, Globe, ExternalLink,
    ChevronRight, LayoutGrid, List
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function AgencyManagementPage() {
    const [agencies, setAgencies] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    useEffect(() => {
        async function fetchAgencies() {
            try {
                const query = new URLSearchParams();
                if (search) query.append('q', search);

                const res = await fetch(`/api/admin/agencies?${query.toString()}`);
                const data = await res.json();
                if (res.ok) setAgencies(data);
            } catch (error) {
                console.error('Failed to fetch agencies:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchAgencies();
    }, [search]);

    const handleDeleteAgency = async (id: string) => {
        if (!confirm('Are you sure you want to delete this agency? This will affect all its members.')) return;
        try {
            const res = await fetch(`/api/admin/agencies/${id}`, { method: 'DELETE' });
            if (res.ok) setAgencies(agencies.filter(a => a.id !== id));
        } catch (error) {
            alert('Failed to delete agency');
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-display">Agency Management</h1>
                    <p className="text-muted-foreground mt-1">Manage partner agencies, their teams, and feature access.</p>
                </div>
                <Link href="/admin/agencies/new" className="btn-primary py-2 text-sm">
                    <Plus className="w-4 h-4" />
                    Create Agency
                </Link>
            </div>

            {/* Filters & View Select */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search by name or description..."
                        className="input-base pl-10 w-full"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <div className="flex border border-white/10 rounded-lg p-1 bg-white/5">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={cn("p-1.5 rounded-md transition-all", viewMode === 'grid' ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white")}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn("p-1.5 rounded-md transition-all", viewMode === 'list' ? "bg-white/10 text-white" : "text-muted-foreground hover:text-white")}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                    <button className="btn-secondary h-full px-4">
                        <Filter className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center p-20">
                    <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : agencies.length === 0 ? (
                <div className="glass-card p-12 text-center border-dashed">
                    <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <Building2 className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold">No agencies found</h3>
                    <p className="text-muted-foreground mt-1 max-w-xs mx-auto text-sm">Create your first agency to manage teams and shared SEO projects.</p>
                    <Link href="/admin/agencies/new" className="btn-primary mt-6 text-sm">
                        Create Agency
                    </Link>
                </div>
            ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agencies.map((agency, i) => (
                        <motion.div
                            key={agency.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="glass-card group hover:border-brand-500/40 transition-all flex flex-col"
                        >
                            <div className="p-6 pb-4">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 flex items-center justify-center border border-white/10 group-hover:border-brand-500/20 transition-all">
                                        <Building2 className="w-6 h-6 text-brand-400" />
                                    </div>
                                    <div className="flex gap-1.5">
                                        <Link href={`/admin/agencies/${agency.id}`} className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-muted-foreground hover:text-white transition-all">
                                            <Edit2 className="w-3.5 h-3.5" />
                                        </Link>
                                        <button
                                            onClick={() => handleDeleteAgency(agency.id)}
                                            className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg group-hover:text-brand-400 transition-colors truncate">{agency.name}</h3>
                                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1 h-10">{agency.description || 'No description provided.'}</p>
                                </div>
                            </div>

                            <div className="px-6 py-4 bg-white/2 border-t border-white/5 mt-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Members</span>
                                        <div className="flex items-center gap-1.5 mt-0.5 font-medium">
                                            <Users className="w-3.5 h-3.5 text-blue-400" />
                                            {agency._count?.members || 0}
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Sites</span>
                                        <div className="flex items-center gap-1.5 mt-0.5 font-medium">
                                            <Globe className="w-3.5 h-3.5 text-green-400" />
                                            {agency._count?.websites || 0}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Link href={`/admin/agencies/${agency.id}`} className="p-3 text-center text-xs font-semibold uppercase tracking-widest text-muted-foreground hover:text-brand-400 bg-white/5 hover:bg-white/10 transition-all">
                                Manage Controls
                            </Link>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="glass-card overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/8 bg-white/2">
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Agency</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Members</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Sites</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Created</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/4">
                                {agencies.map((agency) => (
                                    <tr key={agency.id} className="hover:bg-white/2 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center text-brand-400 ring-1 ring-white/10 group-hover:ring-brand-500/20">
                                                    <Building2 className="w-5 h-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-bold text-white group-hover:text-brand-400 transition-all">{agency.name}</p>
                                                    <p className="text-[11px] text-muted-foreground truncate">{agency.website || 'No website'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className={cn(
                                                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ring-1 ring-inset",
                                                agency.status === 'ACTIVE' ? "bg-green-500/10 text-green-400 ring-green-500/20" : "bg-red-500/10 text-red-400 ring-red-500/20"
                                            )}>
                                                <div className={cn("w-1.5 h-1.5 rounded-full", agency.status === 'ACTIVE' ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,1)] animate-pulse" : "bg-red-500")} />
                                                {agency.status}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium">
                                            {agency._count?.members || 0}
                                        </td>
                                        <td className="px-6 py-4 text-sm font-medium">
                                            {agency._count?.websites || 0}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-muted-foreground">
                                            {new Date(agency.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Link
                                                    href={`/admin/agencies/${agency.id}`}
                                                    className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-muted-foreground hover:text-white transition-all shadow-sm"
                                                >
                                                    <ChevronRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
