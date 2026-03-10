'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard, Search, Filter, Shield, Settings,
    CheckCircle2, XCircle, AlertCircle, Clock,
    DollarSign, Globe, ArrowDownRight, ArrowUpRight,
    TrendingUp, ExternalLink, Key, Lock, Eye, EyeOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function PaymentsManagementPage() {
    const [payments, setPayments] = useState<any[]>([]);
    const [gateways, setGateways] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'history' | 'gateways'>('history');
    const [showKey, setShowKey] = useState<string | null>(null);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    async function fetchData() {
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/payments?type=${activeTab}`);
            const data = await res.json();
            if (res.ok) {
                if (activeTab === 'history') setPayments(data);
                else setGateways(data);
            }
        } catch (err) {
            console.error('Failed to fetch data');
        } finally {
            setIsLoading(false);
        }
    }

    const handleGatewayUpdate = async (gateway: any) => {
        try {
            const res = await fetch('/api/admin/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(gateway),
            });
            if (res.ok) alert('Gateway updated successfully');
        } catch (err) {
            alert('Failed to update gateway');
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-display tracking-tight text-white">Revenue & Gateways</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Monitor platform revenue and configure payment processing.</p>
                </div>
                <div className="flex items-center gap-2 p-1 bg-white/5 rounded-xl border border-white/10">
                    <button
                        onClick={() => setActiveTab('history')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2",
                            activeTab === 'history' ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" : "text-muted-foreground hover:text-white"
                        )}
                    >
                        <Clock className="w-4 h-4" /> Payment History
                    </button>
                    <button
                        onClick={() => setActiveTab('gateways')}
                        className={cn(
                            "px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2",
                            activeTab === 'gateways' ? "bg-brand-500 text-white shadow-lg shadow-brand-500/20" : "text-muted-foreground hover:text-white"
                        )}
                    >
                        <Shield className="w-4 h-4" /> Gateway Settings
                    </button>
                </div>
            </div>

            {activeTab === 'history' ? (
                <div className="space-y-6">
                    {/* Revenue Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[
                            { label: 'Total Revenue', value: '$12,450', trend: '+12%', icon: TrendingUp, color: 'text-green-400', bg: 'bg-green-500/10' },
                            { label: 'Active Subscriptions', value: '142', trend: '+8%', icon: CreditCard, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                            { label: 'Pending Orders', value: '12', trend: '-2%', icon: Clock, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                            { label: 'Refunded', value: '$450', trend: '0%', icon: ArrowDownRight, color: 'text-red-400', bg: 'bg-red-500/10' },
                        ].map((stat, i) => (
                            <div key={i} className="glass-card p-4 relative overflow-hidden group hover:border-white/20 transition-all">
                                <div className={cn("absolute -right-4 -top-4 w-16 h-16 rounded-full blur-2xl opacity-20", stat.bg)}></div>
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                                    <stat.icon className={cn("w-4 h-4", stat.color)} />
                                </div>
                                <div className="flex items-baseline gap-2">
                                    <h4 className="text-2xl font-bold font-display">{stat.value}</h4>
                                    <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded", stat.trend.startsWith('+') ? "text-green-400 bg-green-500/5" : "text-red-400 bg-red-500/5")}>{stat.trend}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="glass-card overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-white/8 bg-white/2">
                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Order / Customer</th>
                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Discount</th>
                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-center">Status</th>
                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Method</th>
                                        <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/4">
                                    {isLoading ? (
                                        <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">Updating history...</td></tr>
                                    ) : payments.length === 0 ? (
                                        <tr><td colSpan={6} className="px-6 py-12 text-center text-muted-foreground italic">No payment records found.</td></tr>
                                    ) : payments.map((p) => (
                                        <tr key={p.id} className="hover:bg-white/2 transition-colors group text-sm">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-blue-400 font-bold border border-white/10">
                                                        {p.order?.customerName?.[0]?.toUpperCase() || 'U'}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="font-bold text-white truncate max-w-[150px]">{p.order?.customerName || 'Anonymous'}</p>
                                                        <p className="text-[11px] text-muted-foreground truncate">{p.order?.customerEmail}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 font-mono font-bold text-white">
                                                {p.amount.toLocaleString('en-US', { style: 'currency', currency: p.currency })}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {p.order?.discount ? (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded">
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        {p.order?.couponCode}
                                                    </span>
                                                ) : <span className="text-muted-foreground/30">—</span>}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <div className={cn(
                                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase",
                                                    p.status === 'SUCCESS' || p.status === 'COMPLETED' ? "bg-green-500/10 text-green-400" :
                                                        p.status === 'PENDING' ? "bg-orange-500/10 text-orange-400" : "bg-red-500/10 text-red-400"
                                                )}>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", p.status === 'SUCCESS' || p.status === 'COMPLETED' ? "bg-green-500 shadow-[0_0_5px_rgba(34,197,94,1)] animate-pulse" : "bg-red-500")} />
                                                    {p.status}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-widest">
                                                    <CreditCard className="w-3.5 h-3.5" /> {p.provider}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-xs text-muted-foreground">
                                                {new Date(p.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {isLoading ? (
                        <div className="col-span-full py-20 text-center"><div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin mx-auto" /></div>
                    ) : gateways.length === 0 ? (
                        <div className="col-span-full glass-card p-12 text-center border-dashed">
                            <Settings className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-muted-foreground">No gateways configured</h3>
                            <p className="text-sm text-muted-foreground/60 mt-1">Add your first payment provider in the schema to start processing transactions.</p>
                        </div>
                    ) : gateways.map((gw) => (
                        <div key={gw.id} className="glass-card p-6 flex flex-col group hover:border-brand-500/30 transition-all">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 flex items-center justify-center border border-white/5 ring-1 ring-white/10">
                                        <CreditCard className="w-6 h-6 text-brand-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold tracking-tight text-white">{gw.name}</h3>
                                        <div className={cn(
                                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase mt-1 tracking-widest",
                                            gw.isLive ? "bg-green-400/10 text-green-400 border border-green-500/20" : "bg-orange-400/10 text-orange-400 border border-orange-500/20"
                                        )}>
                                            {gw.isLive ? <Globe className="w-2.5 h-2.5" /> : <Shield className="w-2.5 h-2.5" />}
                                            {gw.isLive ? 'Live Mode' : 'Sandbox Mode'}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center cursor-pointer" onClick={() => handleGatewayUpdate({ ...gw, isEnabled: !gw.isEnabled })}>
                                    <div className={cn("w-12 h-6 rounded-full relative p-1 transition-all", gw.isEnabled ? "bg-brand-500" : "bg-white/10")}>
                                        <div className={cn("w-4 h-4 bg-white rounded-full absolute transition-all", gw.isEnabled ? "right-1" : "left-1")}></div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Public Key / Client ID</label>
                                    <div className="relative group/key">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-400/50" />
                                        <input
                                            type={showKey === `${gw.id}-pub` ? 'text' : 'password'}
                                            readOnly
                                            className="input-base w-full pl-10 pr-10 text-xs font-mono bg-black/20"
                                            value={gw.publicKey || ''}
                                        />
                                        <button
                                            onClick={() => setShowKey(showKey === `${gw.id}-pub` ? null : `${gw.id}-pub`)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:text-white text-muted-foreground/50 transition-colors"
                                        >
                                            {showKey === `${gw.id}-pub` ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground px-1">Secret Key</label>
                                    <div className="relative group/key">
                                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-accent-400/50" />
                                        <input
                                            type={showKey === `${gw.id}-sec` ? 'text' : 'password'}
                                            readOnly
                                            className="input-base w-full pl-10 pr-10 text-xs font-mono bg-black/20"
                                            value={gw.secretKey || ''}
                                        />
                                        <button
                                            onClick={() => setShowKey(showKey === `${gw.id}-sec` ? null : `${gw.id}-sec`)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:text-white text-muted-foreground/50 transition-colors"
                                        >
                                            {showKey === `${gw.id}-sec` ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                                <div className="text-[10px] text-muted-foreground italic flex items-center gap-2">
                                    <Clock className="w-3 h-3" /> Last updated: {new Date(gw.updatedAt).toLocaleTimeString()}
                                </div>
                                <button className="btn-secondary py-1.5 px-4 text-xs font-bold border-brand-500/10 hover:border-brand-500/30 group/btn">
                                    Configure API
                                    <ExternalLink className="w-3 h-3 ml-2 opacity-30 group-hover/btn:opacity-100 transition-opacity" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
