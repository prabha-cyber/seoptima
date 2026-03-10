'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Copy, RefreshCw, ChevronDown, Zap, Tag, MessageSquare, HelpCircle, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

const tools = [
    {
        id: 'title',
        label: 'Title Generator',
        icon: Tag,
        color: 'from-brand-600 to-brand-500',
        desc: 'Generate SEO-optimized page titles',
        placeholder: 'Describe your page or product...',
        outputLabel: 'Generated Titles',
    },
    {
        id: 'meta',
        label: 'Meta Description',
        icon: FileText,
        color: 'from-accent-600 to-accent-500',
        desc: 'Create compelling meta descriptions',
        placeholder: 'Enter your page topic or title...',
        outputLabel: 'Generated Descriptions',
    },
    {
        id: 'product',
        label: 'Product Description',
        icon: MessageSquare,
        color: 'from-green-600 to-green-500',
        desc: 'Write SEO product descriptions',
        placeholder: 'Enter product name and key features...',
        outputLabel: 'Generated Description',
    },
    {
        id: 'faq',
        label: 'FAQ Generator',
        icon: HelpCircle,
        color: 'from-orange-600 to-orange-500',
        desc: 'Generate FAQs for AEO optimization',
        placeholder: 'Enter your product, service, or topic...',
        outputLabel: 'Generated FAQs',
    },
];

const sampleOutputs: Record<string, string[]> = {
    title: [
        '🏆 Best [Product] in 2025 — Trusted by 10,000+ Customers',
        '🚀 [Product]: The Ultimate Solution for [Problem] | Free Trial',
        '⚡ [Product] Reviews & Pricing — #1 Rated [Category] Tool',
    ],
    meta: [
        'Discover our industry-leading [product] that helps businesses grow faster. Join 10,000+ satisfied customers. Start your free trial today — no credit card required.',
        'Looking for the best [product]? Our award-winning solution delivers results in [timeframe]. See why experts recommend us. Try free for 14 days.',
    ],
    product: [
        'Transform your business with [Product Name] — the most powerful [category] solution on the market. Designed for teams who demand excellence, our platform delivers [key benefit], [key benefit], and [key benefit] all in one place.\n\nWith advanced [feature] and seamless [integration], you\'ll achieve [goal] faster than ever before. Trusted by [number]+ businesses worldwide.',
    ],
    faq: [
        'Q: What is [product] and how does it work?\nA: [Product] is a [description]. It works by [explanation], making it easy to [benefit].\n\nQ: How much does [product] cost?\nA: We offer flexible pricing starting from $[price]/month. All plans include [feature]. Start free with no credit card required.\n\nQ: Is [product] suitable for small businesses?\nA: Absolutely! [Product] is designed for businesses of all sizes, from solo founders to enterprise teams.',
    ],
};

export default function AiToolsPage() {
    const [activeTool, setActiveTool] = useState(tools[0]);
    const [input, setInput] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [output, setOutput] = useState<string[]>([]);
    const [credits, setCredits] = useState(127);
    const [copied, setCopied] = useState<number | null>(null);

    async function generate() {
        if (!input.trim() || isGenerating) return;
        setIsGenerating(true);
        setOutput([]);

        await new Promise((r) => setTimeout(r, 1800));

        const results = sampleOutputs[activeTool.id] || ['No output generated'];
        setOutput(results);
        setCredits((c) => Math.max(0, c - 1));
        setIsGenerating(false);
    }

    async function copyText(text: string, i: number) {
        await navigator.clipboard.writeText(text);
        setCopied(i);
        setTimeout(() => setCopied(null), 2000);
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-display flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-accent-400" />
                        AI SEO Tools
                    </h1>
                    <p className="text-muted-foreground mt-1">Generate optimized content powered by GPT-4o</p>
                </div>
                <div className="glass-card px-4 py-2.5 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-accent-400" />
                    <span className="text-sm font-semibold text-accent-400">{credits}</span>
                    <span className="text-xs text-muted-foreground">AI credits</span>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Tool selector */}
                <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Choose Tool</h2>
                    {tools.map((tool, i) => {
                        const Icon = tool.icon;
                        const isActive = activeTool.id === tool.id;
                        return (
                            <motion.button
                                key={tool.id}
                                initial={{ opacity: 0, x: -12 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.07 }}
                                onClick={() => { setActiveTool(tool); setOutput([]); setInput(''); }}
                                className={cn(
                                    'w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all duration-200',
                                    isActive
                                        ? 'bg-brand-500/12 border-brand-500/40'
                                        : 'glass-card hover:bg-white/8'
                                )}
                            >
                                <div className={cn('w-9 h-9 rounded-lg bg-gradient-to-br flex items-center justify-center', tool.color)}>
                                    <Icon className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <p className="font-medium text-sm">{tool.label}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{tool.desc}</p>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Generator panel */}
                <div className="xl:col-span-2 space-y-4">
                    <div className="glass-card p-6 space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className={cn('w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center', activeTool.color)}>
                                <activeTool.icon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold">{activeTool.label}</h3>
                                <p className="text-xs text-muted-foreground">{activeTool.desc}</p>
                            </div>
                        </div>

                        <textarea
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={activeTool.placeholder}
                            rows={4}
                            className="input-base resize-none"
                        />

                        <button
                            onClick={generate}
                            disabled={isGenerating || !input.trim() || credits === 0}
                            className="btn-primary w-full justify-center py-3"
                        >
                            {isGenerating ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Generating with AI...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    <Sparkles className="w-4 h-4" />
                                    Generate (1 credit)
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Output */}
                    {output.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass-card p-6 space-y-3"
                        >
                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                {activeTool.outputLabel}
                            </h3>
                            {output.map((text, i) => (
                                <div
                                    key={i}
                                    className="relative p-4 bg-white/5 border border-white/10 rounded-xl group"
                                >
                                    <p className="text-sm whitespace-pre-wrap pr-10">{text}</p>
                                    <button
                                        onClick={() => copyText(text, i)}
                                        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 hover:bg-white/20 rounded-lg p-1.5"
                                    >
                                        <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                                    </button>
                                    {copied === i && (
                                        <span className="absolute top-3 right-3 text-xs text-brand-400 font-medium">Copied!</span>
                                    )}
                                </div>
                            ))}
                            <button
                                onClick={generate}
                                className="btn-ghost text-xs gap-1.5"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Regenerate
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}
