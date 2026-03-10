'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Building2, ArrowLeft, Save, Globe, Info,
    CheckCircle2, AlertCircle, Shield, Key,
    Users, Trash2, Plus, Mail, ShieldAlert,
    BarChart3, LayoutDashboard, Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function AgencyDetailPage() {
    const router = useRouter();
    const params = useParams();
    const agencyId = params.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [agency, setAgency] = useState<any>(null);
    const [activeTab, setActiveTab] = useState<'settings' | 'members' | 'websites'>('settings');

    useEffect(() => {
        async function fetchAgency() {
            try {
                const res = await fetch(`/api/admin/agencies/${agencyId}`);
                const data = await res.json();
                if (res.ok) setAgency(data);
                else setError(data.error || 'Failed to fetch agency');
            } catch (err) {
                setError('Failed to connect to server');
            } finally {
                setIsLoading(false);
            }
        }
        fetchAgency();
    }, [agencyId]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');

        try {
            const res = await fetch(`/api/admin/agencies/${agencyId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(agency),
            });

            if (res.ok) {
                alert('Agency updated successfully');
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to update agency');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) return (
        <div className="flex items-center justify-center p-20">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (error && !agency) return (
        <div className="p-8 text-center glass-card border-red-500/20">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold">Error</h2>
            <p className="text-muted-foreground mt-2">{error}</p>
            <Link href="/admin/agencies" className="btn-secondary mt-6">Back to Agencies</Link>
        </div>
    );

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/agencies" className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-muted-foreground hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold font-display">{agency.name}</h1>
                        <p className="text-muted-foreground text-sm uppercase tracking-widest font-semibold mt-0.5 flex items-center gap-2">
                            <Building2 className="w-3 h-3" /> Agency ID: <span className="text-white font-mono">{agency.id}</span>
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn-secondary py-2 text-sm text-red-400 border-red-500/10 hover:bg-red-500/10">
                        Suspend Agency
                    </button>
                    <button onClick={handleUpdate} disabled={isSaving} className="btn-primary py-2 text-sm">
                        {isSaving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex items-center gap-1 border-b border-white/5">
                {[
                    { id: 'settings', label: 'Settings', icon: Info },
                    { id: 'members', label: 'Team Members', icon: Users },
                    { id: 'websites', label: 'Websites', icon: Globe },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={cn(
                            "flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all relative border-b-2",
                            activeTab === tab.id ? "text-brand-400 border-brand-500" : "text-muted-foreground border-transparent hover:text-white"
                        )}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'settings' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <div className="glass-card p-6 space-y-4">
                            <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Agency Name</label>
                                    <input
                                        type="text"
                                        className="input-base w-full"
                                        value={agency.name}
                                        onChange={e => setAgency({ ...agency, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Website</label>
                                    <input
                                        type="url"
                                        className="input-base w-full"
                                        value={agency.website || ''}
                                        onChange={e => setAgency({ ...agency, website: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Description</label>
                                    <textarea
                                        className="input-base w-full min-h-[100px] py-3 text-sm"
                                        value={agency.description || ''}
                                        onChange={e => setAgency({ ...agency, description: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="glass-card p-6 space-y-4">
                            <h3 className="text-lg font-semibold mb-4">Feature Controls</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {['SEO_AUDIT', 'KEYWORD_TRACKING', 'BACKLINK_MONITOR', 'COMPETITOR_ANALYSIS'].map(f => (
                                    <div key={f} className="p-4 rounded-xl border border-white/5 bg-white/2 flex items-center justify-between group hover:border-white/10 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-white/5 text-brand-400">
                                                <Shield className="w-4 h-4" />
                                            </div>
                                            <span className="text-sm font-medium">{f.replace(/_/g, ' ')}</span>
                                        </div>
                                        <div className="flex items-center cursor-pointer">
                                            <div className="w-10 h-5 bg-brand-500 rounded-full relative p-1">
                                                <div className="w-3 h-3 bg-white rounded-full absolute right-1"></div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="pt-4 flex items-center gap-3 p-4 bg-orange-500/5 border border-orange-500/10 rounded-xl">
                                <ShieldAlert className="w-5 h-5 text-orange-400 shrink-0" />
                                <p className="text-[10px] text-orange-200/70 italic">
                                    Feature limits are managed by subscription tier. Manual overrides are coming soon.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="glass-card p-6">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">Stats Overview</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 transition-all hover:bg-blue-500/10">
                                    <div className="flex items-center gap-3">
                                        <Users className="w-4 h-4 text-blue-400" />
                                        <span className="text-sm text-muted-foreground">Team Size</span>
                                    </div>
                                    <span className="text-sm font-bold">{agency._count?.members || 0}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/5 border border-green-500/10 transition-all hover:bg-green-500/10">
                                    <div className="flex items-center gap-3">
                                        <Globe className="w-4 h-4 text-green-400" />
                                        <span className="text-sm text-muted-foreground">Active Projects</span>
                                    </div>
                                    <span className="text-sm font-bold">{agency._count?.websites || 0}</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-xl bg-purple-500/5 border border-purple-500/10 transition-all hover:bg-purple-500/10">
                                    <div className="flex items-center gap-3">
                                        <Search className="w-4 h-4 text-purple-400" />
                                        <span className="text-sm text-muted-foreground">Total Audits</span>
                                    </div>
                                    <span className="text-sm font-bold">0</span>
                                </div>
                            </div>
                            <button className="btn-secondary w-full mt-6 text-xs grayscale opacity-50 cursor-not-allowed">
                                View Analytics (Coming Soon)
                            </button>
                        </div>

                        <div className="glass-card p-6 border-red-500/20 bg-red-500/[0.02]">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-red-400 mb-4">Danger Zone</h3>
                            <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">
                                Deleting an agency is permanent. This will remove all associated team memberships and project access.
                            </p>
                            <button className="w-full py-2.5 rounded-lg border border-red-500/30 text-red-500 text-xs font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">
                                Delete Permanently
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'members' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-lg font-semibold">Agency Team</h3>
                        <div className="flex gap-2">
                            <select
                                className="input-base py-1 px-3 text-xs bg-white/5 border-white/10"
                                onChange={async (e) => {
                                    if (!e.target.value) return;
                                    const res = await fetch(`/api/admin/agencies/${agencyId}/members`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ userId: e.target.value, role: 'MEMBER' })
                                    });
                                    if (res.ok) window.location.reload();
                                }}
                            >
                                <option value="">Add Member...</option>
                                {/* We would ideally fetch all platform users here */}
                                <option value="cm7woj9be00003b78i5o9p50k">Demo User (Search placeholder)</option>
                            </select>
                        </div>
                    </div>
                    <div className="glass-card overflow-hidden">
                        {agency.members?.length > 0 ? (
                            <div className="divide-y divide-white/5">
                                {agency.members.map((m: any) => (
                                    <div key={m.id} className="p-4 flex items-center justify-between hover:bg-white/2 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-400 font-bold border border-white/5">
                                                {m.user?.name?.[0] || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white">{m.user?.name || 'Anonymous'}</p>
                                                <p className="text-[11px] text-muted-foreground">{m.user?.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className={cn(
                                                "text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded",
                                                m.role === 'ADMIN' ? "bg-red-500/10 text-red-400" : "bg-blue-500/10 text-blue-400"
                                            )}>
                                                {m.role}
                                            </span>
                                            <button
                                                onClick={async () => {
                                                    const res = await fetch(`/api/admin/agencies/${agencyId}/members?userId=${m.userId}`, { method: 'DELETE' });
                                                    if (res.ok) window.location.reload();
                                                }}
                                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold">No team members yet</h3>
                                <p className="text-muted-foreground mt-1 max-w-xs mx-auto text-sm">Assign existing platform users to this agency to give them management rights.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'websites' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-lg font-semibold">Agency Websites</h3>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Search websites..."
                                className="input-base py-1 px-3 text-xs w-48 bg-white/5 border-white/10"
                            />
                        </div>
                    </div>
                    <div className="glass-card overflow-hidden">
                        {agency.websites?.length > 0 ? (
                            <div className="divide-y divide-white/5">
                                {agency.websites.map((w: any) => (
                                    <div key={w.id} className="p-4 flex items-center justify-between hover:bg-white/2 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400 border border-white/5">
                                                <Globe className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-white uppercase tracking-tight">{w.domain || w.url.split('/')[2]}</p>
                                                <p className="text-[11px] text-muted-foreground truncate max-w-xs">{w.url}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">SEO Score</p>
                                                <p className="text-sm font-bold text-brand-400">84/100</p>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    const res = await fetch(`/api/admin/agencies/${agencyId}/websites?websiteId=${w.id}`, { method: 'DELETE' });
                                                    if (res.ok) window.location.reload();
                                                }}
                                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-12 text-center">
                                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                                    <Globe className="w-8 h-8 text-muted-foreground" />
                                </div>
                                <h3 className="text-lg font-semibold">No assigned websites</h3>
                                <p className="text-muted-foreground mt-1 max-w-xs mx-auto text-sm">Websites assigned to this agency can be viewed and managed by all agency members.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
