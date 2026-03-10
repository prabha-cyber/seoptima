'use client';

import { useState, useEffect } from 'react';
import {
    Users,
    Plus,
    Search,
    BarChart3,
    Globe,
    Shield,
    Trash2,
    AlertTriangle
} from 'lucide-react';

interface Competitor {
    id: string;
    name: string;
    url: string;
    createdAt: string;
}

export default function CompetitorsPage() {
    const [competitors, setCompetitors] = useState<Competitor[]>([]);
    const [loading, setLoading] = useState(true);
    const [newCompetitor, setNewCompetitor] = useState({ name: '', url: '' });
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
                fetchCompetitors(data[0].id);
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Failed to fetch websites:', error);
            setLoading(false);
        }
    };

    const fetchCompetitors = async (id: string) => {
        try {
            const res = await fetch(`/api/competitors?websiteId=${id}`);
            const data = await res.json();
            setCompetitors(data);
        } catch (error) {
            console.error('Failed to fetch competitors:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddCompetitor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newCompetitor.name || !newCompetitor.url || !websiteId) return;

        try {
            const res = await fetch('/api/competitors', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...newCompetitor, websiteId }),
            });

            if (res.ok) {
                setNewCompetitor({ name: '', url: '' });
                fetchCompetitors(websiteId);
            }
        } catch (error) {
            console.error('Failed to add competitor:', error);
        }
    };

    const handleDeleteCompetitor = async (id: string) => {
        if (!confirm('Are you sure you want to stop tracking this competitor?')) return;

        try {
            const res = await fetch(`/api/competitors?id=${id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                setCompetitors(prev => prev.filter(c => c.id !== id));
            }
        } catch (error) {
            console.error('Failed to delete competitor:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">Competitor Analysis</h1>
                    <p className="text-gray-400">Track and compare your performance against competitors</p>
                </div>
                <form onSubmit={handleAddCompetitor} className="flex gap-2">
                    <input
                        type="text"
                        placeholder="Name (e.g. Competitor X)"
                        value={newCompetitor.name}
                        onChange={(e) => setNewCompetitor({ ...newCompetitor, name: e.target.value })}
                        className="px-4 py-2 bg-background border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                        type="text"
                        placeholder="URL (e.g. example.com)"
                        value={newCompetitor.url}
                        onChange={(e) => setNewCompetitor({ ...newCompetitor, url: e.target.value })}
                        className="px-4 py-2 bg-background border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        type="submit"
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Add
                    </button>
                </form>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 bg-white/5 border border-white/10 rounded-xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <BarChart3 className="w-32 h-32" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-blue-500" />
                        Market Share Comparison
                    </h3>
                    <div className="h-64 flex items-center justify-center text-gray-500 border border-dashed border-white/10 rounded-lg">
                        Connect search data to view market share analysis
                    </div>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <h3 className="text-lg font-medium text-white mb-6 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-purple-500" />
                        Top Competitors
                    </h3>
                    <div className="space-y-4">
                        {competitors.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-8">No competitors added yet</p>
                        ) : (
                            competitors.map(c => (
                                <div key={c.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg group">
                                    <div>
                                        <div className="text-sm font-medium text-white">{c.name}</div>
                                        <div className="text-xs text-gray-400">{c.url}</div>
                                    </div>
                                    <button
                                        onClick={() => handleDeleteCompetitor(c.id)}
                                        className="p-1.5 text-gray-500 hover:text-rose-400 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 flex flex-col md:flex-row items-center gap-6">
                <div className="p-3 bg-amber-500/20 rounded-full text-amber-500">
                    <AlertTriangle className="w-8 h-8" />
                </div>
                <div className="flex-1 text-center md:text-left">
                    <h4 className="text-lg font-semibold text-amber-500 mb-1">Coming Soon: Domain Overlap</h4>
                    <p className="text-amber-500/70">
                        We are working on bringing you deep insights into keyword overlaps and gaps between you and your competitors.
                    </p>
                </div>
                <button className="px-6 py-2 bg-amber-500 text-black font-semibold rounded-lg hover:bg-amber-400 transition-colors whitespace-nowrap">
                    Get notified
                </button>
            </div>
        </div>
    );
}
