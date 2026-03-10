'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    User, ArrowLeft, Save, Mail, Shield,
    Lock, AlertCircle, CheckCircle2, Building2,
    Briefcase, CreditCard, Clock, Globe, Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function UserDetailPage() {
    const router = useRouter();
    const params = useParams();
    const userId = params.id as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');
    const [user, setUser] = useState<any>(null);
    const [agencies, setAgencies] = useState<any[]>([]);
    const [selectedAgency, setSelectedAgency] = useState('');
    const [selectedRole, setSelectedRole] = useState('MEMBER');

    useEffect(() => {
        async function fetchData() {
            try {
                const [userRes, agenciesRes] = await Promise.all([
                    fetch(`/api/admin/users/${userId}`),
                    fetch('/api/admin/agencies')
                ]);

                const userData = await userRes.json();
                const agenciesData = await agenciesRes.json();

                if (userRes.ok) setUser(userData);
                if (agenciesRes.ok) setAgencies(agenciesData);
            } catch (err) {
                setError('Failed to fetch data');
            } finally {
                setIsLoading(false);
            }
        }
        fetchData();
    }, [userId]);

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        setError('');

        try {
            const res = await fetch(`/api/admin/users/${userId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(user),
            });

            if (res.ok) {
                alert('User updated successfully');
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to update user');
            }
        } catch (err) {
            setError('Something went wrong');
        } finally {
            setIsSaving(false);
        }
    };

    const addToAgency = async () => {
        if (!selectedAgency) return;
        try {
            const res = await fetch(`/api/admin/agencies/${selectedAgency}/members`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, role: selectedRole }),
            });
            if (res.ok) {
                const updatedUser = await (await fetch(`/api/admin/users/${userId}`)).json();
                setUser(updatedUser);
                setSelectedAgency('');
            }
        } catch (err) {
            alert('Failed to add to agency');
        }
    };

    if (isLoading) return (
        <div className="flex items-center justify-center p-20">
            <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-fade-in pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/users" className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-muted-foreground hover:text-white">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold font-display">{user.name || 'User Details'}</h1>
                        <p className="text-muted-foreground text-sm uppercase tracking-widest font-semibold mt-0.5 flex items-center gap-2">
                            <Mail className="w-3 h-3" /> {user.email}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button className="btn-secondary py-2 text-sm text-red-400 border-red-500/10 hover:bg-red-500/10">
                        Suspend Account
                    </button>
                    <button onClick={handleUpdate} disabled={isSaving} className="btn-primary py-2 text-sm">
                        {isSaving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    {/* Basic Info */}
                    <div className="glass-card p-6 space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                            <User className="w-5 h-5 text-brand-400" />
                            Profile Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Full Name</label>
                                <input
                                    type="text"
                                    className="input-base w-full"
                                    value={user.name || ''}
                                    onChange={e => setUser({ ...user, name: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Email</label>
                                <input
                                    type="email"
                                    className="input-base w-full opacity-70 cursor-not-allowed"
                                    value={user.email}
                                    readOnly
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Platform Role</label>
                                <select
                                    className="input-base w-full"
                                    value={user.role}
                                    onChange={e => setUser({ ...user, role: e.target.value })}
                                >
                                    <option value="USER">User</option>
                                    <option value="MANAGER">Manager</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-1">Status</label>
                                <div className="flex items-center gap-2 p-2.5 rounded-xl bg-white/5 border border-white/5">
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_5px_rgba(34,197,94,1)]" />
                                    <span className="text-sm font-medium">Active Account</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Agency Memberships */}
                    <div className="glass-card p-6 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-brand-400" />
                                Agency Access
                            </h3>
                            <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground bg-white/5 px-2 py-1 rounded">
                                {user.agencyMembers?.length || 0} Agencies
                            </div>
                        </div>

                        <div className="space-y-3">
                            {user.agencyMembers?.map((m: any) => (
                                <div key={m.id} className="p-4 rounded-xl border border-white/5 bg-white/2 flex items-center justify-between group hover:border-white/10 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400">
                                            <Building2 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-white">{m.agency?.name}</h4>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className={cn(
                                                    "text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded",
                                                    m.role === 'ADMIN' ? "bg-red-500/10 text-red-400" :
                                                        m.role === 'MANAGER' ? "bg-blue-500/10 text-blue-400" : "bg-green-500/10 text-green-400"
                                                )}>
                                                    {m.role}
                                                </span>
                                                <span className="text-[10px] text-muted-foreground">• Joined {new Date(m.createdAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/10 text-muted-foreground hover:text-red-400 transition-all opacity-0 group-hover:opacity-100">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div className="pt-6 border-t border-white/5 space-y-4">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Add to Agency</h4>
                            <div className="flex flex-col sm:flex-row gap-3">
                                <select
                                    className="input-base flex-1 text-sm grow"
                                    value={selectedAgency}
                                    onChange={e => setSelectedAgency(e.target.value)}
                                >
                                    <option value="">Select Agency...</option>
                                    {agencies.filter(a => !user.agencyMembers?.some((m: any) => m.agencyId === a.id)).map(a => (
                                        <option key={a.id} value={a.id}>{a.name}</option>
                                    ))}
                                </select>
                                <select
                                    className="input-base text-sm"
                                    value={selectedRole}
                                    onChange={e => setSelectedRole(e.target.value)}
                                >
                                    <option value="MEMBER">Member</option>
                                    <option value="MANAGER">Manager</option>
                                    <option value="ADMIN">Admin</option>
                                </select>
                                <button
                                    onClick={addToAgency}
                                    disabled={!selectedAgency}
                                    className="btn-primary py-2 px-6 text-sm disabled:opacity-50"
                                >
                                    Assign
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Subscription Sidebar */}
                    <div className="glass-card p-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-6">Subscription</h3>
                        <div className="p-4 rounded-xl bg-gradient-to-br from-accent-500/10 to-brand-500/10 border border-brand-500/20 mb-6">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-2 rounded-lg bg-brand-500 text-white shadow-lg shadow-brand-500/30">
                                    <Briefcase className="w-5 h-5" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-brand-400">{user.subscription?.status || 'INACTIVE'}</span>
                            </div>
                            <h4 className="text-2xl font-bold font-display text-white">{user.subscription?.plan || 'FREE'}</h4>
                            <p className="text-xs text-muted-foreground mt-1">Next billing: {user.subscription?.currentPeriodEnd ? new Date(user.subscription.currentPeriodEnd).toLocaleDateString() : '—'}</p>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b border-white/5">
                                <span className="text-xs text-muted-foreground flex items-center gap-2"><CreditCard className="w-3.5 h-3.5" /> Customer ID</span>
                                <span className="text-xs font-mono text-white/50">{user.subscription?.stripeCustomerId?.substring(0, 8) || 'N/A'}...</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-white/5">
                                <span className="text-xs text-muted-foreground flex items-center gap-2"><Globe className="w-3.5 h-3.5" /> Projects</span>
                                <span className="text-xs font-bold text-white">{user._count?.websites || 0}</span>
                            </div>
                        </div>
                        <button className="btn-secondary w-full mt-6 text-xs grayscale opacity-50 cursor-not-allowed">
                            Manage Billing (Redirect)
                        </button>
                    </div>

                    <div className="glass-card p-6">
                        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground mb-4">Activity Log</h3>
                        <div className="space-y-4">
                            <div className="flex gap-3 relative before:absolute before:left-2 before:top-6 before:bottom-0 before:w-px before:bg-white/5 last:before:hidden">
                                <div className="w-4 h-4 rounded-full bg-brand-500/20 border border-brand-500/40 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="text-xs text-white/80">User created account</p>
                                    <p className="text-[10px] text-muted-foreground mt-0.5">{new Date(user.createdAt).toLocaleString()}</p>
                                </div>
                            </div>
                            {/* Dummy activity */}
                            <div className="flex gap-3">
                                <div className="w-4 h-4 rounded-full bg-white/5 border border-white/10 flex-shrink-0 mt-1" />
                                <div>
                                    <p className="text-xs text-muted-foreground">No recent platform activity</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
