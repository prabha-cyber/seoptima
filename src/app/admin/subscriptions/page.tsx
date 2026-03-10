'use client';

import { useState, useEffect } from 'react';
import {
    CreditCard, CheckCircle2, AlertTriangle, Clock,
    ArrowUpRight, Users, Zap, Shield, Search, Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

const PLANS = [
    { name: 'FREE', color: 'bg-muted-foreground/10 text-muted-foreground', limitSites: 1, limitKeywords: 10 },
    { name: 'STARTER', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20', limitSites: 3, limitKeywords: 50 },
    { name: 'PRO', color: 'bg-accent-500/10 text-accent-400 border-accent-500/20', limitSites: 10, limitKeywords: 200 },
    { name: 'AGENCY', color: 'bg-purple-500/10 text-purple-400 border-purple-500/20', limitSites: 50, limitKeywords: 1000 },
];

export default function SubscriptionManagementPage() {
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        async function fetchSubscriptions() {
            try {
                const res = await fetch('/api/admin/subscriptions');
                const data = await res.json();
                if (res.ok) setSubscriptions(data);
            } catch (error) {
                console.error('Failed to fetch subscriptions:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchSubscriptions();
    }, []);

    const filtered = subscriptions.filter(s =>
        s.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
        s.user?.name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-display">Subscription Management</h1>
                    <p className="text-muted-foreground mt-1">Manage user plans, billing status, and platform revenue.</p>
                </div>
                <button className="btn-primary py-2 text-sm">
                    <Zap className="w-4 h-4" />
                    Manage Plans
                </button>
            </div>

            {/* Plan Overview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {PLANS.map(plan => (
                    <div key={plan.name} className="glass-card p-5">
                        <div className="flex items-center justify-between mb-3">
                            <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase border", plan.color)}>
                                {plan.name}
                            </span>
                            <Users className="w-4 h-4 text-muted-foreground/40" />
                        </div>
                        <p className="text-2xl font-bold">
                            {subscriptions.filter(s => s.plan === plan.name).length}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">Active Users</p>
                    </div>
                ))}
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search by user email or name..."
                    className="input-base pl-10 w-full"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Subscriptions Table */}
            <div className="glass-card overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-white/8 bg-white/2">
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">User</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Plan</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Billing Cycle</th>
                            <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/4">
                        {isLoading ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">Loading...</td></tr>
                        ) : filtered.length === 0 ? (
                            <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">No subscriptions found.</td></tr>
                        ) : filtered.map(sub => (
                            <tr key={sub.id} className="hover:bg-white/2 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-brand-500/20 flex items-center justify-center text-brand-400 font-bold text-xs uppercase">
                                            {sub.user?.name?.[0] || 'U'}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-medium truncate">{sub.user?.name || 'Anonymous'}</p>
                                            <p className="text-[10px] text-muted-foreground truncate">{sub.user?.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={cn(
                                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                                        PLANS.find(p => p.name === sub.plan)?.color || 'bg-white/5 border-white/10'
                                    )}>
                                        {sub.plan}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-1.5">
                                        {sub.status === 'ACTIVE' ? (
                                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                                        ) : (
                                            <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                                        )}
                                        <span className={cn("text-xs font-medium", sub.status === 'ACTIVE' ? "text-green-400" : "text-yellow-400")}>
                                            {sub.status}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="text-xs">
                                        <p className="text-foreground">Renews on {sub.currentPeriodEnd ? new Date(sub.currentPeriodEnd).toLocaleDateString() : 'N/A'}</p>
                                        <p className="text-[10px] text-muted-foreground">{sub.stripeSubscriptionId ? 'Stripe Managed' : 'Manual Plan'}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-xs font-semibold text-brand-400 hover:text-brand-300 transition-colors opacity-0 group-hover:opacity-100">
                                        Update Plan
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
