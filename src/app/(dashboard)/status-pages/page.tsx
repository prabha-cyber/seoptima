'use client';

import { useState, useEffect, useCallback } from 'react';
import { Activity, Layout, Plus, Trash2, ExternalLink, Settings, Globe, Shield, Search, Loader2, X, Check, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Monitor {
    id: string;
    name: string;
    url: string;
    status: string;
}

interface StatusPage {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    isPublic: boolean;
    monitors: Monitor[];
    createdAt: string;
}

export default function StatusPagesPage() {
    const [statusPages, setStatusPages] = useState<StatusPage[]>([]);
    const [monitors, setMonitors] = useState<Monitor[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [slug, setSlug] = useState('');
    const [description, setDescription] = useState('');
    const [selectedMonitors, setSelectedMonitors] = useState<string[]>([]);

    const fetchData = useCallback(async () => {
        try {
            setIsLoading(true);
            const [spRes, mRes] = await Promise.all([
                fetch('/api/status-pages'),
                fetch('/api/monitor')
            ]);
            const spData = await spRes.json();
            const mData = await mRes.json();
            setStatusPages(spData.statusPages || []);
            setMonitors(mData.monitors || []);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    const createStatusPage = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const res = await fetch('/api/status-pages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, slug, description, monitorIds: selectedMonitors }),
            });
            if (res.ok) {
                setShowAddForm(false);
                fetchData();
                setName(''); setSlug(''); setDescription(''); setSelectedMonitors([]);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const deleteStatusPage = async (id: string) => {
        if (!confirm('Are you sure you want to delete this status page?')) return;
        try {
            const res = await fetch(`/api/status-pages?id=${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchData();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to delete status page');
            }
        } catch (error) {
            console.error('Delete failed:', error);
            alert('An error occurred while deleting');
        }
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-display flex items-center gap-2">
                        <Layout className="w-6 h-6 text-brand-400" />
                        Status Pages
                    </h1>
                    <div className="flex gap-4 mt-2">
                        <a href="/monitor" className="text-sm font-medium text-muted-foreground hover:text-white pb-1 transition-all">Monitors</a>
                        <button className="text-sm font-bold border-b-2 border-brand-500 pb-1 text-brand-400">Status Pages</button>
                    </div>
                </div>
                <button onClick={() => setShowAddForm(true)} className="px-4 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 rounded-xl text-sm font-semibold text-white transition-all flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Create Status Page
                </button>
            </div>

            {/* List */}
            {isLoading ? (
                <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-brand-500" /></div>
            ) : statusPages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {statusPages.map((page) => (
                        <motion.div key={page.id} className="glass-card overflow-hidden flex flex-col group">
                            <div className="p-6 flex-1">
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-lg font-bold text-white group-hover:text-brand-400 transition-colors">{page.name}</h3>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20">LIVE</span>
                                </div>
                                <p className="text-xs text-muted-foreground mb-4 line-clamp-2">{page.description || 'No description provided.'}</p>

                                <div className="flex items-center gap-2 mb-4">
                                    <Globe className="w-3.5 h-3.5 text-zinc-500" />
                                    <span className="text-xs font-mono text-zinc-400">/status/{page.slug}</span>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Monitors</p>
                                    <div className="flex flex-wrap gap-2">
                                        {page.monitors.map(m => (
                                            <span key={m.id} className="text-[10px] bg-white/5 border border-white/5 px-2 py-1 rounded text-zinc-300">{m.name}</span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white/5 p-4 flex items-center justify-between border-t border-white/5">
                                <a href={`/status/${page.slug}`} target="_blank" className="text-xs font-bold text-brand-400 hover:text-brand-300 flex items-center gap-1.5 transition-all">
                                    View Page <ExternalLink className="w-3 h-3" />
                                </a>
                                <div className="flex items-center gap-2">
                                    <button className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition-all"><Settings className="w-4 h-4" /></button>
                                    <button onClick={() => deleteStatusPage(page.id)} className="p-2 rounded-lg bg-red-500/5 hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="glass-card py-20 text-center">
                    <div className="w-20 h-20 bg-brand-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Layout className="w-10 h-10 text-brand-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-3">No Status Pages Yet</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-8">
                        Create your first public status page to share your service availability with your customers.
                    </p>
                    <button onClick={() => setShowAddForm(true)} className="px-8 py-3 bg-brand-500 hover:bg-brand-400 text-white rounded-2xl text-lg font-bold shadow-xl shadow-brand-500/20 transition-all">
                        Create Your First Page
                    </button>
                </div>
            )}

            {/* Modal */}
            <AnimatePresence>
                {showAddForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddForm(false)} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
                            <form onSubmit={createStatusPage}>
                                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2"><Layout className="w-5 h-5 text-brand-400" /> Create Status Page</h3>
                                    <button type="button" onClick={() => setShowAddForm(false)} className="text-zinc-500 hover:text-white"><X className="w-6 h-6" /></button>
                                </div>

                                <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Page Name</label>
                                            <input type="text" value={name} onChange={e => { setName(e.target.value); if (!slug) setSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')); }}
                                                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-brand-500/50 outline-none" placeholder="e.g. System Health" required />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Slug (URL)</label>
                                            <div className="flex items-center">
                                                <span className="bg-white/5 border border-white/10 border-r-0 rounded-l-xl px-4 py-3 text-zinc-500 text-sm">/status/</span>
                                                <input type="text" value={slug} onChange={e => setSlug(e.target.value)}
                                                    className="w-full bg-white/5 border border-white/10 rounded-r-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-brand-500/50 outline-none" placeholder="system-status" required />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">Description</label>
                                        <textarea value={description} onChange={e => setDescription(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-600 focus:ring-2 focus:ring-brand-500/50 outline-none h-24" placeholder="Briefly describe what this page shows (e.g. Real-time status of our core services)" />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3">Select Monitors to Include</label>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {monitors.map(m => {
                                                const isSelected = selectedMonitors.includes(m.id);
                                                return (
                                                    <button key={m.id} type="button" onClick={() => setSelectedMonitors(prev => isSelected ? prev.filter(id => id !== m.id) : [...prev, m.id])}
                                                        className={cn('flex items-center justify-between p-3 rounded-xl border transition-all text-left',
                                                            isSelected ? 'bg-brand-500/10 border-brand-500/40 text-brand-300' : 'bg-white/5 border-white/5 text-zinc-400 hover:bg-white/10')}>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-semibold truncate">{m.name}</span>
                                                            <span className="text-[10px] opacity-70 truncate">{m.url}</span>
                                                        </div>
                                                        {isSelected && <Check className="w-4 h-4 text-brand-400 shrink-0 ml-2" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-black/20 border-t border-white/10 flex items-center justify-end gap-3">
                                    <button type="button" onClick={() => setShowAddForm(false)} className="px-5 py-2.5 text-sm font-bold text-zinc-400 hover:text-white transition-all">Cancel</button>
                                    <button type="submit" disabled={isSaving || !name || !slug || selectedMonitors.length === 0}
                                        className="px-6 py-2.5 bg-brand-500 hover:bg-brand-400 text-white rounded-xl text-sm font-bold shadow-lg shadow-brand-500/20 flex items-center gap-2 disabled:opacity-50 transition-all">
                                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Create Page
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
