'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Plus, Trash2, Mail, CheckCircle2, XCircle, Clock,
    Loader2, Globe, ArrowUpCircle, ArrowDownCircle, Wifi, WifiOff,
    RefreshCw, ChevronDown, ChevronUp, X, Send, AlertTriangle,
    MailPlus, Zap, History, Scan, FileSearch, Link2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function IndividualCrawlTimer({ lastChecked, interval }: { lastChecked: string | null; interval: number }) {
    const [timeLeft, setTimeLeft] = useState('');

    useEffect(() => {
        const updateTimer = () => {
            if (!lastChecked) {
                setTimeLeft('PENDING');
                return;
            }

            const now = Date.now();
            const lastCheckedMs = new Date(lastChecked).getTime();
            const nextRunMs = lastCheckedMs + (interval * 60000); // interval in minutes to ms

            const diffMs = nextRunMs - now;

            if (diffMs <= 0) {
                setTimeLeft('RUNNING SHORTLY...');
                return;
            }

            const diffMins = Math.floor(diffMs / 60000);
            const diffSecs = Math.floor((diffMs % 60000) / 1000);

            setTimeLeft(`${diffMins}:${diffSecs.toString().padStart(2, '0')}`);
        };

        updateTimer();
        const timerId = setInterval(updateTimer, 1000);
        return () => clearInterval(timerId);
    }, [lastChecked, interval]);

    return (
        <span className="text-zinc-500 font-mono flex items-center gap-1 min-w-[50px]">
            <Clock className="w-3 h-3" />
            {timeLeft}
        </span>
    );
}

interface UptimeCheck {
    id: string;
    statusCode: number | null;
    responseTime: number | null;
    isUp: boolean;
    error: string | null;
    checkedAt: string;
}

interface MonitorSubPage {
    id: string;
    url: string;
    active: boolean;
    metaTitle: string | null;
    metaDescription: string | null;
    seoScore: number | null;
    lastAnalyzed: string | null;
    checks: UptimeCheck[];
}

interface MonitorEmail {
    id: string;
    email: string;
    createdAt: string;
}

interface Monitor {
    id: string;
    name: string;
    url: string;
    type: string;
    interval: number;
    active: boolean;
    status: string;
    crawlProgress: number;
    lastChecked: string | null;
    lastStatus: number | null;
    lastResponseTime: number | null;
    emails: MonitorEmail[];
    checks: UptimeCheck[];
    pages: MonitorSubPage[];
}

