'use client';

import { useState } from 'react';
import {
    Bell, Megaphone, Send, History,
    Trash2, Edit2, Users, CheckCircle2,
    AlertCircle, Info, Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function NotificationsAdminPage() {
    const [template, setTemplate] = useState('SYSTEM_UPDATE');

    const history = [
        { id: 1, title: 'v1.4 Update rollout', recipients: 'All Users', type: 'SYSTEM', date: '2024-03-04', status: 'SENT' },
        { id: 2, title: 'Server Maintenance', recipients: 'PRO & AGENCY', type: 'ALERT', date: '2024-03-01', status: 'SENT' },
        { id: 3, title: 'New SEO Guides', recipients: 'FREE Users', type: 'INFO', date: '2024-02-28', status: 'DRAFT' },
    ];

    return (
        <div className="space-y-8 animate-fade-in max-w-5xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-display">Broadcast Notifications</h1>
                    <p className="text-muted-foreground mt-1">Send global announcements and targeted messages to platform users.</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn-secondary py-2 text-sm flex items-center gap-2">
                        <History className="w-4 h-4" />
                        Log
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card p-6">
                        <h2 className="font-semibold text-sm mb-6 flex items-center gap-2">
                            <Megaphone className="w-4 h-4 text-brand-400" />
                            Compose Announcement
                        </h2>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Title</label>
                                <input type="text" placeholder="e.g., Important System Update" className="input-base w-full" />
                            </div>
                            <div>
                                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Message Body</label>
                                <textarea placeholder="Describe the update or announcement..." className="input-base w-full h-32" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Target Audience</label>
                                    <select className="input-base w-full">
                                        <option>All Users</option>
                                        <option>Free Users</option>
                                        <option>Pro Users</option>
                                        <option>Agency Users</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Notification Type</label>
                                    <select className="input-base w-full" value={template} onChange={e => setTemplate(e.target.value)}>
                                        <option value="SYSTEM">System Announcement</option>
                                        <option value="ALERT">Urgent Alert</option>
                                        <option value="INFO">Information</option>
                                    </select>
                                </div>
                            </div>
                            <div className="pt-4 flex justify-end gap-3">
                                <button className="btn-secondary py-2 text-sm px-6">Save Draft</button>
                                <button className="btn-primary py-2 text-sm px-8 flex items-center gap-2">
                                    <Send className="w-4 h-4" />
                                    Broadcast Now
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="glass-card overflow-hidden">
                        <div className="px-6 py-4 border-b border-white/8 bg-white/2">
                            <h2 className="font-semibold text-sm">Recent Broadcasts</h2>
                        </div>
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-white/4">
                                {history.map(item => (
                                    <tr key={item.id} className="hover:bg-white/2">
                                        <td className="px-6 py-4">
                                            <p className="text-xs font-medium">{item.title}</p>
                                            <p className="text-[10px] text-muted-foreground">To: {item.recipients}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase",
                                                item.type === 'SYSTEM' ? "bg-brand-500/10 text-brand-400" :
                                                    item.type === 'ALERT' ? "bg-red-500/10 text-red-400" :
                                                        "bg-blue-500/10 text-blue-400"
                                            )}>
                                                {item.type}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-[10px] text-muted-foreground">
                                            {item.date}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <span className={cn(
                                                "text-[9px] font-bold",
                                                item.status === 'SENT' ? "text-green-400" : "text-muted-foreground"
                                            )}>
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className="glass-card p-6 border-brand-500/20 shadow-brand-500/5">
                        <h2 className="font-semibold text-sm mb-4">Preview</h2>
                        <div className="bg-[#0b0c10] border border-white/5 rounded-xl p-4 relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-brand-500" />
                            <div className="flex gap-3">
                                <div className="w-8 h-8 rounded bg-brand-500/20 flex items-center justify-center text-brand-400">
                                    <Bell className="w-4 h-4" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-foreground">New Platform Update</p>
                                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                                        We have just released version 1.4 which includes the new Admin Panel and enhanced SEO audit tools...
                                    </p>
                                    <p className="text-[9px] text-muted-foreground mt-2">Just now</p>
                                </div>
                            </div>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-4 italic text-center">
                            * This is how users will see the notification in their dashboard header.
                        </p>
                    </div>

                    <div className="glass-card p-6">
                        <h2 className="font-semibold text-sm mb-4">Quick Stats</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Engagement Rate</span>
                                <span className="text-xs font-bold text-green-400">24%</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-xs text-muted-foreground">Notification Limit</span>
                                <span className="text-xs font-bold text-foreground">15k / 50k</span>
                            </div>
                            <div className="w-full h-1 bg-white/5 rounded-full mt-2">
                                <div className="w-[30%] h-full bg-brand-500 rounded-full" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
