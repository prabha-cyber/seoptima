'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Plus, Zap, Play, Pause, Settings, AlertTriangle, CheckCircle2, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const triggers = [
    { id: 'SEO_SCORE_DROP', label: 'SEO Score Drops', icon: AlertTriangle },
    { id: 'BROKEN_LINK_FOUND', label: 'Broken Link Found', icon: AlertTriangle },
    { id: 'NEW_PRODUCT_CREATED', label: 'New Product Created', icon: Plus },
    { id: 'MISSING_SCHEMA', label: 'Schema Missing', icon: FileCheck },
];

const actions = [
    { id: 'AI_OPTIMIZE_META', label: 'AI Optimize Meta' },
    { id: 'GENERATE_SCHEMA', label: 'Generate Schema' },
    { id: 'SEND_NOTIFICATION', label: 'Send Notification' },
    { id: 'UPDATE_SITEMAP', label: 'Update Sitemap' },
];

const rules = [
    { id: 1, name: 'Auto-fix missing meta', trigger: 'SEO Score Drops', action: 'AI Optimize Meta', active: true, runs: 12 },
    { id: 2, name: 'Schema on new products', trigger: 'New Product Created', action: 'Generate Schema', active: true, runs: 7 },
    { id: 3, name: 'Alert on broken links', trigger: 'Broken Link Found', action: 'Send Notification', active: false, runs: 3 },
];

export default function AutomationPage() {
    const [activeRules, setActiveRules] = useState(rules.map((r) => ({ ...r })));

    function toggleRule(id: number) {
        setActiveRules((rs) => rs.map((r) => r.id === id ? { ...r, active: !r.active } : r));
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-display flex items-center gap-2">
                        <Bot className="w-6 h-6 text-brand-400" />
                        Automation Engine
                    </h1>
                    <p className="text-muted-foreground mt-1">Self-healing SEO — triggers that fire actions automatically</p>
                </div>
                <button className="btn-primary gap-2">
                    <Plus className="w-4 h-4" />
                    New Rule
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                {[
                    { label: 'Active Rules', value: activeRules.filter((r) => r.active).length, color: 'text-green-400' },
                    { label: 'Total Runs', value: activeRules.reduce((a, r) => a + r.runs, 0), color: 'text-brand-400' },
                    { label: 'Issues Auto-Fixed', value: 22, color: 'text-accent-400' },
                ].map((stat) => (
                    <div key={stat.label} className="glass-card p-4 text-center">
                        <p className={cn('text-3xl font-bold font-display', stat.color)}>{stat.value}</p>
                        <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Rules list */}
            <div className="glass-card divide-y divide-white/8">
                <div className="p-4 flex items-center justify-between">
                    <h2 className="font-semibold flex items-center gap-2">
                        <Zap className="w-4 h-4 text-brand-400" />
                        Automation Rules
                    </h2>
                </div>
                {activeRules.map((rule, i) => (
                    <motion.div
                        key={rule.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="p-4 flex items-center gap-4"
                    >
                        <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{rule.name}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">
                                <span className="text-brand-400">When:</span> {rule.trigger} →{' '}
                                <span className="text-accent-400">Then:</span> {rule.action}
                            </p>
                        </div>
                        <span className="text-xs text-muted-foreground">{rule.runs} runs</span>
                        <button
                            onClick={() => toggleRule(rule.id)}
                            className={cn(
                                'w-11 h-6 rounded-full transition-all duration-300 relative flex-shrink-0',
                                rule.active ? 'bg-brand-500' : 'bg-white/15'
                            )}
                        >
                            <span className={cn(
                                'absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all duration-300',
                                rule.active ? 'left-[calc(100%-1.375rem)]' : 'left-0.5'
                            )} />
                        </button>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
