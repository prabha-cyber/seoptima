'use client';

import { useState, useEffect } from 'react';
import {
    Newspaper, Plus, Search, Filter, Edit2, Trash2,
    CheckCircle2, Clock, Globe, Tag, Layers,
    ArrowUpRight, FileText, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CMSManagementPage() {
    const [posts, setPosts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('posts');

    useEffect(() => {
        async function fetchPosts() {
            try {
                const res = await fetch('/api/admin/cms/posts');
                const data = await res.json();
                if (res.ok) setPosts(data);
            } catch (error) {
                console.error('Failed to fetch posts:', error);
            } finally {
                setIsLoading(false);
            }
        }
        fetchPosts();
    }, []);

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-display">CMS Management</h1>
                    <p className="text-muted-foreground mt-1">Manage global content, blog posts, and taxonomy.</p>
                </div>
                <button className="btn-primary py-2 text-sm">
                    <Plus className="w-4 h-4" />
                    New Post
                </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-white/8">
                {['posts', 'categories', 'tags'].map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                            "px-6 py-3 text-sm font-medium transition-all capitalize relative",
                            activeTab === tab ? "text-brand-400" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        {tab}
                        {activeTab === tab && (
                            <motion.div
                                layoutId="cmsTab"
                                className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-400"
                            />
                        )}
                    </button>
                ))}
            </div>

            {activeTab === 'posts' && (
                <>
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search posts..."
                                className="input-base pl-10 w-full"
                            />
                        </div>
                        <button className="btn-secondary h-full px-4 flex items-center gap-2">
                            <Filter className="w-4 h-4" />
                            Status
                        </button>
                    </div>

                    <div className="glass-card overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-white/8 bg-white/2">
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Title</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Website</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categories</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/4">
                                {isLoading ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">Loading...</td></tr>
                                ) : posts.length === 0 ? (
                                    <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground italic">No posts found.</td></tr>
                                ) : posts.map(post => (
                                    <tr key={post.id} className="hover:bg-white/2 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded bg-white/5 border border-white/10 flex items-center justify-center text-muted-foreground overflow-hidden">
                                                    {post.featuredImg ? (
                                                        <img src={post.featuredImg} className="w-full h-full object-cover" alt="" />
                                                    ) : <FileText className="w-5 h-5" />}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{post.title}</p>
                                                    <p className="text-[10px] text-muted-foreground truncate italic">/{post.slug}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs text-brand-400 font-medium">{post.website?.name}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {post.categories?.map((c: any) => (
                                                    <span key={c.category.id} className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-muted-foreground">
                                                        {c.category.name}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-2 py-0.5 rounded text-[10px] font-bold uppercase border",
                                                post.status === 'PUBLISHED' ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
                                            )}>
                                                {post.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right text-muted-foreground group-hover:text-foreground">
                                            <button className="p-1.5 hover:bg-white/10 rounded-lg"><Edit2 className="w-3.5 h-3.5" /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            )}
        </div>
    );
}
