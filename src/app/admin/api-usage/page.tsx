'use client';

import { useState } from 'react';
import {
    Zap, Cpu, BarChart3, Clock, Shield,
    AlertTriangle, Server, Database, Globe,
    Activity, ArrowUpRight, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function APIManagementPage() {
    const stats = [
        { label: 'Total Requests (24h)', value: '1.2M', trend: '+12%', color: 'text-brand-400' },
        { label: 'Success Rate', value: '99.9%', trend: 'Stable', color: 'text-green-400' },
        { label: 'Avg Latency', value: '142ms', trend: '-5ms', color: 'text-blue-400' },
        { label: 'Error Rate', value: '0.08%', trend: '-2%', color: 'text-red-400' },
    ];

    const apiKeys = [
        { id: '1', name: 'Main Production', usage: '850k', limit: '1M', status: 'ACTIVE' },
        { id: '2', name: 'Development', usage: '12k', limit: '50k', status: 'ACTIVE' },
        { id: '3', name: 'Test Key', usage: '0', limit: '5k', status: 'INACTIVE' },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold font-display">API Management</h1>
                <p className="text-muted-foreground mt-1">Monitor API health, usage quotas, and manage developer keys.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat) => (
                    <div key={stat.label} className="glass-card p-5">
                        <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
                        <div className="flex items-end justify-between">
                            <p className={cn("text-2xl font-bold", stat.color)}>{stat.value}</p>
                            <span className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-muted-foreground">{stat.trend}</span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 glass-card overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/8 bg-white/2 flex justify-between items-center">
                        <h2 className="font-semibold text-sm">Active API Keys</h2>
                        <button className="text-xs text-brand-400">+ Generate Key</button>
                    </div>
                    <table className="w-full text-left">
                        <tbody className="divide-y divide-white/4">
                            {apiKeys.map(key => (
                                <tr key={key.id} className="hover:bg-white/2 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center text-muted-foreground">
                                                <Key className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{key.name}</p>
                                                <p className="text-[10px] text-muted-foreground font-mono">key_live_****{key.id}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-brand-500 rounded-full"
                                                style={{ width: `${(parseInt(key.usage) / parseInt(key.limit)) * 100}%` }}
                                            />
                                        </div>
                                        <p className="text-[10px] text-muted-foreground mt-1">{key.usage} / {key.limit} reqs</p>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <span className={cn(
                                            "px-2 py-0.5 rounded text-[10px] font-bold",
                                            key.status === 'ACTIVE' ? "text-green-400 bg-green-500/10" : "text-muted-foreground bg-white/5"
                                        )}>
                                            {key.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="glass-card p-6">
                    <h2 className="font-semibold text-sm mb-4">Endpoints Health</h2>
                    <div className="space-y-4">
                        {[
                            { name: '/api/v1/audit', status: 'Healthy', latency: '45ms' },
                            { name: '/api/v1/keywords', status: 'Healthy', latency: '120ms' },
                            { name: '/api/v1/analyze', status: 'Warning', latency: '850ms' },
                            { name: '/api/v1/user', status: 'Healthy', latency: '32ms' },
                        ].map(ep => (
                            <div key={ep.name} className="flex items-center justify-between">
                                <span className="text-xs font-mono text-muted-foreground">{ep.name}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-muted-foreground">{ep.latency}</span>
                                    <div className={cn(
                                        "w-2 h-2 rounded-full",
                                        ep.status === 'Healthy' ? "bg-green-500" : "bg-yellow-500"
                                    )} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function Key({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4" /><path d="m21 2-9.6 9.6" /><circle cx="7.5" cy="15.5" r="5.5" /></svg>
    )
}
