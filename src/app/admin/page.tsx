'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Users, Globe, Search, BarChart3, Key, AlertTriangle,
    TrendingUp, ArrowUpRight, ArrowDownRight, Activity,
    Clock, Plus, CheckCircle2, LayoutDashboard, Database,
    Server, WifiHigh, CreditCard, ChevronRight, Building2, Zap, Newspaper, Bot,
    FileText, Bell
} from 'lucide-react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, AreaChart, Area,
    BarChart, Bar
} from 'recharts';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function AdminDashboardPage() {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [featureFlags, setFeatureFlags] = useState<Record<string, boolean>>({});

    useEffect(() => {
        async function fetchStats() {
            try {
                const res = await fetch('/api/admin/stats');
                const statsData = await res.json();
                if (res.ok) setData(statsData);
            } catch (error) {
                console.error('Failed to fetch admin stats:', error);
            } finally {
                setIsLoading(false);
            }
        }

        async function fetchFeatures() {
            try {
                const res = await fetch('/api/admin/features');
                if (res.ok) {
                    const flags = await res.json();
                    const statusMap: Record<string, boolean> = {};
                    flags.forEach((flag: any) => {
                        statusMap[flag.name] = flag.enabled;
                    });
                    setFeatureFlags(statusMap);
                }
            } catch (error) {
                console.error('Failed to fetch feature flags');
            }
        }

        fetchStats();
        fetchFeatures();
    }, []);

    const toggleFeature = async (href: string) => {
        const newStatus = !featureFlags[href] && featureFlags[href] !== false ? false : !featureFlags[href];
        const updatedStatus = featureFlags[href] === undefined ? false : !featureFlags[href];

        // Optimistic UI update
        setFeatureFlags(prev => ({
            ...prev,
            [href]: updatedStatus
        }));

        try {
            const res = await fetch('/api/admin/features', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: href, enabled: updatedStatus })
            });

            if (!res.ok) {
                setFeatureFlags(prev => ({ ...prev, [href]: !updatedStatus }));
                alert('Failed to save feature status');
            }
        } catch (error) {
            setFeatureFlags(prev => ({ ...prev, [href]: !updatedStatus }));
            alert('Error updating feature status');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const stats = data?.stats || {};
    const charts = data?.charts || {};
    const activities = data?.activities || {};
    const topWebsites = data?.topWebsites || [];
    const systemStatus = data?.systemStatus || {};

    const statCards = [
        { label: 'Total Users', value: stats.totalUsers || 0, icon: Users, color: 'text-blue-400', trend: '', trendUp: true, bg: 'bg-blue-500/10' },
        { label: 'Active Users', value: stats.activeUsers || 0, icon: Activity, color: 'text-green-400', trend: '', trendUp: true, bg: 'bg-green-500/10' },
        { label: 'Websites Added', value: stats.totalWebsites || 0, icon: Globe, color: 'text-purple-400', trend: '', trendUp: true, bg: 'bg-purple-500/10' },
        { label: 'SEO Audits', value: stats.totalAudits || 0, icon: Search, color: 'text-orange-400', trend: '', trendUp: true, bg: 'bg-orange-500/10' },
        { label: 'Keywords Tracked', value: stats.totalKeywords || 0, icon: Key, color: 'text-brand-400', trend: '', trendUp: true, bg: 'bg-brand-500/10' },
        { label: 'System Errors', value: stats.systemErrors || 0, icon: AlertTriangle, color: 'text-red-400', trend: '', trendUp: true, bg: 'bg-red-500/10' },
    ];

    const quickActions = [
        { label: 'Add New User', icon: Plus, href: '/admin/users/new', color: 'hover:bg-blue-500/10 hover:text-blue-400' },
        { label: 'Agency Management', icon: Building2, href: '/admin/agencies', color: 'hover:bg-purple-500/10 hover:text-purple-400' },
        { label: 'Coupons & Discounts', icon: CreditCard, href: '/admin/coupons', color: 'hover:bg-brand-500/10 hover:text-brand-400' },
        { label: 'Payments & Revenue', icon: CreditCard, href: '/admin/payments', color: 'hover:bg-green-500/10 hover:text-green-400' },
        { label: 'Run Website Audit', icon: Search, href: '/admin/audits/new', color: 'hover:bg-orange-500/10 hover:text-orange-400' },
    ];

    return (
        <div className="space-y-8 animate-fade-in relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-display tracking-tight bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">Platform Overview</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Real-time metrics, system health, and administrative controls.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn-secondary py-2 px-4 shadow-xl shadow-black/20 text-sm whitespace-nowrap">Download Report</button>
                    <button className="btn-primary py-2 px-4 shadow-xl shadow-brand-500/20 text-sm whitespace-nowrap" onClick={() => window.location.reload()}>Refresh Data</button>
                </div>
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {statCards.map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="glass-card p-5 hover:border-white/20 transition-all group overflow-hidden relative"
                    >
                        {/* Decorative background blur */}
                        <div className={cn("absolute -right-6 -top-6 w-24 h-24 rounded-full blur-2xl opacity-20", stat.bg)}></div>

                        <div className="flex items-center justify-between mb-4 relative z-10">
                            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors shadow-inner">
                                <stat.icon className={cn("w-5 h-5", stat.color)} />
                            </div>
                            {stat.trend && (
                                <div className={cn(
                                    "flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-full",
                                    stat.trendUp ? "bg-green-500/10 text-green-400 border border-green-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"
                                )}>
                                    {stat.trendUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                    {stat.trend}
                                </div>
                            )}
                        </div>
                        <h3 className="text-3xl font-bold tracking-tight mb-1 relative z-10">{stat.value.toLocaleString()}</h3>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider relative z-10">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Main Charts Area */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Feature Management Controls */}
                    <div className="glass-card p-6 border-brand-500/20 bg-brand-500/[0.02]">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-brand-400" />
                                    Global Feature Management
                                </h3>
                                <p className="text-xs text-muted-foreground mt-1">Enable or disable platform features globally for all users.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                { label: 'SEO Audits', href: '/admin/audits', icon: Search },
                                { label: 'Keyword Tools', href: '/admin/keywords', icon: Key },
                                { label: 'Competitor Data', href: '/admin/competitors', icon: BarChart3 },
                                { label: 'Backlink Analysis', href: '/admin/backlinks', icon: Activity },
                                { label: 'Reports System', href: '/admin/reports', icon: FileText },
                                { label: 'API Access', href: '/admin/api', icon: Database },
                                { label: 'Subscriptions', href: '/admin/subscriptions', icon: CreditCard },
                                { label: 'Notifications', href: '/admin/notifications', icon: Bell },
                                { label: 'Uptime Monitoring', href: '/admin/monitor', icon: Activity },
                                { label: 'Automation', href: '/admin/automation', icon: Bot },
                                { label: 'Blog / CMS', href: '/admin/cms', icon: Newspaper },
                            ].map((feature) => (
                                <div key={feature.href} className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="p-1.5 rounded-lg bg-white/5">
                                            <feature.icon className="w-4 h-4 text-muted-foreground" />
                                        </div>
                                        <span className="text-sm font-medium">{feature.label}</span>
                                    </div>
                                    <div
                                        onClick={() => toggleFeature(feature.href)}
                                        className={cn(
                                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                                            featureFlags[feature.href] !== false ? 'bg-brand-500' : 'bg-white/20'
                                        )}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={cn(
                                                "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                                                featureFlags[feature.href] !== false ? 'translate-x-4' : 'translate-x-0'
                                            )}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* User Growth & Website Activity Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="glass-card p-6 border-white/10">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-base font-semibold flex items-center gap-2">
                                        <Users className="w-4 h-4 text-blue-400" />
                                        User Growth
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1">New registrations (7 days)</p>
                                </div>
                            </div>
                            <div className="h-[240px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={charts.dailyUsers} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                                        <XAxis dataKey="name" stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                        <YAxis stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                                        <Tooltip
                                            contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(8px)' }}
                                            itemStyle={{ color: '#fff', fontSize: '13px', fontWeight: 500 }}
                                            cursor={{ stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 }}
                                        />
                                        <Area type="monotone" dataKey="value" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUsers)" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="glass-card p-6 border-white/10">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-base font-semibold flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-purple-400" />
                                        Website Activity
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1">Websites added (7 days)</p>
                                </div>
                            </div>
                            <div className="h-[240px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={charts.websiteActivity} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                                        <XAxis dataKey="name" stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                        <YAxis stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                                        <Tooltip
                                            contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(8px)' }}
                                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                        />
                                        <Bar dataKey="value" fill="#a855f7" radius={[4, 4, 0, 0]} barSize={32} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* API & Audit Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="glass-card p-6 border-white/10">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-base font-semibold flex items-center gap-2">
                                        <Search className="w-4 h-4 text-orange-400" />
                                        SEO Audit Activity
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1">Audits performed (7 days)</p>
                                </div>
                            </div>
                            <div className="h-[240px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={charts.seoAudits} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="colorAudits" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                                        <XAxis dataKey="name" stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                        <YAxis stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                                        <Tooltip
                                            contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(8px)' }}
                                        />
                                        <Area type="monotone" dataKey="value" stroke="#f97316" fillOpacity={1} fill="url(#colorAudits)" strokeWidth={3} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        <div className="glass-card p-6 border-white/10">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-base font-semibold flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4 text-cyan-400" />
                                        API Usage
                                    </h3>
                                    <p className="text-xs text-muted-foreground mt-1">External API requests</p>
                                </div>
                            </div>
                            <div className="h-[240px] w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={charts.apiUsage} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                                        <XAxis dataKey="name" stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                                        <YAxis stroke="#ffffff40" fontSize={11} tickLine={false} axisLine={false} dx={-10} />
                                        <Tooltip
                                            contentStyle={{ background: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(8px)' }}
                                        />
                                        <Line type="monotone" dataKey="value" stroke="#22d3ee" strokeWidth={3} dot={{ fill: '#22d3ee', strokeWidth: 2, r: 4 }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Top Websites Table */}
                    <div className="glass-card overflow-hidden border-white/10">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <h3 className="text-base font-semibold">Top Websites Analyzed</h3>
                            <Link href="/admin/websites" className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1 font-medium">
                                View All <ChevronRight className="w-3 h-3" />
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-muted-foreground bg-white/5 uppercase border-b border-white/5">
                                    <tr>
                                        <th className="px-6 py-4 font-medium tracking-wider">Website</th>
                                        <th className="px-6 py-4 font-medium tracking-wider">Owner</th>
                                        <th className="px-6 py-4 font-medium tracking-wider text-center">Audits</th>
                                        <th className="px-6 py-4 font-medium tracking-wider text-center">Keywords</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {topWebsites.map((site: any) => (
                                        <tr key={site.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4 font-medium text-white flex items-center gap-3">
                                                <div className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center text-purple-400">
                                                    <Globe className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <p>{site.name}</p>
                                                    <p className="text-[10px] text-muted-foreground mt-0.5">{site.domain || 'Internal'}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-muted-foreground">{site.user?.name || site.user?.email || 'Unknown'}</td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center bg-white/10 px-2.5 py-1 rounded-full text-xs font-medium text-white">
                                                    {site._count?.seoReports || 0}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="inline-flex items-center justify-center bg-brand-500/10 px-2.5 py-1 rounded-full text-xs font-medium text-brand-300">
                                                    {site._count?.keywords || 0}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                    {topWebsites.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-muted-foreground">No websites found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Sidebar Area */}
                <div className="space-y-6">
                    {/* System Status */}
                    <div className="glass-card p-6 border-white/10 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 via-green-500 to-brand-500"></div>
                        <h3 className="text-base font-semibold mb-6 flex items-center justify-between">
                            <span>System Status</span>
                            <span className="flex items-center gap-1.5 text-xs font-medium text-green-400 bg-green-500/10 px-2 py-1 rounded-md">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                Healthy
                            </span>
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <Server className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">App Server</span>
                                </div>
                                <span className="text-xs text-green-400">{systemStatus.server || 'Operational'}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <Database className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Database</span>
                                </div>
                                <span className="text-xs text-green-400">{systemStatus.database || 'Operational'}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5">
                                <div className="flex items-center gap-3">
                                    <WifiHigh className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">External APIs</span>
                                </div>
                                <span className="text-xs text-green-400">{systemStatus.api || 'Operational'}</span>
                            </div>
                            <div className="pt-3 border-t border-white/10 flex justify-between items-center text-xs text-muted-foreground">
                                <span>Network Latency</span>
                                <span className="font-mono bg-white/5 px-2 py-0.5 rounded text-white">{systemStatus.latency || '24ms'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="glass-card p-6 border-white/10">
                        <h3 className="text-base font-semibold mb-4">Quick Actions</h3>
                        <div className="space-y-2">
                            {quickActions.map((action, i) => (
                                <Link
                                    key={i}
                                    href={action.href}
                                    className={cn(
                                        "w-full flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/5 transition-all text-sm font-medium",
                                        action.color
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <action.icon className="w-4 h-4 opacity-70" />
                                        {action.label}
                                    </div>
                                    <ChevronRight className="w-4 h-4 opacity-40" />
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Recent Activity List */}
                    <div className="glass-card p-6 border-white/10 flex-1">
                        <h3 className="text-base font-semibold mb-6">Recent Activity Highlights</h3>

                        <div className="space-y-4">
                            {/* Subscriptions */}
                            {activities.subscriptions?.slice(0, 2).map((sub: any) => (
                                <div key={`sub-${sub.id}`} className="flex items-start gap-3 relative before:absolute before:left-[11px] before:top-8 before:bottom-[-20px] before:w-px before:bg-white/10 last:before:hidden">
                                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-400 mt-0.5 z-10 p-1 ring-4 ring-slate-900 border border-green-500/30">
                                        <TrendingUp className="w-3 h-3" />
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <p className="text-sm">
                                            <span className="font-medium text-white">{sub.user?.name || 'User'}</span> upgraded to <span className="font-bold text-brand-400">{sub.plan}</span> plan.
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {new Date(sub.updatedAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {/* Audits */}
                            {activities.newAudits?.slice(0, 2).map((audit: any) => (
                                <div key={`audit-${audit.id}`} className="flex items-start gap-3 relative before:absolute before:left-[11px] before:top-8 before:bottom-[-20px] before:w-px before:bg-white/10 last:before:hidden">
                                    <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 mt-0.5 z-10 p-1 ring-4 ring-slate-900 border border-orange-500/30">
                                        <Search className="w-3 h-3" />
                                    </div>
                                    <div className="flex-1 pb-4">
                                        <p className="text-sm">
                                            SEO Audit completed for <span className="font-medium text-white">{audit.website?.name}</span> (Score: <span className="text-orange-400">{audit.overallScore}</span>)
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {new Date(audit.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}

                            {/* Users */}
                            {activities.newUsers?.slice(0, 2).map((user: any) => (
                                <div key={`user-${user.id}`} className="flex items-start gap-3 relative before:absolute before:left-[11px] before:top-8 before:bottom-[-20px] before:w-px before:bg-white/10 last:before:hidden">
                                    <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 mt-0.5 z-10 p-1 ring-4 ring-slate-900 border border-blue-500/30">
                                        <Users className="w-3 h-3" />
                                    </div>
                                    <div className="flex-1 pb-1">
                                        <p className="text-sm">
                                            New user registered: <span className="font-medium text-white">{user.name || user.email}</span>
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {new Date(user.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
