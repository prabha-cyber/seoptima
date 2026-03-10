'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Loader2, Key, BarChart3, TrendingUp, Download, CheckCircle2,
    Filter, LayoutGrid, List, ChevronDown, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { showToast } from '@/components/ui/toaster';
import { CountrySelector } from '@/components/ui/CountrySelector';
import { COUNTRIES } from '@/lib/constants/countries';

type IntentType = 'Commercial' | 'Informational' | 'Transactional' | 'Navigational';
type TailType = 'Short Tail' | 'Long Tail';

interface KeywordData {
    keyword: string;
    intent: IntentType;
    volume: number;
    traffic: number;
    type: TailType;
}

const intentConfig: Record<IntentType, { color: string, bg: string }> = {
    Commercial: { color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20' },
    Informational: { color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
    Transactional: { color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
    Navigational: { color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' }
};

export default function KeywordGeneratorPage() {
    const [query, setQuery] = useState('');
    const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]); // Default to US
    const [isGenerating, setIsGenerating] = useState(false);
    const [keywords, setKeywords] = useState<KeywordData[]>([]);

    // Filters
    const [filterTail, setFilterTail] = useState<'All' | TailType>('All');
    const [filterIntent, setFilterIntent] = useState<'All' | IntentType>('All');

    const handleGenerate = async () => {
        if (!query.trim()) return;

        setIsGenerating(true);
        setKeywords([]);

        try {
            const res = await fetch('/api/keywords', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    query: query.trim(),
                    country: selectedCountry.gl
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to generate keywords');
            }

            setKeywords(data.keywords || []);
            showToast('Keywords generated successfully!', 'success');
        } catch (error: any) {
            console.error('Generation Error:', error);
            showToast(error.message, 'error');
        } finally {
            setIsGenerating(false);
        }
    };

    const handleExport = () => {
        if (!keywords.length) return;

        const csvContent = "data:text/csv;charset=utf-8,"
            + "Keyword,Intent,Volume,Traffic,Type\n"
            + keywords.map(k => `"${k.keyword}","${k.intent}",${k.volume},${k.traffic},"${k.type}"`).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `keywords-${query.replace(/ /g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('Exported CSV', 'success');
    };

    // Apply filters
    const filteredKeywords = keywords.filter(k => {
        if (filterTail !== 'All' && k.type !== filterTail) return false;
        if (filterIntent !== 'All' && k.intent !== filterIntent) return false;
        return true;
    });

    const totalVolume = filteredKeywords.reduce((acc, curr) => acc + curr.volume, 0);
    const avgTraffic = filteredKeywords.length ? Math.floor(filteredKeywords.reduce((acc, curr) => acc + curr.traffic, 0) / filteredKeywords.length) : 0;

    return (
        <div className="space-y-8 animate-fade-in pb-20">
            {/* Header / Hero */}
            <div className="relative glass-card p-10 text-center space-y-6">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-500 to-accent-500" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center justify-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/20 mb-6 border border-white/10">
                        <Key className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold font-display tracking-tight mb-4">
                        AI Keyword Generator
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Discover high-volume, contextual keywords for your niche or URL. Instantly uncover search intent and traffic potential.
                    </p>
                </div>

                <div className="relative z-10 max-w-4xl mx-auto mt-8">
                    <div className="flex items-stretch bg-surface/80 border-2 border-white/10 rounded-2xl shadow-xl focus-within:border-brand-500 focus-within:ring-4 focus-within:ring-brand-500/20 transition-all group">
                        <div className="flex items-center pl-6 pointer-events-none">
                            <Search className="w-6 h-6 text-brand-400" />
                        </div>
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
                            placeholder="Enter a website URL or seed keyword (e.g. 'Coffee Beans')"
                            className="flex-1 h-16 pl-4 pr-4 text-lg bg-transparent border-none focus:outline-none font-medium placeholder:text-muted-foreground/60"
                        />
                        <CountrySelector
                            selectedCountry={selectedCountry}
                            onSelect={setSelectedCountry}
                        />
                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !query.trim()}
                            className="px-8 flex items-center gap-2 bg-gradient-brand text-white font-bold rounded-r-2xl transition-all disabled:opacity-50 disabled:grayscale hover:brightness-110 active:scale-95"
                        >
                            {isGenerating ? (
                                <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
                            ) : (
                                <><Sparkles className="w-5 h-5" /> Analyze</>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Loading State */}
            {isGenerating && (
                <div className="glass-card p-12 flex flex-col items-center justify-center space-y-4">
                    <div className="relative w-20 h-20">
                        <div className="absolute inset-0 border-4 border-brand-500/20 rounded-full" />
                        <div className="absolute inset-0 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
                        <Key className="absolute inset-0 m-auto w-6 h-6 text-brand-500 animate-pulse" />
                    </div>
                    <h3 className="text-2xl font-display font-bold text-foreground">Analyzing Search Topography...</h3>
                    <p className="text-muted-foreground max-w-md text-center">
                        Our AI is diving deep into search engines to extract the most lucrative keywords, calculating intent, and predicting organic traffic.
                    </p>
                </div>
            )}

            {/* Results Section */}
            {!isGenerating && keywords.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                    {/* Insights Hub */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="glass-card p-6 flex flex-col justify-center space-y-2 border-l-4 border-brand-500">
                            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <List className="w-4 h-4" /> Total Found
                            </span>
                            <span className="text-4xl font-display font-bold">{filteredKeywords.length}</span>
                        </div>
                        <div className="glass-card p-6 flex flex-col justify-center space-y-2 border-l-4 border-accent-500">
                            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" /> Combined Volume
                            </span>
                            <span className="text-4xl font-display font-bold">
                                {totalVolume >= 1000 ? (totalVolume / 1000).toFixed(1) + 'k' : totalVolume}
                            </span>
                        </div>
                        <div className="glass-card p-6 flex flex-col justify-center space-y-2 border-l-4 border-green-500">
                            <span className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                                <TrendingUp className="w-4 h-4" /> Avg Potential Traffic
                            </span>
                            <span className="text-4xl font-display font-bold text-green-400">
                                {avgTraffic >= 1000 ? (avgTraffic / 1000).toFixed(1) + 'k' : avgTraffic}
                            </span>
                        </div>
                    </div>

                    {/* Filters & Table */}
                    <div className="glass-card flex flex-col overflow-hidden">

                        {/* Filters toolbar */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between p-6 border-b border-white/10 gap-4 bg-surface/50">
                            <div className="flex flex-wrap items-center gap-3">
                                <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1 border border-white/10">
                                    {(['All', 'Short Tail', 'Long Tail'] as const).map(tail => (
                                        <button
                                            key={tail}
                                            onClick={() => setFilterTail(tail)}
                                            className={cn(
                                                "px-4 py-2 rounded-md text-sm font-medium transition-all",
                                                filterTail === tail ? "bg-brand-500/20 text-brand-400 shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                                            )}
                                        >
                                            {tail}
                                        </button>
                                    ))}
                                </div>
                                <div className="h-8 w-[1px] bg-white/10 hidden md:block" />
                                <select
                                    className="input-base w-auto appearance-none bg-white/5"
                                    value={filterIntent}
                                    onChange={(e) => setFilterIntent(e.target.value as any)}
                                >
                                    <option value="All">All Intents 🎯</option>
                                    <option value="Commercial">Commercial 🛍️</option>
                                    <option value="Informational">Informational 📚</option>
                                    <option value="Transactional">Transactional 💳</option>
                                    <option value="Navigational">Navigational 🧭</option>
                                </select>
                            </div>

                            <button onClick={handleExport} className="btn-secondary whitespace-nowrap">
                                <Download className="w-4 h-4" /> Export CSV
                            </button>
                        </div>

                        {/* Table */}
                        <div className="w-full overflow-x-auto custom-scroll">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/5 border-b border-white/10 text-sm font-medium text-muted-foreground uppercase tracking-wider">
                                        <th className="px-6 py-4">Keyword</th>
                                        <th className="px-6 py-4">Search Intent</th>
                                        <th className="px-6 py-4">Est. Volume</th>
                                        <th className="px-6 py-4">Traffic Potential</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <AnimatePresence>
                                        {filteredKeywords.length === 0 ? (
                                            <tr>
                                                <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                                                    No keywords match your current filters.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredKeywords.map((k, i) => {
                                                const config = intentConfig[k.intent];
                                                return (
                                                    <motion.tr
                                                        key={k.keyword + i}
                                                        initial={{ opacity: 0, y: 10 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        exit={{ opacity: 0 }}
                                                        className="border-b border-white/5 hover:bg-white-[0.02] transition-colors group"
                                                    >
                                                        <td className="px-6 py-4">
                                                            <div className="flex flex-col">
                                                                <span className="font-semibold text-foreground">{k.keyword}</span>
                                                                <span className="text-xs text-muted-foreground mt-1 uppercase tracking-widest flex items-center gap-1">
                                                                    <LayoutGrid className="w-3 h-3" /> {k.type}
                                                                </span>
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className={cn('px-3 py-1.5 rounded-full text-xs font-bold border', config.bg, config.color)}>
                                                                {k.intent}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 font-mono font-medium">
                                                            {k.volume.toLocaleString()}
                                                        </td>
                                                        <td className="px-6 py-4 font-mono font-bold text-green-400 group-hover:text-green-300 transition-colors">
                                                            +{k.traffic.toLocaleString()}
                                                        </td>
                                                    </motion.tr>
                                                )
                                            })
                                        )}
                                    </AnimatePresence>
                                </tbody>
                            </table>
                        </div>

                    </div>
                </motion.div>
            )}
        </div>
    );
}
