'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2, Type, Building2, Target } from 'lucide-react';

export default function AiWizardPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isGenerating, setIsGenerating] = useState(false);

    const [formData, setFormData] = useState({
        businessName: '',
        industry: '',
        targetAudience: '',
        tone: 'professional'
    });

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const res = await fetch('/api/ai/generate-site', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                const data = await res.json();
                router.push(`/builder/${data.websiteId}`);
            } else {
                console.error('Failed to generate website');
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-accent-500 mb-4 shadow-lg shadow-brand-500/20">
                    <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl font-display font-bold">AI Website Generator</h1>
                <p className="text-muted-foreground text-lg">Tell us about your business, and we&apos;ll generate a complete, SEO-optimized website in seconds.</p>
            </div>

            <div className="glass-card p-8 relative overflow-hidden">
                {isGenerating && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex flex-col items-center justify-center"
                    >
                        <Loader2 className="w-12 h-12 text-brand-500 animate-spin mb-4" />
                        <h3 className="text-2xl font-bold font-display bg-gradient-to-r from-brand-500 to-accent-500 bg-clip-text text-transparent">
                            Generating your website...
                        </h3>
                        <p className="text-muted-foreground mt-2">Writing copy, designing layout, optimizing SEO...</p>
                    </motion.div>
                )}

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Type className="w-4 h-4" /> Business Name
                        </label>
                        <input
                            type="text"
                            value={formData.businessName}
                            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                            placeholder="e.g. Acme Studio"
                            className="input-base"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Building2 className="w-4 h-4" /> Industry / Niche
                        </label>
                        <input
                            type="text"
                            value={formData.industry}
                            onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                            placeholder="e.g. Digital Marketing Agency"
                            className="input-base"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                            <Target className="w-4 h-4" /> Describe your target audience
                        </label>
                        <textarea
                            value={formData.targetAudience}
                            onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                            placeholder="e.g. Small business owners looking to scale..."
                            className="input-base min-h-[100px] py-3"
                        />
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={!formData.businessName || !formData.industry}
                        className="btn-primary w-full justify-center py-4 text-lg"
                    >
                        Generate Website <ArrowRight className="w-5 h-5 ml-2" />
                    </button>
                </div>
            </div>
        </div>
    );
}
