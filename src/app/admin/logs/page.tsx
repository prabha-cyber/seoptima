'use client';

import { useState, useEffect } from 'react';
import {
    ScrollText, AlertTriangle, AlertCircle, Info,
    Search, Filter, Trash2, Clock, Terminal,
    ShieldAlert, Database, CloudLightning
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SystemLogsPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [typeFilter, setTypeFilter] = useState('');

    useEffect(() => {
        async function fetchLogs() {
            try {
                const query = typeFilter ? `?type=${typeFilter}` : '';
                const res = await fetch(`/api/admin/logs${query}`);
                const data = await res.json();
                if (res.ok) setLogs(data);
            } catch (error) {
                console.error('Failed to fetch logs:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchLogs();
    }, [typeFilter]);

    const getLogIcon = (type: string) => {
        switch (type) {
            case 'ERROR': return <AlertCircle className="w-4 h-4 text-red-500" />;
            case 'CRITICAL': return <ShieldAlert className="w-4 h-4 text-red-600" />;
            case 'WARNING': return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
            default: return <Info className="w-4 h-4 text-blue-500" />;
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-display">System Logs</h1>
                    <p className="text-muted-foreground mt-1">Real-time monitoring of server events, API requests, and platform errors.</p>
                </div>
                <div className="flex gap-2">
                    <button className="btn-secondary py-2 text-sm text-red-400 hover:text-red-300">Clear All Logs</button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search log messages..."
                        className="input-base pl-10 w-full"
                    />
                </div>
                <select
                    className="input-base text-sm px-4"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                >
                    <option value="">All Severities</option>
                    <option value="INFO">Info</option>
                    <option value="WARNING">Warning</option>
                    <option value="ERROR">Error</option>
                    <option value="CRITICAL">Critical</option>
                </select>
            </div>

            {/* Logs List */}
            <div className="glass-card overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto custom-scroll">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-white/8 bg-white/2 sticky top-0 z-10">
                                <th className="px-6 py-4 text-xs font-semibold uppercase text-muted-foreground w-12 text-center">T</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase text-muted-foreground">Message</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase text-muted-foreground">Source</th>
                                <th className="px-6 py-4 text-xs font-semibold uppercase text-muted-foreground">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/4 font-mono">
                            {isLoading ? (
                                <tr><td colSpan={4} className="p-12 text-center text-muted-foreground italic">Crunching logs...</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={4} className="p-12 text-center text-muted-foreground italic">Clean slate. No logs found.</td></tr>
                            ) : logs.map(log => (
                                <tr key={log.id} className="hover:bg-white/2 transition-colors">
                                    <td className="px-6 py-4 text-center">
                                        {getLogIcon(log.type)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="max-w-[500px]">
                                            <p className="text-sm font-medium text-foreground break-words">{log.message}</p>
                                            {log.details && <p className="text-[10px] text-muted-foreground mt-1 truncate opacity-60">{log.details}</p>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-muted-foreground uppercase">
                                            {log.source || 'SYSTEM'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-[10px] text-muted-foreground whitespace-nowrap">
                                        {new Date(log.createdAt).toLocaleString()}
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
