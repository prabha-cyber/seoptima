'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Building2, ArrowLeft, Save, Globe, Info,
    CheckCircle2, AlertCircle, Shield, Key,
    LayoutDashboard, Search, BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const AVAILABLE_FEATURES = [
    { id: 'SEO_AUDIT', name: 'Technical SEO Audit', icon: Search, description: 'Deep crawl and analysis of websites.' },
    { id: 'KEYWORD_TRACKING', name: 'Keyword Tracking', icon: Key, description: 'Monitor search engine rankings.' },
    { id: 'BACKLINK_MONITOR', name: 'Backlink Monitor', icon: Globe, description: 'Track referring domains and anchor text.' },
    { id: 'COMPETITOR_ANALYSIS', name: 'Competitor Analysis', icon: BarChart3, description: 'Compare performance against rivals.' },
    { id: 'AI_CONTENT', name: 'AI Content Assistant', icon: Sparkles, description: 'Generate SEO-optimized content.' },
];

// Helper for AI Content icon since Sparkles might not be in our set
function Sparkles({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
            <path d="M5 3v4" /><path d="M19 17v4" /><path d="M3 5h4" /><path d="M17 19h4" />
        </svg>
    );
}

export default function NewAgencyPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        website: '',
        logo: '',
    });
    const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
        AVAILABLE_FEATURES.map(f => f.id)
    );

    const toggleFeature = (id: string) => {
        setSelectedFeatures(prev =>
            prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/admin/agencies', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    features: selectedFeatures.map(f => ({ feature: f, enabled: true }))
                }),
            });

            if (res.ok) {
                router.push('/admin/agencies');
            } else {
                const data = await res.json();
                setError(data.error || 'Failed to create agency');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-20">
            <div className="flex items-center gap-4">
                <Link href="/admin/agencies" className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-muted-foreground hover:text-white">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold font-display">Create New Agency</h1>
                    <p className="text-muted-foreground text-sm">Register a new partner agency and configure their access level.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0" />
                        {error}
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Basic Info */}
                    <div className="md:col-span-2 space-y-6">
                        <div className="glass-card p-6 space-y-4">
                            <h3 className="text-lg font-semibold flex items-center gap-2 mb-4">
                                <Info className="w-5 h-5 text-brand-400" />
                                Agency Information
                            </h3>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Agency Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Pixel Perfect SEO"
                                    className="input-base w-full focus:ring-brand-500/50"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Website URL</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                                    <input
                                        type="url"
                                        placeholder="https://agency-website.com"
                                        className="input-base w-full pl-10 focus:ring-brand-500/50"
                                        value={formData.website}
                                        onChange={e => setFormData({ ...formData, website: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-muted-foreground">Description</label>
                                <textarea
                                    className="input-base w-full min-h-[120px] py-3 focus:ring-brand-500/50"
                                    placeholder="Brief overview of the agency..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                        </div>

                        {/* Feature Toggles */}
                        <div className="glass-card p-6 space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-brand-400" />
                                    Platform Controls
                                </h3>
                                <div className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground bg-white/5 px-2 py-1 rounded">
                                    {selectedFeatures.length} / {AVAILABLE_FEATURES.length} Features
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {AVAILABLE_FEATURES.map((feature) => (
                                    <div
                                        key={feature.id}
                                        onClick={() => toggleFeature(feature.id)}
                                        className={cn(
                                            "p-4 rounded-xl border transition-all cursor-pointer group",
                                            selectedFeatures.includes(feature.id)
                                                ? "bg-brand-500/5 border-brand-500/30 ring-1 ring-brand-500/10"
                                                : "bg-white/2 border-white/5 hover:border-white/20"
                                        )}
                                    >
                                        <div className="flex items-start justify-between">
                                            <div className={cn(
                                                "p-2 rounded-lg mb-3 transition-colors",
                                                selectedFeatures.includes(feature.id) ? "bg-brand-500/20 text-brand-400" : "bg-white/5 text-muted-foreground group-hover:bg-white/10"
                                            )}>
                                                <feature.icon className="w-5 h-5" />
                                            </div>
                                            <div className={cn(
                                                "w-5 h-5 rounded-full border flex items-center justify-center transition-all",
                                                selectedFeatures.includes(feature.id) ? "bg-brand-500 border-brand-500" : "border-white/20"
                                            )}>
                                                {selectedFeatures.includes(feature.id) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                            </div>
                                        </div>
                                        <h4 className={cn("font-bold text-sm", selectedFeatures.includes(feature.id) ? "text-white" : "text-muted-foreground")}>{feature.name}</h4>
                                        <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1">{feature.description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="glass-card p-6 border-brand-500/20 bg-brand-500/[0.02]">
                            <h4 className="text-sm font-bold uppercase tracking-widest text-brand-400 mb-4 flex items-center gap-2">
                                <Building2 className="w-4 h-4" />
                                Preview
                            </h4>
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10 mb-6">
                                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-brand-400 font-bold text-xl">
                                    {formData.name?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold truncate">{formData.name || 'New Agency'}</p>
                                    <p className="text-[11px] text-muted-foreground">{formData.website || 'No website yet'}</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                                    <span className="text-muted-foreground">Initial Status</span>
                                    <span className="text-green-400 font-bold">ACTIVE</span>
                                </div>
                                <div className="flex items-center justify-between text-xs py-2 border-b border-white/5">
                                    <span className="text-muted-foreground">Default Role</span>
                                    <span className="text-blue-400 font-bold">MANAGER</span>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary w-full py-4 shadow-xl shadow-brand-500/20 group relative overflow-hidden"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-2">
                                {isLoading ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                        Create Agency
                                    </>
                                )}
                            </span>
                            <div className="absolute inset-0 bg-gradient-to-r from-brand-400 to-accent-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>

                        <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 flex gap-3">
                            <Info className="w-4 h-4 text-orange-400 shrink-0" />
                            <p className="text-[10px] text-orange-200/60 leading-relaxed italic">
                                Note: Once created, you will need to add manually assigned users as Managers for this agency from the User Management panel.
                            </p>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
}
