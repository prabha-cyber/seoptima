'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Ticket, Search, Plus, Trash2, Calendar,
    CheckCircle2, XCircle, AlertCircle, Copy,
    Clock, Tag, RefreshCcw, ChevronRight,
    ArrowUpRight, ArrowDownRight, Edit2
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CouponManagementPage() {
    const [coupons, setCoupons] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [formData, setFormData] = useState({
        code: '',
        type: 'PERCENTAGE',
        value: '',
        maxUses: '',
        expiresAt: '',
    });

    useEffect(() => {
        fetchCoupons();
    }, []);

    async function fetchCoupons() {
        try {
            const res = await fetch('/api/admin/coupons');
            const data = await res.json();
            if (res.ok) setCoupons(data);
        } catch (err) {
            console.error('Failed to fetch coupons');
        } finally {
            setIsLoading(false);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');
        setSuccess('');

        try {
            const res = await fetch('/api/admin/coupons', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                const newCoupon = await res.json();
                setCoupons([newCoupon, ...coupons]);
                setSuccess('Coupon created successfully!');
                setFormData({ code: '', type: 'PERCENTAGE', value: '', maxUses: '', expiresAt: '' });
                setShowForm(false);
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to create coupon');
            }
        } catch (err) {
            setError('Connection error. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteCoupon = async (id: string) => {
        if (!confirm('Delete this coupon?')) return;
        try {
            // Reusing individual route if we create one, or just a generic DELETE to /api/admin/coupons
            const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
            if (res.ok) setCoupons(coupons.filter(c => c.id !== id));
        } catch (err) {
            alert('Failed to delete coupon');
        }
    };

    const toggleCouponStatus = async (id: string, current: boolean) => {
        try {
            const res = await fetch(`/api/admin/coupons/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ active: !current }),
            });
            if (res.ok) {
                setCoupons(coupons.map(c => c.id === id ? { ...c, active: !current } : c));
            }
        } catch (err) {
            console.error('Failed to update status');
        }
    };

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold font-display">Coupons & Discounts</h1>
                    <p className="text-muted-foreground mt-1 text-sm">Create and manage promo codes for user subscriptions.</p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className={cn(
                        "btn-primary py-2 text-sm transition-all",
                        showForm ? "bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20" : ""
                    )}
                >
                    {showForm ? <XCircle className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {showForm ? 'Cancel' : 'New Coupon'}
                </button>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="glass-card p-6 border-brand-500/30 bg-brand-500/[0.02] shadow-2xl shadow-brand-500/5">
                            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Promo Code</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="SAVE50"
                                        className="input-base w-full py-2 text-sm font-mono uppercase"
                                        value={formData.code}
                                        onChange={e => setFormData({ ...formData, code: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Type</label>
                                    <select
                                        className="input-base w-full py-2 text-sm"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="PERCENTAGE">Percentage (%)</option>
                                        <option value="FIXED">Fixed Amount ($)</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Value</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="20"
                                        className="input-base w-full py-2 text-sm"
                                        value={formData.value}
                                        onChange={e => setFormData({ ...formData, value: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Max Uses</label>
                                    <input
                                        type="number"
                                        placeholder="Unlimited"
                                        className="input-base w-full py-2 text-sm"
                                        value={formData.maxUses}
                                        onChange={e => setFormData({ ...formData, maxUses: e.target.value })}
                                    />
                                </div>
                                <div className="md:col-span-3 space-y-2">
                                    <label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Expiry Date (Optional)</label>
                                    <input
                                        type="date"
                                        className="input-base w-full py-2 text-sm"
                                        value={formData.expiresAt}
                                        onChange={e => setFormData({ ...formData, expiresAt: e.target.value })}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="btn-primary w-full py-2.5 h-[42px] relative overflow-hidden group shadow-lg shadow-brand-500/10"
                                >
                                    {isSubmitting ? (
                                        <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                                    ) : (
                                        <span className="flex items-center justify-center gap-2 group-hover:scale-105 transition-transform">
                                            <Ticket className="w-4 h-4" /> Generate Coupon
                                        </span>
                                    )}
                                </button>
                                {error && <p className="text-[11px] text-red-400 font-medium md:col-span-4 mt-2 px-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {error}</p>}
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {isLoading ? (
                <div className="flex items-center justify-center p-20">
                    <div className="w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : coupons.length === 0 ? (
                <div className="glass-card p-12 text-center border-dashed">
                    <Tag className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-muted-foreground">No active coupons</h3>
                    <p className="text-sm text-muted-foreground/60 mt-1">Start by creating a promo code to incentivize subscriptions.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {coupons.map((coupon, i) => (
                        <motion.div
                            key={coupon.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={cn(
                                "glass-card p-6 relative overflow-hidden group transition-all",
                                !coupon.active ? "opacity-60 grayscale-[0.5]" : "hover:border-brand-500/30"
                            )}
                        >
                            {!coupon.active && (
                                <div className="absolute top-3 right-3 z-20">
                                    <span className="px-2 py-0.5 rounded bg-red-500/10 text-red-400 text-[10px] font-bold uppercase tracking-wider border border-red-500/20">Inactive</span>
                                </div>
                            )}

                            <div className="flex items-start justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-xl bg-gradient-to-br from-brand-500/20 to-accent-500/20 text-brand-400 border border-white/5">
                                        <Ticket className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h3 className="text-lg font-mono font-bold tracking-tight text-white group-hover:text-brand-400 transition-colors uppercase">{coupon.code}</h3>
                                            <button
                                                onClick={() => navigator.clipboard.writeText(coupon.code)}
                                                className="p-1 rounded hover:bg-white/10 text-muted-foreground"
                                            >
                                                <Copy className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Created {new Date(coupon.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => toggleCouponStatus(coupon.id, coupon.active)}
                                        className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-muted-foreground hover:text-white"
                                    >
                                        <RefreshCcw className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        onClick={() => deleteCoupon(coupon.id)}
                                        className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/10 text-muted-foreground hover:text-red-400"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-end justify-between mb-4">
                                <div className="text-3xl font-bold font-display text-white">
                                    {coupon.type === 'PERCENTAGE' ? `${coupon.value}%` : `$${coupon.value}`}
                                    <span className="text-xs text-muted-foreground ml-1 font-sans font-medium">OFF</span>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-muted-foreground mb-1 uppercase tracking-widest">Usage</p>
                                    <div className="flex items-center gap-1.5 font-mono text-sm">
                                        <span className="text-brand-400">{coupon.usedCount}</span>
                                        <span className="text-white/20">/</span>
                                        <span className="text-muted-foreground">{coupon.maxUses || '∞'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {coupon.expiresAt ? (
                                        <span className={cn(new Date(coupon.expiresAt) < new Date() ? "text-red-400" : "")}>
                                            Expires: {new Date(coupon.expiresAt).toLocaleDateString()}
                                        </span>
                                    ) : 'No expiration'}
                                </div>
                                <div className={cn(
                                    "flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full",
                                    coupon.active && (!coupon.expiresAt || new Date(coupon.expiresAt) >= new Date())
                                        ? "bg-green-500/10 text-green-400"
                                        : "bg-red-500/10 text-red-400"
                                )}>
                                    {coupon.active && (!coupon.expiresAt || new Date(coupon.expiresAt) >= new Date()) ? 'Valid' : 'Invalid'}
                                </div>
                            </div>

                            {/* Background decoration */}
                            <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-brand-500/5 blur-3xl rounded-full" />
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
