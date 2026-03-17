'use client';

import { useState, useEffect } from 'react';
import { Activity, CheckCircle2, XCircle, Clock, AlertTriangle, Globe, Shield, RefreshCw, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface UptimeCheck {
    id: string;
    isUp: boolean;
    checkedAt: string;
    responseTime: number;
}

interface Monitor {
    id: string;
    name: string;
    url: string;
    status: string;
    lastChecked: string;
    lastResponseTime: number;
    checks: UptimeCheck[];
}

interface StatusPage {
    name: string;
    description: string;
    monitors: Monitor[];
    theme: string;
}

export default function StatusPage({ params }: { params: { slug: string } }) {
    const [page, setPage] = useState<StatusPage | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await fetch(`/api/public/status/${params.slug}`);
                if (!res.ok) throw new Error('Status page not found');
                const data = await res.json();
                setPage(data.statusPage);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
        const interval = setInterval(fetchData, 60000);
        return () => clearInterval(interval);
    }, [params.slug]);

    if (isLoading) return (
        <div className="min-h-screen bg-[#0f0f1a] flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
        </div>
    );

    if (error || !page) return (
        <div className="min-h-screen bg-[#0f0f1a] flex flex-col items-center justify-center p-6 text-center">
            <XCircle className="w-16 h-16 text-red-500 mb-4" />
            <h1 className="text-2xl font-bold text-white mb-2">Page Not Found</h1>
            <p className="text-zinc-500">The status page you are looking for does not exist or is private.</p>
        </div>
    );

    const allUp = page.monitors.every(m => m.status === 'UP');
    const someDown = page.monitors.some(m => m.status === 'DOWN');

    return (
        <div className="min-h-screen bg-[#0f0f1a] text-zinc-300 font-sans pb-20">
            {/* Hero Header */}
            <div className="relative overflow-hidden bg-zinc-900/50 border-b border-white/5 pt-12 pb-16">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-500/5 blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-1/3 h-full bg-blue-500/5 blur-[100px] pointer-events-none" />

                <div className="max-w-4xl mx-auto px-6 relative z-10">
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-black text-white tracking-tight mb-3">{page.name}</h1>
                            <p className="text-lg text-zinc-400 max-w-2xl">{page.description}</p>
                        </div>
                        <div className="flex items-center gap-3 bg-white/5 backdrop-blur-md border border-white/10 px-6 py-4 rounded-2xl">
                            {allUp ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                                        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold leading-none mb-1 text-lg">All Systems Operational</p>
                                        <p className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-widest">Everything is running smoothly</p>
                                    </div>
                                </div>
                            ) : someDown ? (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.2)]">
                                        <XCircle className="w-6 h-6 text-red-500" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold leading-none mb-1 text-lg">Partial System Outage</p>
                                        <p className="text-[10px] text-red-400/80 font-bold uppercase tracking-widest">Investigating potential issues</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                                        <AlertTriangle className="w-6 h-6 text-amber-400" />
                                    </div>
                                    <p className="text-white font-bold">System Maintenance</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Monitors List */}
            <div className="max-w-4xl mx-auto px-6 mt-12 space-y-4">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-500">Service Status</h2>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> Operational</span>
                        <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-500" /> Outage</span>
                    </div>
                </div>

                {page.monitors.map((monitor) => (
                    <motion.div key={monitor.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="bg-zinc-900/40 border border-white/5 rounded-2xl p-6 transition-all hover:border-white/10">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                    {monitor.name}
                                    <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-zinc-500 font-mono tracking-tighter">/status</span>
                                </h3>
                                <p className="text-xs text-zinc-500 truncate mt-1">{monitor.url}</p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={cn('px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm',
                                    monitor.status === 'UP' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20')}>
                                    {monitor.status}
                                </span>
                                {monitor.lastResponseTime && (
                                    <span className="text-[10px] text-zinc-500 mt-2 font-mono">{monitor.lastResponseTime}ms latency</span>
                                )}
                            </div>
                        </div>

                        {/* Uptime History Bar */}
                        <div className="space-y-3">
                            <div className="flex gap-[3px] h-10">
                                {Array.from({ length: 50 }).map((_, i) => {
                                    const check = monitor.checks[i];
                                    if (!check) return <div key={i} className="flex-1 bg-white/5 rounded-sm opacity-50" />;
                                    return (
                                        <div key={check.id}
                                            className={cn('flex-1 rounded-sm transition-all hover:scale-110 cursor-pointer',
                                                check.isUp ? 'bg-emerald-500/60 hover:bg-emerald-500' : 'bg-red-500/60 hover:bg-red-500')}
                                            title={`${new Date(check.checkedAt).toLocaleString()} — ${check.isUp ? 'UP' : 'DOWN'}`}
                                        />
                                    );
                                })}
                            </div>
                            <div className="flex justify-between items-center text-[10px] text-zinc-500 uppercase font-bold tracking-widest">
                                <span>50 checks ago</span>
                                <div className="h-px flex-1 mx-4 bg-white/5" />
                                <span>Recent</span>
                            </div>
                        </div>

                        {monitor.status === 'DOWN' && (
                            <div className="mt-6 p-4 bg-red-500/5 border border-red-500/10 rounded-xl flex items-start gap-3">
                                <Activity className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-red-400">Ongoing issues detected</p>
                                    <p className="text-xs text-red-400/70 mt-1">We are actively monitoring and investigating connectivity issues with this service.</p>
                                </div>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>

            {/* Footer */}
            <div className="max-w-4xl mx-auto px-6 mt-20 pt-12 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-6 opacity-40">
                <div className="flex items-center gap-2 font-bold text-white">
                    <Activity className="w-5 h-5 text-brand-500" />
                    Seoptima Monitor
                </div>
                <div className="flex gap-8 text-xs font-bold uppercase tracking-widest">
                    <a href="#" className="hover:text-white transition-all">Support</a>
                    <a href="#" className="hover:text-white transition-all">Report Issue</a>
                    <a href="#" className="hover:text-white transition-all underline">Powered by antigravity</a>
                </div>
            </div>
        </div>
    );
}
