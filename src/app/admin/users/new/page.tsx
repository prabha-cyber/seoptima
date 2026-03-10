'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    UserPlus, ArrowLeft, Save, Mail, User,
    Shield, Lock, AlertCircle, CheckCircle2,
    Building2, Briefcase
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export default function NewUserPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'USER',
        plan: 'FREE'
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                router.push('/admin/users');
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to create user');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 animate-fade-in pb-20">
            <div className="flex items-center gap-4">
                <Link href="/admin/users" className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-muted-foreground hover:text-white">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold font-display">Add Platform User</h1>
                    <p className="text-muted-foreground text-sm">Manually register a new user and assign their initial permissions.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <div className="glass-card p-6 space-y-6 shadow-2xl shadow-brand-500/5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Full Name</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                <input
                                    type="text"
                                    required
                                    placeholder="John Doe"
                                    className="input-base w-full pl-10"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                <input
                                    type="email"
                                    required
                                    placeholder="john@example.com"
                                    className="input-base w-full pl-10"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                <input
                                    type="password"
                                    required
                                    placeholder="Minimum 8 characters"
                                    className="input-base w-full pl-10"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                <Shield className="w-3.5 h-3.5" /> Platform Role
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                {['USER', 'MANAGER', 'ADMIN'].map(role => (
                                    <button
                                        key={role}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role })}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all text-left",
                                            formData.role === role ? "bg-brand-500/10 border-brand-500 text-white" : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                                        )}
                                    >
                                        {role}
                                        {formData.role === role && <CheckCircle2 className="w-4 h-4 text-brand-400" />}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                <Briefcase className="w-3.5 h-3.5" /> Subscription Plan
                            </label>
                            <div className="grid grid-cols-1 gap-2">
                                {['FREE', 'PRO', 'AGENCY'].map(plan => (
                                    <button
                                        key={plan}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, plan })}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition-all text-left",
                                            formData.plan === plan ? "bg-accent-500/10 border-accent-500 text-white" : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10"
                                        )}
                                    >
                                        {plan}
                                        {formData.plan === plan && <CheckCircle2 className="w-4 h-4 text-accent-400" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full py-4 mt-6 shadow-xl shadow-brand-500/20 group relative overflow-hidden"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                        ) : (
                            <span className="flex items-center justify-center gap-2 group-hover:scale-105 transition-transform z-10 relative">
                                <UserPlus className="w-5 h-5" /> Register Account
                            </span>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-r from-brand-500 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                </div>
            </form>
        </div>
    );
}