function StatusBadge({ status, progress }: { status: string; progress?: number }) {
    const config: Record<string, { color: string; icon: React.ElementType; label: string }> = {
        CRAWLING: { color: 'bg-purple-500/20 text-purple-400 border-purple-500/30', icon: Loader2, label: `CRAWLING ${progress || 0}%` },
        UP: { color: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20', icon: ArrowUpCircle, label: 'UP' },
        DOWN: { color: 'bg-red-500/15 text-red-400 border-red-500/20', icon: ArrowDownCircle, label: 'DOWN' },
        UNKNOWN: { color: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20', icon: Clock, label: 'UNKNOWN' },
    };
    const c = config[status] || config.UNKNOWN;
    const Icon = c.icon;
    return (
        <span className={cn('inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase rounded-full border', c.color)}>
            {c.label}
        </span>
    );
}

function formatDate(date: string | null) {
    if (!date) return '—';
    return new Intl.DateTimeFormat(undefined, {
        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).format(new Date(date));
}

function UptimeBar({ checks }: { checks: UptimeCheck[] }) {
    const last20 = [...checks].reverse().slice(-20);
    if (last20.length === 0) return <p className="text-xs text-muted-foreground italic">No checks yet</p>;
    return (
        <div className="flex gap-1 items-end h-8">
            {last20.map((check, i) => (
                <div
                    key={check.id || i}
                    className={cn('w-2 rounded-full transition-all', check.isUp ? 'bg-emerald-500' : 'bg-red-500')}
                    style={{ height: check.isUp ? '100%' : '40%' }}
                    title={`${check.isUp ? 'UP' : 'DOWN'} — ${check.statusCode || 'N/A'} — ${formatDate(check.checkedAt)}`}
                />
            ))}
        </div>
    );
}

export default function MonitorPage() {
    const [monitors, setMonitors] = useState<Monitor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newName, setNewName] = useState('');
    const [newUrl, setNewUrl] = useState('');
    const [newEmail, setNewEmail] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [checkingId, setCheckingId] = useState<string | null>(null);
    const [checkingAll, setCheckingAll] = useState(false);
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [emailInputs, setEmailInputs] = useState<Record<string, string>>({});
    const [addingEmail, setAddingEmail] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [newInterval, setNewInterval] = useState(15);
    const [updatingIntervalId, setUpdatingIntervalId] = useState<string | null>(null);
    const [newType, setNewType] = useState('HTTP');
    const [responseTimeThreshold, setResponseTimeThreshold] = useState(5000);
    const [newConfig, setNewConfig] = useState<any>({});

    // Crawl state
    const [crawlingId, setCrawlingId] = useState<string | null>(null);
    const [crawlFilter, setCrawlFilter] = useState<'all' | 'down' | 'redirect' | 'up'>('all');

    const fetchMonitors = useCallback(async (isPolling = false) => {
        try {
            if (!isPolling) setIsLoading(true);
            const res = await fetch('/api/monitor');
            const data = await res.json();
            setMonitors(data.monitors || []);
        } catch (err) {
            console.error('Failed to fetch monitors:', err);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Polling effect: if ANY monitor is CRAWLING, fetch every 3 seconds to update the progress bar
    useEffect(() => {
        const isAnyCrawling = monitors.some(m => m.status === 'CRAWLING');
        if (!isAnyCrawling) return;

        const pollTimer = setInterval(() => {
            fetchMonitors(true);
        }, 3000);
        return () => clearInterval(pollTimer);
    }, [monitors, fetchMonitors]);

    useEffect(() => { fetchMonitors(); }, [fetchMonitors]);

    const addMonitor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newName.trim() || !newUrl.trim()) return;
        setIsAdding(true);
        try {
            const res = await fetch('/api/monitor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: newName.trim(),
                    url: newUrl.trim(),
                    email: newEmail.trim(),
                    interval: newInterval,
                    type: newType,
                    config: JSON.stringify(newConfig),
                    responseTimeThreshold
                }),
            });
            if (res.ok) { setNewName(''); setNewUrl(''); setNewEmail(''); setShowAddForm(false); await fetchMonitors(); }
        } finally { setIsAdding(false); }
    };

    const deleteMonitor = async (id: string) => {
        try {
            const res = await fetch(`/api/monitor?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                await fetchMonitors();
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to delete monitor');
            }
        } catch (error) {
            console.error('Delete failed:', error);
            alert('An error occurred while deleting the monitor');
        } finally {
            setDeleteConfirmId(null);
        }
    };

    const toggleActive = async (id: string, currentActive: boolean) => {
        await fetch('/api/monitor', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, active: !currentActive }) });
        await fetchMonitors();
    };

    const updateInterval = async (id: string, interval: number) => {
        setUpdatingIntervalId(id);
        try {
            await fetch('/api/monitor', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, interval })
            });
            await fetchMonitors();
        } finally {
            setUpdatingIntervalId(null);
        }
    };

    const runCheck = async (monitorId?: string) => {
        if (monitorId) setCheckingId(monitorId); else setCheckingAll(true);
        try {
            await fetch('/api/monitor/check', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(monitorId ? { monitorId } : {}) });
            await fetchMonitors();
        } finally { setCheckingId(null); setCheckingAll(false); }
    };

    const runCrawl = async (monitorId: string) => {
        setCrawlingId(monitorId);
        setExpandedId(monitorId);
        try {
            await fetch('/api/monitor/crawl', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ monitorId, maxPages: 1000 }),
            });
            await fetchMonitors();
        } catch (err) {
            console.error('Crawl failed:', err);
        } finally {
            setCrawlingId(null);
        }
    };

    const addEmail = async (monitorId: string) => {
        const email = emailInputs[monitorId]?.trim();
        if (!email) return;
        setAddingEmail(monitorId);
        try {
            const res = await fetch('/api/monitor/emails', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ monitorId, email }) });
            if (res.ok) { setEmailInputs((prev) => ({ ...prev, [monitorId]: '' })); await fetchMonitors(); }
            else { const err = await res.json(); alert(err.error || 'Failed to add email'); }
        } finally { setAddingEmail(null); }
    };

    const removeEmail = async (emailId: string) => {
        await fetch(`/api/monitor/emails?id=${emailId}`, { method: 'DELETE' });
        await fetchMonitors();
    };

    const upCount = monitors.filter((m) => m.status === 'UP').length;
    const downCount = monitors.filter((m) => m.status === 'DOWN').length;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-display flex items-center gap-2">
                        <Activity className="w-6 h-6 text-emerald-400" />
                        Website Monitor
                    </h1>
                    <div className="flex gap-4 mt-2">
                        <button className="text-sm font-bold border-b-2 border-emerald-500 pb-1 text-emerald-400">Monitors</button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => runCheck()} disabled={checkingAll || monitors.length === 0}
                        className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white transition-all flex items-center gap-2 disabled:opacity-50">
                        {checkingAll ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        Check All Pages
                    </button>
                    <button onClick={() => setShowAddForm(!showAddForm)}
                        className="px-4 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 rounded-xl text-sm font-semibold text-white transition-all flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Add Website
                    </button>
                </div>
            </div>

            {/* Stats */}
            {monitors.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="glass-card p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-brand-500/10 flex items-center justify-center"><Globe className="w-6 h-6 text-brand-400" /></div>
                        <div><p className="text-2xl font-bold">{monitors.length}</p><p className="text-xs text-muted-foreground">Monitored Sites</p></div>
                    </div>
                    <div className="glass-card p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center"><Wifi className="w-6 h-6 text-emerald-400" /></div>
                        <div><p className="text-2xl font-bold text-emerald-400">{upCount}</p><p className="text-xs text-muted-foreground">Sites Up</p></div>
                    </div>
                    <div className="glass-card p-5 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center"><WifiOff className="w-6 h-6 text-red-400" /></div>
                        <div><p className="text-2xl font-bold text-red-400">{downCount}</p><p className="text-xs text-muted-foreground">Sites with Errors</p></div>
                    </div>
                </div>
            )}

            {/* Add Monitor Form */}
            <AnimatePresence>
                {showAddForm && (
                    <motion.form initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                        onSubmit={addMonitor} className="glass-card p-6 border border-brand-500/20 overflow-hidden">
                        <div className="flex items-center gap-2 mb-5"><Zap className="w-5 h-5 text-brand-400" /><h3 className="text-lg font-semibold">New Website Monitor</h3></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Site Name</label>
                                <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. My Portfolio"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all" required />
                            </div>
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Homepage URL</label>
                                <input type="text" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} placeholder="e.g. https://mysite.com"
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all" required />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Monitor Type</label>
                                <select value={newType} onChange={(e) => { setNewType(e.target.value); setNewConfig({}); }}
                                    className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all">
                                    <option value="HTTP">HTTP (Uptime & SEO)</option>
                                    <option value="API">API (JSON & Headers)</option>
                                    <option value="SSL">SSL / Certificate</option>
                                    <option value="DNS">DNS Record</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Alert Threshold (ms)</label>
                                <input type="number" value={responseTimeThreshold} onChange={(e) => setResponseTimeThreshold(Number(e.target.value))}
                                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all" />
                            </div>
                            <div>
                                <label className="block text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Check Interval</label>
                                <select value={newInterval} onChange={(e) => setNewInterval(Number(e.target.value))}
                                    className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all">
                                    <option value={5}>Every 5 minutes</option>
                                    <option value={10}>Every 10 minutes</option>
                                    <option value={15}>Every 15 minutes</option>
                                    <option value={30}>Every 30 minutes</option>
                                    <option value={60}>Every 60 minutes</option>
                                </select>
                            </div>
                        </div>

                        {/* Extra Config based on type */}
                        <AnimatePresence>
                            {newType === 'API' && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="space-y-4 mb-4 pt-4 border-t border-white/5">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Method</label>
                                            <select value={newConfig.method || 'GET'} onChange={(e) => setNewConfig({ ...newConfig, method: e.target.value })}
                                                className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-sm text-white">
                                                <option value="GET">GET</option>
                                                <option value="POST">POST</option>
                                                <option value="PUT">PUT</option>
                                                <option value="PATCH">PATCH</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Expected JSON Search String</label>
                                            <input type="text" value={newConfig.expectedJSON || ''} onChange={(e) => setNewConfig({ ...newConfig, expectedJSON: e.target.value })}
                                                placeholder="e.g. success: true" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Headers (JSON String)</label>
                                        <textarea value={newConfig.headersStr || ''} onChange={(e) => {
                                            const val = e.target.value;
                                            setNewConfig({ ...newConfig, headersStr: val });
                                            try { if (val) setNewConfig({ ...newConfig, headersStr: val, headers: JSON.parse(val) }); } catch (e) { }
                                        }} placeholder='{"Authorization": "Bearer ..."}' className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white h-20" />
                                    </div>
                                </motion.div>
                            )}

                            {newType === 'DNS' && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 pt-4 border-t border-white/5">
                                    <div>
                                        <label className="block text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Record Type</label>
                                        <select value={newConfig.recordType || 'A'} onChange={(e) => setNewConfig({ ...newConfig, recordType: e.target.value })}
                                            className="w-full px-4 py-3 bg-zinc-900 border border-white/10 rounded-xl text-sm text-white">
                                            <option value="A">A</option>
                                            <option value="AAAA">AAAA</option>
                                            <option value="MX">MX</option>
                                            <option value="TXT">TXT</option>
                                            <option value="CNAME">CNAME</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs text-muted-foreground mb-1.5 font-medium uppercase tracking-wider">Expected Value (Search String)</label>
                                        <input type="text" value={newConfig.expectedValue || ''} onChange={(e) => setNewConfig({ ...newConfig, expectedValue: e.target.value })}
                                            placeholder="e.g. 192.168.1.1" className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white" />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        <p className="text-xs text-muted-foreground mb-4 italic">Note: After adding, we will automatically discover and monitor all internal pages.</p>
                        <div className="flex gap-2">
                            <button type="submit" disabled={isAdding} className="px-5 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 rounded-xl text-sm font-semibold text-white flex items-center gap-2 disabled:opacity-50">
                                {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create Monitor
                            </button>
                            <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm text-white">Cancel</button>
                        </div>
                    </motion.form>
                )}
            </AnimatePresence>

            {/* Monitor List */}
            {!isLoading && monitors.length > 0 && (
                <div className="space-y-4">
                    {monitors.map((monitor) => {
                        const isExpanded = expandedId === monitor.id;
                        const isCrawling = crawlingId === monitor.id;
                        const totalSubpages = monitor.pages?.length || 0;
                        const redirectedSubpages = monitor.pages?.filter(p => p.checks[0]?.error?.startsWith('Redirected to')).length || 0;
                        const downSubpages = monitor.pages?.filter(p => !p.checks[0]?.isUp && !p.checks[0]?.error?.startsWith('Redirected to')).length || 0;
                        const upSubpages = totalSubpages - downSubpages - redirectedSubpages;

                        const filteredPages = monitor.pages?.filter((p) => {
                            const latestCheck = p.checks[0];
                            const isRedirect = latestCheck?.error?.startsWith('Redirected to');
                            if (crawlFilter === 'down') return !latestCheck?.isUp && !isRedirect;
                            if (crawlFilter === 'up') return latestCheck?.isUp;
                            if (crawlFilter === 'redirect') return isRedirect;
                            return true;
                        }) || [];

                        return (
                            <motion.div key={monitor.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                                className={cn('glass-card overflow-hidden border-l-4 transition-all',
                                    monitor.status === 'UP' ? 'border-emerald-500' : 'border-red-500',
                                    isExpanded && 'ring-1 ring-brand-500/30')}>

                                {/* Monitor Header */}
                                <div className="p-5">
                                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        <div className="flex items-center gap-4 flex-1 min-w-0">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <h3 className="font-bold text-lg text-white">{monitor.name}</h3>
                                                    <StatusBadge status={monitor.status} progress={monitor.crawlProgress} />
                                                    <span className="text-[10px] font-bold uppercase bg-brand-500/5 text-brand-300 px-3 py-1 rounded-full border border-brand-500/10 tracking-widest">
                                                        {monitor.type}
                                                    </span>
                                                    {totalSubpages > 0 && (
                                                        <span className="text-[10px] font-bold uppercase bg-brand-500/10 text-brand-400 px-2 py-0.5 rounded-full border border-brand-500/20 flex items-center gap-1">
                                                            <Link2 className="w-3 h-3" /> {totalSubpages} pages
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground font-mono mt-1 truncate">{monitor.url}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-4 flex-wrap sm:flex-nowrap">

                                            {/* Show Progress Bar during CRAWLING, else show standard stats */}
                                            {monitor.status === 'CRAWLING' ? (
                                                <div className="flex flex-col gap-1 w-48">
                                                    <div className="flex justify-between text-[10px] font-bold text-purple-400">
                                                        <span>Scanning Pages...</span>
                                                        <span>{monitor.crawlProgress}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                                        <motion.div
                                                            initial={{ width: 0 }}
                                                            animate={{ width: `${monitor.crawlProgress}%` }}
                                                            className="h-full bg-purple-500 shadow-[0_0_10px_#A855F7]"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Summary Stats Mini */}
                                                    {totalSubpages > 0 && (
                                                        <div className="flex items-center gap-3 bg-white/5 rounded-lg px-3 py-1.5 border border-white/5">
                                                            <div className="text-center">
                                                                <p className="text-[10px] text-muted-foreground uppercase leading-none mb-1">Up</p>
                                                                <p className="text-sm font-bold text-emerald-400 leading-none">{upSubpages}</p>
                                                            </div>
                                                            <div className="w-px h-6 bg-white/10" />
                                                            <div className="text-center">
                                                                <p className="text-[10px] text-muted-foreground uppercase leading-none mb-1">Down</p>
                                                                <p className={cn('text-sm font-bold leading-none', downSubpages > 0 ? 'text-red-400' : 'text-zinc-500')}>{downSubpages}</p>
                                                            </div>
                                                            <div className="w-px h-6 bg-white/10" />
                                                            <div className="text-center">
                                                                <p className="text-[10px] text-muted-foreground uppercase leading-none mb-1">Redir</p>
                                                                <p className={cn('text-sm font-bold leading-none', redirectedSubpages > 0 ? 'text-amber-400' : 'text-zinc-500')}>{redirectedSubpages}</p>
                                                            </div>
                                                        </div>
                                                    )}

                                                    <div className="hidden lg:block w-40"><UptimeBar checks={monitor.checks} /></div>
                                                </>
                                            )}

                                            <div className="flex items-center gap-1 ml-auto sm:ml-0">
                                                <button onClick={() => runCrawl(monitor.id)} disabled={isCrawling || monitor.status === 'CRAWLING'}
                                                    className="p-2.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-400 hover:text-purple-300 disabled:opacity-50 transition-all group" title="Discover & Scan All Pages">
                                                    {isCrawling || monitor.status === 'CRAWLING' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Scan className="w-4 h-4" />}
                                                    <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 text-xs font-semibold whitespace-nowrap ml-0 group-hover:ml-2">Scan Site</span>
                                                </button>
                                                <button onClick={() => runCheck(monitor.id)} disabled={checkingId === monitor.id}
                                                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-all" title="Quick Health Check">
                                                    {checkingId === monitor.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                                                </button>
                                                <button onClick={() => setExpandedId(isExpanded ? null : monitor.id)}
                                                    className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-semibold flex items-center gap-1 transition-all">
                                                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                    <span className="text-xs">Details</span>
                                                </button>
                                                {deleteConfirmId === monitor.id ? (
                                                    <div className="flex items-center gap-1 animate-in fade-in slide-in-from-right-2 duration-200">
                                                        <button onClick={() => deleteMonitor(monitor.id)} className="px-3 py-2 rounded-xl bg-red-500 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-red-600 transition-colors">
                                                            Confirm
                                                        </button>
                                                        <button onClick={() => setDeleteConfirmId(null)} className="px-3 py-2 rounded-xl bg-white/10 text-white text-[10px] font-bold uppercase tracking-wider hover:bg-white/20 transition-colors">
                                                            Cancel
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button onClick={() => setDeleteConfirmId(monitor.id)} className="p-2.5 rounded-xl bg-red-500/5 hover:bg-red-500/15 text-red-400/70 hover:text-red-400 transition-all ml-1" title="Delete Monitor">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap items-center justify-between gap-y-2 text-[11px] text-muted-foreground">
                                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                                            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Last full site check: {formatDate(monitor.lastChecked)}</span>
                                            <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> Alerts sent to {monitor.emails.length} recipient(s)</span>
                                            {monitor.lastResponseTime && <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Latency: {monitor.lastResponseTime}ms</span>}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <span className="font-medium uppercase tracking-wider text-[10px]">Interval:</span>
                                            <div className="relative">
                                                <select
                                                    value={monitor.interval}
                                                    onChange={(e) => updateInterval(monitor.id, Number(e.target.value))}
                                                    disabled={updatingIntervalId === monitor.id}
                                                    className="appearance-none bg-white/5 border border-white/10 rounded-lg text-white text-[10px] font-bold px-3 py-1.5 pr-8 focus:outline-none focus:ring-1 focus:ring-brand-500 cursor-pointer disabled:opacity-50"
                                                >
                                                    <option value={5}>5 mins</option>
                                                    <option value={10}>10 mins</option>
                                                    <option value={15}>15 mins</option>
                                                    <option value={20}>20 mins</option>
                                                    <option value={30}>30 mins</option>
                                                    <option value={60}>60 mins</option>
                                                </select>
                                                {updatingIntervalId === monitor.id ? (
                                                    <Loader2 className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 animate-spin text-muted-foreground" />
                                                ) : (
                                                    <ChevronDown className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Content */}
                                <AnimatePresence>
                                    {isExpanded && (
                                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                            className="border-t border-white/5 overflow-hidden bg-black/5">
                                            <div className="p-6 space-y-8">

                                                {/* ALL PAGES REPORT */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="text-sm font-bold flex items-center gap-2">
                                                            <FileSearch className="w-5 h-5 text-brand-400" />
                                                            Site-Wide Page Monitoring
                                                        </h4>
                                                        <div className="flex gap-1">
                                                            {(['all', 'down', 'redirect', 'up'] as const).map((f) => (
                                                                <button key={f} onClick={() => setCrawlFilter(f)}
                                                                    className={cn('px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg border transition-all',
                                                                        crawlFilter === f ? 'bg-brand-500/20 text-brand-300 border-brand-500/30' : 'bg-white/5 text-muted-foreground border-transparent hover:bg-white/10')}>
                                                                    {f}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {totalSubpages > 0 ? (
                                                        <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                                            {filteredPages.map((page, i) => {
                                                                const latest = page.checks[0];
                                                                const isRedirect = latest?.error?.startsWith('Redirected to');
                                                                const isDown = latest?.isUp === false && !isRedirect;

                                                                return (
                                                                    <div key={page.id} className={cn('flex items-center justify-between p-3 rounded-xl border group transition-all',
                                                                        isDown ? 'bg-red-500/10 border-red-500/30' : (isRedirect ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/5'))}>
                                                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                                                            <div className={cn('w-2 h-2 rounded-full mt-1.5 self-start', isDown ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]' : (isRedirect ? 'bg-amber-500 shadow-[0_0_8px_rgba(251,191,36,0.5)]' : 'bg-emerald-500'))} />
                                                                            <div className="min-w-0 flex-1">
                                                                                <div className="flex items-center gap-2">
                                                                                    <p className="text-xs font-mono text-zinc-300 truncate">{page.url}</p>
                                                                                    {page.seoScore !== null && (
                                                                                        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded leading-none border',
                                                                                            page.seoScore > 80 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                                                                                                (page.seoScore > 50 ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'))}>
                                                                                            SEO: {page.seoScore}
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                                {page.metaTitle && <p className="text-[10px] text-zinc-400 truncate mt-0.5">{page.metaTitle}</p>}
                                                                                <div className="flex items-center gap-3 mt-1">
                                                                                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', isDown ? 'text-red-400' : (isRedirect ? 'text-amber-400' : 'text-emerald-400'))}>
                                                                                        {isDown ? 'DOWN' : (isRedirect ? 'REDIRECT' : 'UP')}
                                                                                    </span>
                                                                                    <span className="text-[10px] text-muted-foreground">HTTP {latest?.statusCode || '—'}</span>
                                                                                    <span className="text-[10px] text-muted-foreground">{latest?.responseTime || 0}ms</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-4">
                                                                            {latest?.error && <div className={cn("hidden lg:block text-[10px] max-w-[200px] truncate", isRedirect ? "text-amber-400/80" : "text-red-400/80")}>{latest.error.replace(`[${page.url}] `, '')}</div>}
                                                                            <div className="w-16"><UptimeBar checks={page.checks} /></div>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                            {filteredPages.length === 0 && (
                                                                <div className="py-8 text-center bg-white/5 rounded-xl border border-dashed border-white/10">
                                                                    <p className="text-sm text-muted-foreground">No pages found matching filter.</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="bg-purple-500/5 border border-dashed border-purple-500/30 rounded-2xl p-10 text-center">
                                                            <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                                                <FileSearch className="w-8 h-8 text-purple-400" />
                                                            </div>
                                                            <h5 className="font-bold text-lg text-white mb-2">No Pages Discovered Yet</h5>
                                                            <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-6">
                                                                To monitor every page of your website, we first need to discover them by crawling your site.
                                                            </p>
                                                            <button onClick={() => runCrawl(monitor.id)} disabled={isCrawling}
                                                                className="px-6 py-3 bg-purple-500 hover:bg-purple-400 rounded-xl text-sm font-bold text-white shadow-lg shadow-purple-500/20 inline-flex items-center gap-2 transition-all">
                                                                {isCrawling ? <Loader2 className="w-5 h-5 animate-spin" /> : <Scan className="w-5 h-5" />}
                                                                Discover & Scan Site Pages
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/5">
                                                    {/* Email Management */}
                                                    <div>
                                                        <h4 className="text-sm font-bold flex items-center gap-2 mb-4">
                                                            <MailPlus className="w-5 h-5 text-emerald-400" /> Alert Recipient List
                                                        </h4>
                                                        <div className="flex gap-2 mb-4">
                                                            <input type="text" value={emailInputs[monitor.id] || ''} onChange={(e) => setEmailInputs((prev) => ({ ...prev, [monitor.id]: e.target.value }))}
                                                                placeholder="e.g. alerts@mysite.com, dev@mysite.com"
                                                                className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-muted-foreground focus:ring-2 focus:ring-brand-500/50"
                                                                onKeyDown={(e) => { if (e.key === 'Enter') addEmail(monitor.id); }} />
                                                            <button onClick={() => addEmail(monitor.id)} disabled={addingEmail === monitor.id || !emailInputs[monitor.id]?.trim()}
                                                                className="px-4 py-2.5 bg-brand-500 text-white rounded-xl text-sm font-bold disabled:opacity-50">
                                                                {addingEmail === monitor.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Add'}
                                                            </button>
                                                        </div>
                                                        <div className="space-y-2">
                                                            {monitor.emails.map((em) => (
                                                                <div key={em.id} className="flex items-center justify-between bg-white/5 rounded-lg border border-white/5 px-4 py-2 hover:bg-white/[0.08] transition-all">
                                                                    <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-brand-400" /><span className="text-sm text-zinc-300">{em.email}</span></div>
                                                                    <button onClick={() => removeEmail(em.id)} className="p-1 px-2 text-[10px] font-bold uppercase text-red-500/50 hover:text-red-400 hover:bg-red-500/10 rounded">Remove</button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* Main Site History */}
                                                    <div>
                                                        <h4 className="text-sm font-bold flex items-center gap-2 mb-4"><History className="w-5 h-5 text-brand-400" /> Site Availability Logs</h4>
                                                        <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                                                            {monitor.checks.map((check) => (
                                                                <div key={check.id} className="flex items-center justify-between bg-black/20 rounded-lg p-3 text-xs border border-white/5">
                                                                    <div className="flex items-center gap-3">
                                                                        {check.isUp ? <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> : <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />}
                                                                        <span className={cn('font-bold', check.isUp ? 'text-emerald-400' : 'text-red-400')}>{check.isUp ? 'AVAILABLE' : 'ERROR'}</span>
                                                                        <span className="text-muted-foreground">{check.statusCode || '—'}</span>
                                                                    </div>
                                                                    <span className="text-[10px] text-muted-foreground">{formatDate(check.checkedAt)}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            )
            }

            {/* Empty State */}
            {
                !isLoading && monitors.length === 0 && (
                    <div className="glass-card py-20 text-center">
                        <div className="w-20 h-20 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Activity className="w-10 h-10 text-brand-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3">No Websites Monitored</h3>
                        <p className="text-muted-foreground max-w-md mx-auto mb-8">
                            Link your websites to Seoptima Monitor. We&apos;ll discover every page and check their health around the clock.
                        </p>
                        <button onClick={() => setShowAddForm(true)} className="px-8 py-3 bg-brand-500 hover:bg-brand-400 text-white rounded-2xl text-lg font-bold shadow-xl shadow-brand-500/20 transition-all">
                            Monitor Your First Site
                        </button>
                    </div>
                )
            }
        </div >
    );
}
