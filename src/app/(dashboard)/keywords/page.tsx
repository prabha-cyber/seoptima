'use client';

import { useState, useEffect } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Plus,
    Search,
    Filter,
    Download,
    Trash2,
    RefreshCw,
    LineChart as LineChartIcon,
    Globe,
    BarChart3,
    AlertCircle
} from 'lucide-react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface Ranking {
    position: number;
    bestPosition: number;
    change: number;
    recordedAt: string;
}

interface Keyword {
    id: string;
    term: string;
    targetUrl: string | null;
    status: string;
    rankings: Ranking[];
}

export default function KeywordsPage() {
    const [keywords, setKeywords] = useState<Keyword[]>([]);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
    const [newKeyword, setNewKeyword] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [websiteId, setWebsiteId] = useState<string | null>(null);

    useEffect(() => {
        fetchWebsites();
    }, []);

    const fetchWebsites = async () => {
        try {
            const res = await fetch('/api/websites');
            const data = await res.json();
            if (data.length > 0) {
                setWebsiteId(data[0].id);
                fetchKeywords(data[0].id);
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Failed to fetch websites:', error);
            setLoading(false);
        }
    };

    const fetchKeywords = async (id: string) => {
        try {
            const res = await fetch(`/api/keywords/track?websiteId=${id}`);
            const data = await res.json();
            setKeywords(data);
        } catch (error) {
            console.error('Failed to fetch keywords:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddKeyword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKeyword || !websiteId) return;

        try {
            const res = await fetch('/api/keywords/track', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ websiteId, term: newKeyword }),
            });

            if (res.ok) {
                setNewKeyword('');
                fetchKeywords(websiteId);
            }
        } catch (error) {
            console.error('Failed to add keyword:', error);
        }
    };

    const handleDeleteKeyword = async (id: string) => {
        if (!confirm('Are you sure you want to stop tracking this keyword?')) return;

        try {
            const res = await fetch(`/api/keywords/track?id=${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setKeywords(prev => prev.filter(k => k.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete keyword:', error);
        }
    };

    const handleSync = async () => {
        if (!websiteId) return;
        setSyncing(true);
        try {
            await fetch('/api/keywords/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ websiteId }),
            });
            await fetchKeywords(websiteId);
        } catch (error) {
            console.error('Failed to sync keywords:', error);
        } finally {
            setSyncing(false);
        }
    };

    const filteredKeywords = keywords.filter(k =>
        k.term.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Keyword Tracking</h1>
                    <p className="text-gray-400">Monitor your search engine rankings and performance</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handleSync}
                        disabled={syncing}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                        Sync Now
                    </button>
                    <form onSubmit={handleAddKeyword} className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Add new keyword..."
                            value={newKeyword}
                            onChange={(e) => setNewKeyword(e.target.value)}
                            className="px-4 py-2 bg-background border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[200px]"
                        />
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add
                        </button>
                    </form>
                </div>
            </div>

            {keywords.length === 0 ? (
                <div className="bg-white/5 border border-dashed border-white/10 rounded-2xl p-12 text-center">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <LineChartIcon className="w-8 h-8 text-blue-500" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">No keywords tracked yet</h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                        Start tracking your SEO performance by adding your first keyword above.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-400">Avg. Position</span>
                                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                                    <BarChart3 className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {(keywords.reduce((acc, k) => acc + (k.rankings[0]?.position || 0), 0) / keywords.length).toFixed(1)}
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-400">Top 10 Keywords</span>
                                <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
                                    <TrendingUp className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-white">
                                {keywords.filter(k => k.rankings[0]?.position <= 10).length}
                            </div>
                        </div>
                        <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-400">Tracked Keywords</span>
                                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                    <Globe className="w-4 h-4" />
                                </div>
                            </div>
                            <div className="text-2xl font-bold text-white">{keywords.length}</div>
                        </div>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                        <div className="p-4 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="relative flex-1 max-w-md">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Filter keywords..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 bg-black/20 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-gray-400">
                                    <Filter className="w-4 h-4" />
                                </button>
                                <button className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 text-gray-400">
                                    <Download className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/5">
                                        <th className="px-6 py-4 text-sm font-medium text-gray-400 border-b border-white/10">Keyword</th>
                                        <th className="px-6 py-4 text-sm font-medium text-gray-400 border-b border-white/10">Position</th>
                                        <th className="px-6 py-4 text-sm font-medium text-gray-400 border-b border-white/10">Change</th>
                                        <th className="px-6 py-4 text-sm font-medium text-gray-400 border-b border-white/10">Best</th>
                                        <th className="px-6 py-4 text-sm font-medium text-gray-400 border-b border-white/10">History</th>
                                        <th className="px-6 py-4 text-sm font-medium text-gray-400 border-b border-white/10">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {filteredKeywords.map((kw) => {
                                        const currentRank = kw.rankings[0];
                                        const change = currentRank?.change || 0;

                                        return (
                                            <tr key={kw.id} className="hover:bg-white/[0.02] transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="text-white font-medium">{kw.term}</div>
                                                    {kw.targetUrl && (
                                                        <div className="text-xs text-gray-500 truncate max-w-xs">{kw.targetUrl}</div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="text-lg font-semibold text-white">
                                                        {currentRank?.position || '-'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {change !== 0 ? (
                                                        <div className={`flex items-center gap-1 text-sm font-medium ${change > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                                            {change > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                                            {Math.abs(change)}
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-500">-</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-gray-300">
                                                    {currentRank?.bestPosition || '-'}
                                                </td>
                                                <td className="px-6 py-4 min-w-[120px]">
                                                    <div className="h-10 w-24">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <LineChart data={[...kw.rankings].reverse()}>
                                                                <Line
                                                                    type="monotone"
                                                                    dataKey="position"
                                                                    stroke="#3b82f6"
                                                                    strokeWidth={2}
                                                                    dot={false}
                                                                    connectNulls
                                                                />
                                                                <YAxis hide domain={['dataMax + 5', 'dataMin - 5']} reversed />
                                                            </LineChart>
                                                        </ResponsiveContainer>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button
                                                        onClick={() => handleDeleteKeyword(kw.id)}
                                                        className="p-2 text-gray-500 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
