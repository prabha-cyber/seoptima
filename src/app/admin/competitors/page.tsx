'use client';

import { useState } from 'react';
import {
    Users, Globe, Search, BarChart3,
    TrendingUp, ShieldAlert, Activity,
    Plus, Trash2, ExternalLink, RefreshCw,
    MousePointer2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CompetitorsAdminPage() {
    const competitors = [
        { id: 1, name: 'SEMrush', domain: 'semrush.com', trackedBy: 450, status: 'SYNCED' },
        { id: 2, name: 'Ahrefs', domain: 'ahrefs.com', trackedBy: 320, status: 'SYNCED' },
        { id: 3, name: 'Moz', domain: 'moz.com', trackedBy: 180, status: 'SYNCED' },
        { id: 4, name: 'SpyFu', domain: 'spyfu.com', trackedBy: 95, status: 'ERROR' },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-display">Competitor Database</h1>
                    <p className="text-muted-foreground mt-1">Manage global competitor data and cross-platform benchmarking.</p>
                </div>
                <button className="btn-primary py-2 text-sm">
                    <Plus className="w-4 h-4" />
                    Add Global Competitor
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-5">
                    <p className="text-sm text-muted-foreground mb-1">Global Competitors</p>
                    <p className="text-2xl font-bold">{competitors.length}</p>
                </div>
                <div className="glass-card p-5">
                    <p className="text-sm text-muted-foreground mb-1">Total Tracked Instances</p>
                    <p className="text-2xl font-bold text-accent-400">1.2k</p>
                </div>
                <div className="glass-card p-5">
                    <p className="text-sm text-muted-foreground mb-1">Data Health</p>
                    <p className="text-2xl font-bold text-green-400">92%</p>
                </div>
                <div className="glass-card p-5">
                    <p className="text-sm text-muted-foreground mb-1">Sync Frequency</p>
                    <p className="text-2xl font-bold text-blue-400">Hourly</p>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <div className="px-6 py-4 border-b border-white/8 bg-white/2 flex justify-between items-center">
                    <h2 className="font-semibold text-sm">Top Tracked Competitors</h2>
                    <div className="flex gap-2">
                        <button className="p-1.5 hover:bg-white/10 rounded-lg text-muted-foreground"><Search className="w-4 h-4" /></button>
                        <button className="p-1.5 hover:bg-white/10 rounded-lg text-muted-foreground"><RefreshCw className="w-4 h-4" /></button>
                    </div>
                </div>
                <table className="w-full text-left">
                    <thead>
                        <tr className="text-[10px] text-muted-foreground uppercase border-b border-white/5">
                            <th className="px-6 py-3 font-semibold">Competitor</th>
                            <th className="px-6 py-3 font-semibold">Global Domain</th>
                            <th className="px-6 py-3 font-semibold text-center">Tracked By</th>
                            <th className="px-6 py-3 font-semibold text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/4">
                        {competitors.map(comp => (
                            <tr key={comp.id} className="hover:bg-white/2 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-accent-400">
                                            <TrendingUp className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm font-medium">{comp.name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-xs text-muted-foreground font-mono">{comp.domain}</span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className="text-xs font-bold text-foreground">{comp.trackedBy} Users</span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-bold border",
                                        comp.status === 'SYNCED' ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-red-500/10 text-red-400 border-red-500/20"
                                    )}>
                                        {comp.status}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
