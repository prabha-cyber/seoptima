'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Search, Filter, FileText, Download, ExternalLink,
    AlertTriangle, CheckCircle2, Clock, Trash2,
    BarChart3, ShieldCheck, Zap, Globe
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function AuditManagementPage() {
    const [reports, setReports] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        async function fetchReports() {
            try {
                const query = search ? `?q=${encodeURIComponent(search)}` : '';
                const res = await fetch(`/api/admin/audits${query}`);
                const data = await res.json();
                if (res.ok) setReports(data);
            } catch (error) {
                console.error('Failed to fetch reports:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchReports();
    }, [search]);

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-400 border-green-500/20 bg-green-500/10';
        if (score >= 50) return 'text-brand-400 border-brand-500/20 bg-brand-500/10';
        return 'text-red-400 border-red-500/20 bg-red-500/10';
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-display">SEO Audit Management</h1>
                    <p className="text-muted-foreground mt-1">Review and manage all website SEO health audits.</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn-secondary py-2 text-sm">Export All CSV</button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="glass-card p-5">
                    <p className="text-sm text-muted-foreground mb-1">Total Audits</p>
                    <p className="text-2xl font-bold">{reports.length}</p>
                </div>
                <div className="glass-card p-5">
                    <p className="text-sm text-muted-foreground mb-1">Avg Score</p>
                    <p className="text-2xl font-bold text-green-400">
                        {reports.length > 0 ? Math.round(reports.reduce((acc, curr) => acc + curr.overallScore, 0) / reports.length) : 0}%
                    </p>
                </div>
                <div className="glass-card p-5">
                    <p className="text-sm text-muted-foreground mb-1">Critical Issues</p>
                    <p className="text-2xl font-bold text-red-400">
                        {reports.reduce((acc, curr) => acc + (curr.issuesFound || 0), 0)}
                    </p>
                </div>
                <div className="glass-card p-5">
                    <p className="text-sm text-muted-foreground mb-1">Last 24h</p>
                    <p className="text-2xl font-bold text-brand-400">
                        {reports.filter(r => new Date(r.createdAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length}
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search by website name or domain..."
                    className="input-base pl-10 w-full"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Audit Table */}
            <div className="glass-card overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/8 bg-white/2">
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Website</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Score</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Technical Health</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Issues</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Generated</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/4">
                            {isLoading ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">Loading audits...</td></tr>
                            ) : reports.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">No audit records found.</td></tr>
                            ) : reports.map((report) => (
                                <tr key={report.id} className="hover:bg-white/2 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-brand-500/20 flex items-center justify-center text-brand-400">
                                                <Globe className="w-4 h-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium truncate">{report.website?.name}</p>
                                                <p className="text-[10px] text-muted-foreground truncate">{report.website?.domain || 'Internal'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <div className={cn(
                                                "w-10 h-10 rounded-full border-2 flex items-center justify-center font-bold text-xs ring-4 ring-white/5",
                                                report.overallScore >= 80 ? "border-green-500 text-green-400" :
                                                    report.overallScore >= 50 ? "border-brand-500 text-brand-400" :
                                                        "border-red-500 text-red-400"
                                            )}>
                                                {report.overallScore}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                            <div className="flex items-center gap-1.5 min-w-[80px]">
                                                <div className="w-1 h-3 rounded-full bg-blue-500/50" />
                                                <span className="text-[10px] text-muted-foreground">Tech:</span>
                                                <span className="text-[10px] font-bold text-foreground">{report.technicalScore}%</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 min-w-[80px]">
                                                <div className="w-1 h-3 rounded-full bg-accent-500/50" />
                                                <span className="text-[10px] text-muted-foreground">Speed:</span>
                                                <span className="text-[10px] font-bold text-foreground">{report.speedScore}%</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 min-w-[80px]">
                                                <div className="w-1 h-3 rounded-full bg-green-500/50" />
                                                <span className="text-[10px] text-muted-foreground">Content:</span>
                                                <span className="text-[10px] font-bold text-foreground">{report.contentScore}%</span>
                                            </div>
                                            <div className="flex items-center gap-1.5 min-w-[80px]">
                                                <div className="w-1 h-3 rounded-full bg-purple-500/50" />
                                                <span className="text-[10px] text-muted-foreground">Schema:</span>
                                                <span className="text-[10px] font-bold text-foreground">{report.schemaScore}%</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className={cn(
                                                "text-xs font-bold",
                                                report.issuesFound > 10 ? "text-red-400" : report.issuesFound > 5 ? "text-yellow-400" : "text-green-400"
                                            )}>
                                                {report.issuesFound} Issues
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">{report.crawledPages || 0} Pages crawled</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <Clock className="w-3 h-3 text-muted-foreground/40" />
                                            {new Date(report.createdAt).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all"
                                                title="View Report"
                                            >
                                                <FileText className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-brand-500/20 text-muted-foreground hover:text-brand-400 transition-all"
                                                title="Download PDF"
                                            >
                                                <Download className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition-all"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
