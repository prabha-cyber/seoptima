'use client';

import { useState } from 'react';
import {
    Shield, Lock, ShieldAlert, ShieldCheck,
    UserX, Globe, AlertTriangle, AlertCircle,
    Eye, MoreHorizontal, UserCheck, Ban
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SecurityManagementPage() {
    const alerts = [
        { id: 1, type: 'CRITICAL', message: 'Brute force attempt detected on Admin Login', ip: '192.168.1.45', time: '2 mins ago' },
        { id: 2, type: 'WARNING', message: 'Suspicious API activity from new region', ip: '45.12.33.22', time: '15 mins ago' },
        { id: 3, type: 'INFO', message: 'Multiple failed password resets', ip: '88.44.22.11', time: '1 hour ago' },
    ];

    const blacklistedIPs = [
        { ip: '103.45.22.11', region: 'Varies', reason: 'DDoS Attempt', date: '2024-03-01' },
        { ip: '192.1.2.3', region: 'Germany', reason: 'Spam Bot', date: '2024-02-15' },
    ];

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-display">Security & Compliance</h1>
                    <p className="text-muted-foreground mt-1">Manage platform security rules, blocked IPs, and monitor suspicious activity.</p>
                </div>
                <button className="btn-secondary py-2 text-sm text-red-400 hover:text-red-300">
                    <ShieldAlert className="w-4 h-4" />
                    Emergency Lock
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="glass-card p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-semibold text-sm flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-orange-400" />
                            Security Alerts
                        </h2>
                        <span className="text-[10px] text-muted-foreground">Live Feed</span>
                    </div>
                    <div className="space-y-4">
                        {alerts.map(alert => (
                            <div key={alert.id} className="p-3 rounded-lg bg-white/2 border border-white/5 flex gap-3">
                                <div className={cn(
                                    "w-1 h-10 rounded-full",
                                    alert.type === 'CRITICAL' ? "bg-red-500" : alert.type === 'WARNING' ? "bg-orange-500" : "bg-blue-500"
                                )} />
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <p className="text-xs font-bold text-foreground">{alert.message}</p>
                                        <span className="text-[9px] text-muted-foreground uppercase">{alert.type}</span>
                                    </div>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-[10px] font-mono text-muted-foreground">{alert.ip}</span>
                                        <span className="text-[10px] text-muted-foreground italic">{alert.time}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-card flex flex-col">
                    <div className="px-6 py-4 border-b border-white/8 bg-white/2">
                        <h2 className="font-semibold text-sm flex items-center gap-2">
                            <Ban className="w-4 h-4 text-red-400" />
                            IP Blacklist
                        </h2>
                    </div>
                    <div className="flex-1">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="text-[10px] text-muted-foreground uppercase border-b border-white/5">
                                    <th className="px-6 py-3 font-semibold">IP Address</th>
                                    <th className="px-6 py-3 font-semibold">Reason</th>
                                    <th className="px-6 py-3 font-semibold text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/4">
                                {blacklistedIPs.map(item => (
                                    <tr key={item.ip} className="hover:bg-white/2 text-[11px]">
                                        <td className="px-6 py-3 font-mono">{item.ip}</td>
                                        <td className="px-6 py-3 text-muted-foreground">{item.reason}</td>
                                        <td className="px-6 py-3 text-right">
                                            <button className="text-brand-400 hover:text-brand-300">Unblock</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="p-4 border-t border-white/5 bg-white/2">
                        <div className="flex gap-2">
                            <input type="text" placeholder="Add IP to block..." className="input-base text-xs flex-1" />
                            <button className="btn-primary py-1 px-3 text-[11px]">Block</button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-card p-6">
                <h2 className="font-semibold text-sm mb-6">Security Policies</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {[
                        { label: '2FA Enforcement', desc: 'Require 2FA for all Admin roles', active: true },
                        { label: 'Login Rate Limiting', desc: 'Max 5 attempts per minute per IP', active: true },
                        { label: 'Session Timeout', desc: 'Auto-logout admins after 1 hour', active: false },
                    ].map(policy => (
                        <div key={policy.label} className="p-4 rounded-xl border border-white/5 bg-white/2">
                            <div className="flex justify-between items-center mb-2">
                                <p className="text-xs font-bold">{policy.label}</p>
                                <div className={cn(
                                    "w-8 h-4 rounded-full relative transition-colors",
                                    policy.active ? "bg-brand-500" : "bg-white/10"
                                )}>
                                    <div className={cn(
                                        "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                                        policy.active ? "right-0.5" : "left-0.5"
                                    )} />
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground leading-relaxed">{policy.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
