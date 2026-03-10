'use client';

import { motion } from 'framer-motion';
import { Check, Zap, Crown, Building2, Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const plans = [
    {
        id: 'FREE',
        name: 'Free',
        price: 0,
        period: 'forever',
        icon: Zap,
        color: 'text-muted-foreground',
        gradFrom: 'from-slate-600',
        gradTo: 'to-slate-500',
        features: [
            '1 website',
            '50 AI credits / month',
            'Basic SEO analysis',
            'SEO score & reports',
            'Free subdomain',
            'Seoptima watermark',
        ],
        cta: 'Current Plan',
        current: true,
    },
    {
        id: 'GROWTH',
        name: 'Growth',
        price: 29,
        period: 'month',
        icon: TrendingUpIcon,
        color: 'text-brand-400',
        gradFrom: 'from-brand-600',
        gradTo: 'to-brand-400',
        features: [
            '5 websites',
            '500 AI credits / month',
            'Full SEO dashboard',
            'Technical SEO tools',
            'Custom domain',
            'Monthly PDF reports',
        ],
        cta: 'Upgrade to Growth',
        current: false,
    },
    {
        id: 'PRO',
        name: 'Pro',
        price: 79,
        period: 'month',
        icon: Crown,
        color: 'text-accent-400',
        gradFrom: 'from-accent-600',
        gradTo: 'to-brand-500',
        popular: true,
        features: [
            'Unlimited websites',
            '2,000 AI credits / month',
            'AI website generator',
            'Ads analysis (Google + Meta)',
            'Automation engine',
            'Schema auto-generator',
            'Priority support',
        ],
        cta: 'Upgrade to Pro',
        current: false,
    },
    {
        id: 'AGENCY',
        name: 'Agency',
        price: 199,
        period: 'month',
        icon: Building2,
        color: 'text-orange-400',
        gradFrom: 'from-orange-600',
        gradTo: 'to-yellow-500',
        features: [
            'Unlimited websites',
            '10,000 AI credits / month',
            'White-label reports',
            'Client management',
            'Team access (10 seats)',
            'API access',
            'Dedicated support',
            'Custom integrations',
        ],
        cta: 'Upgrade to Agency',
        current: false,
    },
];

function TrendingUpIcon({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>;
}

export default function BillingPage() {
    return (
        <div className="space-y-8 animate-fade-in">
            <div>
                <h1 className="text-2xl font-bold font-display">Billing & Plans</h1>
                <p className="text-muted-foreground mt-1">Manage your subscription and usage</p>
            </div>

            {/* Current plan banner */}
            <div className="glass-card p-5 border-brand-500/30 bg-brand-500/5 flex items-center justify-between flex-wrap gap-4">
                <div>
                    <p className="text-sm text-muted-foreground">You are on the</p>
                    <p className="font-bold text-lg font-display text-brand-400">Free Plan</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                    <span className="text-muted-foreground">AI Credits: <strong className="text-foreground">127 / 50</strong></span>
                    <span className="text-muted-foreground">Websites: <strong className="text-foreground">1 / 1</strong></span>
                </div>
            </div>

            {/* Plans grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {plans.map((plan, i) => {
                    const Icon = plan.icon;
                    return (
                        <motion.div
                            key={plan.id}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className={cn(
                                'glass-card p-6 relative flex flex-col',
                                plan.popular && 'border-brand-500/40 bg-brand-500/5'
                            )}
                        >
                            {plan.popular && (
                                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                                    <span className="bg-gradient-to-r from-brand-600 to-accent-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                                        <Sparkles className="w-3 h-3" /> Most Popular
                                    </span>
                                </div>
                            )}

                            <div className="mb-5">
                                <div className={cn('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-3', plan.gradFrom, plan.gradTo)}>
                                    <Icon className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="font-bold font-display text-lg">{plan.name}</h3>
                                <div className="flex items-end gap-1 mt-1">
                                    <span className="text-3xl font-bold font-display">${plan.price}</span>
                                    <span className="text-muted-foreground text-sm mb-1">/{plan.period}</span>
                                </div>
                            </div>

                            <ul className="space-y-2.5 flex-1">
                                {plan.features.map((f) => (
                                    <li key={f} className="flex items-start gap-2 text-sm">
                                        <Check className="w-3.5 h-3.5 text-green-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-muted-foreground">{f}</span>
                                    </li>
                                ))}
                            </ul>

                            <button
                                disabled={plan.current}
                                className={cn(
                                    'mt-6 w-full py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2',
                                    plan.current
                                        ? 'bg-white/8 text-muted-foreground cursor-default'
                                        : plan.popular
                                            ? 'btn-primary'
                                            : 'btn-secondary'
                                )}
                            >
                                {plan.cta}
                                {!plan.current && <ArrowRight className="w-3.5 h-3.5" />}
                            </button>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}
