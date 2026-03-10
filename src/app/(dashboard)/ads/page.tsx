'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
    Megaphone, Search, Loader2, Image as ImageIcon, Video, FileText,
    Globe, Calendar, ExternalLink, ChevronDown, ChevronUp, MapPin,
    Eye, Shield, Star, Link2, X, Filter, LayoutGrid
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useCallback } from 'react';

interface AdCreative {
    advertiser_id: string;
    advertiser: string;
    ad_creative_id: string;
    format: string;
    thumbnail: string | null;
    target_domain: string | null;
    link: string | null;
    width: number | null;
    height: number | null;
    total_days_shown: number | null;
    first_shown: string | null;
    last_shown: string | null;
    details_link: string | null;
    title: string | null;
    headline: string | null;
    long_headline: string | null;
    snippet: string | null;
    visible_link: string | null;
    destination_link: string | null;
    advertiser_logo: string | null;
    sitelink_texts: string[];
    sitelink_descriptions: string[];
    video_link: string | null;
    raw_video_link: string | null;
    video_duration: string | null;
    call_to_action: string | null;
    image: string | null;
    rating: number | null;
    reviews: number | null;
    is_verified: boolean;
    extensions: string[];
    ad_funded_by: string | null;
    regions: Array<{
        region: number;
        region_name: string;
        first_shown?: number;
        last_shown?: number;
        times_shown?: string;
    }>;
    hasDetails: boolean;
}

interface AdsData {
    advertiser: string;
    totalResults: number;
    searchQuery: string;
    region: string;
    creativeFormat: string;
    adCreatives: AdCreative[];
    nextPageToken: string | null;
    empty?: boolean;
    message?: string;
    error?: string;
}

const formatOptions = [
    { value: '', label: 'All Formats', icon: LayoutGrid },
    { value: 'text', label: 'Text', icon: FileText },
    { value: 'image', label: 'Image', icon: ImageIcon },
    { value: 'video', label: 'Video', icon: Video },
];

function formatDate(isoString: string | null) {
    if (!isoString) return '—';
    return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(isoString));
}

function FormatBadge({ format }: { format: string }) {
    const config: Record<string, { color: string; icon: React.ElementType }> = {
        text: { color: 'bg-blue-500/15 text-blue-400 border-blue-500/20', icon: FileText },
        image: { color: 'bg-purple-500/15 text-purple-400 border-purple-500/20', icon: ImageIcon },
        video: { color: 'bg-pink-500/15 text-pink-400 border-pink-500/20', icon: Video },
    };
    const c = config[format] || config.text;
    const Icon = c.icon;
    return (
        <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase rounded-full border', c.color)}>
            <Icon className="w-3 h-3" />
            {format}
        </span>
    );
}

function AdDetailPanel({ ad, onClose }: { ad: AdCreative; onClose: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="glass-card p-6 border border-brand-500/20 relative"
        >
            <button onClick={onClose} className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
            </button>

            <div className="flex items-start gap-4 mb-6">
                {ad.advertiser_logo && (
                    <img src={ad.advertiser_logo} alt={ad.advertiser} className="w-12 h-12 rounded-lg object-cover bg-white/10" />
                )}
                <div>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        {ad.title || ad.advertiser}
                        {ad.is_verified && <Shield className="w-4 h-4 text-green-400" />}
                    </h3>
                    <p className="text-sm text-muted-foreground">{ad.advertiser} • {ad.ad_creative_id}</p>
                    {ad.ad_funded_by && <p className="text-xs text-muted-foreground mt-1">Funded by: {ad.ad_funded_by}</p>}
                </div>
            </div>

            {/* Ad Copy */}
            {(ad.headline || ad.snippet) && (
                <div className="bg-black/20 border border-white/5 rounded-lg p-4 mb-5">
                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5" /> Ad Copy
                    </p>
                    {ad.headline && <p className="text-blue-400 font-medium mb-1">{ad.headline}</p>}
                    {ad.long_headline && <p className="text-sm text-blue-300/80 mb-1">{ad.long_headline}</p>}
                    {ad.visible_link && <p className="text-xs text-green-600/80 font-mono mb-1">Ad · {ad.visible_link}</p>}
                    {ad.snippet && <p className="text-sm text-muted-foreground">{ad.snippet}</p>}
                    {ad.call_to_action && (
                        <span className="inline-block mt-2 px-3 py-1 text-xs font-semibold bg-brand-500/20 text-brand-300 rounded-md">
                            {ad.call_to_action}
                        </span>
                    )}
                </div>
            )}

            {/* Image preview */}
            {ad.image && ad.format !== 'video' && (
                <div className="mb-5">
                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Ad Creative</p>
                    <img src={ad.image} alt="Ad creative" className="rounded-lg max-h-64 object-contain bg-white/5 border border-white/5" />
                </div>
            )}

            {/* Video preview */}
            {ad.format === 'video' && (ad.video_link || ad.raw_video_link) && (
                <div className="mb-5">
                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Video Ad</p>
                    {ad.video_link && ad.video_link.includes('youtube') ? (
                        <div className="aspect-video rounded-lg overflow-hidden bg-black">
                            <iframe
                                src={ad.video_link.replace('watch?v=', 'embed/')}
                                className="w-full h-full"
                                allowFullScreen
                            />
                        </div>
                    ) : ad.raw_video_link ? (
                        <video src={ad.raw_video_link} controls className="rounded-lg max-h-64 bg-black" />
                    ) : null}
                    {ad.video_duration && <p className="text-xs text-muted-foreground mt-1">Duration: {ad.video_duration}</p>}
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Sitelinks */}
                {ad.sitelink_texts.length > 0 && (
                    <div>
                        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold flex items-center gap-1">
                            <Link2 className="w-3.5 h-3.5" /> Sitelinks
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {ad.sitelink_texts.map((sl, i) => (
                                <span key={i} className="bg-brand-500/10 text-brand-300 text-[10px] px-2 py-0.5 rounded-full border border-brand-500/20">
                                    {sl}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Extensions */}
                {ad.extensions.length > 0 && (
                    <div>
                        <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold">Extensions</p>
                        <div className="flex flex-wrap gap-1.5">
                            {ad.extensions.map((ext, i) => (
                                <span key={i} className="bg-white/5 text-muted-foreground text-[10px] px-2 py-0.5 rounded-full border border-white/10">
                                    {ext}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Rating */}
                {ad.rating && (
                    <div>
                        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Rating</p>
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="font-bold">{ad.rating}</span>
                            {ad.reviews && <span className="text-xs text-muted-foreground">({ad.reviews.toLocaleString()} reviews)</span>}
                        </div>
                    </div>
                )}

                {/* Destination link */}
                {ad.destination_link && (
                    <div>
                        <p className="text-xs text-muted-foreground mb-1 uppercase tracking-wider font-semibold">Destination</p>
                        <a href={ad.destination_link} target="_blank" rel="noopener noreferrer"
                            className="text-sm text-brand-400 hover:underline flex items-center gap-1 truncate">
                            <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                            {ad.destination_link}
                        </a>
                    </div>
                )}
            </div>

            {/* Regions */}
            {ad.regions.length > 0 && (
                <div className="mt-5">
                    <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-semibold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" /> Regions Shown ({ad.regions.length})
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
                        {ad.regions.map((r, i) => (
                            <div key={i} className="bg-white/5 rounded-md px-3 py-2 text-xs">
                                <p className="font-medium">{r.region_name}</p>
                                {r.times_shown && <p className="text-muted-foreground">{r.times_shown} shown</p>}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* View on Google */}
            {ad.details_link && (
                <div className="mt-5 pt-4 border-t border-white/5">
                    <a href={ad.details_link} target="_blank" rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm text-brand-400 hover:text-brand-300 transition-colors">
                        <Globe className="w-4 h-4" />
                        View on Google Ads Transparency Center
                        <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                </div>
            )}
        </motion.div>
    );
}

export default function AdsPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [formatFilter, setFormatFilter] = useState('');
    const [data, setData] = useState<AdsData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [expandedAdId, setExpandedAdId] = useState<string | null>(null);
    const [hasSearched, setHasSearched] = useState(false);

    const handleSearch = useCallback(async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const q = searchQuery.trim();
        if (!q) return;

        setIsLoading(true);
        setHasSearched(true);
        setExpandedAdId(null);

        try {
            const params = new URLSearchParams({ text: q });
            if (formatFilter) params.set('creative_format', formatFilter);

            const res = await fetch(`/api/ads/data?${params.toString()}`);
            const json = await res.json();
            setData(json);
        } catch (err) {
            console.error('Search failed:', err);
            setData(null);
        } finally {
            setIsLoading(false);
        }
    }, [searchQuery, formatFilter]);

    const toggleDetail = (adId: string) => {
        setExpandedAdId(prev => prev === adId ? null : adId);
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold font-display flex items-center gap-2">
                    <Megaphone className="w-6 h-6 text-green-400" />
                    Ads Transparency Center
                </h1>
                <p className="text-muted-foreground mt-1">
                    Search and analyze ads from the Google Ads Transparency Center via SerpAPI
                </p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="glass-card p-5">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Enter domain or advertiser name (e.g. apple.com, Tesla)"
                            className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500/50 transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                            <select
                                value={formatFilter}
                                onChange={(e) => setFormatFilter(e.target.value)}
                                className="pl-10 pr-8 py-3 bg-white/5 border border-white/10 rounded-xl text-sm text-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-500/50 transition-all"
                            >
                                {formatOptions.map(f => (
                                    <option key={f.value} value={f.value} className="bg-[#1a1a2e]">{f.label}</option>
                                ))}
                            </select>
                        </div>
                        <button
                            type="submit"
                            disabled={isLoading || !searchQuery.trim()}
                            className="px-6 py-3 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-400 hover:to-brand-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-sm font-semibold text-white transition-all flex items-center gap-2"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                            Search
                        </button>
                    </div>
                </div>
            </form>

            {/* Loading */}
            {isLoading && (
                <div className="flex flex-col items-center justify-center py-16">
                    <Loader2 className="w-8 h-8 text-brand-500 animate-spin mb-3" />
                    <p className="text-sm text-muted-foreground">Searching Google Ads Transparency Center...</p>
                </div>
            )}

            {/* Empty State */}
            {!isLoading && !hasSearched && (
                <div className="glass-card p-12 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-brand-500/10 flex items-center justify-center">
                        <Megaphone className="w-8 h-8 text-brand-400" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">Search for Advertiser Ads</h3>
                    <p className="text-sm text-muted-foreground max-w-md mx-auto">
                        Enter a domain like <span className="text-brand-400 font-mono">apple.com</span> or an advertiser name like <span className="text-brand-400 font-mono">Tesla</span> to view their ads from the Google Ads Transparency Center.
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center mt-5">
                        {['apple.com', 'Tesla', 'amazon.com', 'nike.com', 'google.com'].map(q => (
                            <button
                                key={q}
                                onClick={() => { setSearchQuery(q); }}
                                className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-muted-foreground hover:text-white transition-all"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Error State */}
            {!isLoading && data?.error && (
                <div className="glass-card p-8 text-center border border-red-500/20">
                    <p className="text-red-400 font-medium mb-1">Search Failed</p>
                    <p className="text-sm text-muted-foreground">{data.error}</p>
                </div>
            )}

            {/* Results */}
            {!isLoading && data && !data.error && !data.empty && (
                <>
                    {/* Results Summary */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="glass-card p-5"
                    >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-bold font-display text-white">{data.advertiser}</h2>
                                <p className="text-sm text-muted-foreground">
                                    <span className="text-brand-400 font-semibold">{data.totalResults?.toLocaleString()}</span> ads found
                                    {data.searchQuery && <> for <span className="text-white font-mono">{data.searchQuery}</span></>}
                                </p>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Globe className="w-3.5 h-3.5" />
                                    Region: {data.region}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Filter className="w-3.5 h-3.5" />
                                    Format: {data.creativeFormat}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Ad Creatives Grid */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <LayoutGrid className="w-5 h-5 text-brand-400" />
                            Ad Creatives
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                            {data.adCreatives?.map((ad, i) => (
                                <motion.div
                                    key={ad.ad_creative_id || i}
                                    initial={{ opacity: 0, y: 15 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={cn(
                                        "glass-card-hover overflow-hidden cursor-pointer group transition-all",
                                        expandedAdId === ad.ad_creative_id && "ring-1 ring-brand-500/40"
                                    )}
                                    onClick={() => toggleDetail(ad.ad_creative_id)}
                                >
                                    {/* Thumbnail */}
                                    {ad.thumbnail && (
                                        <div className="relative w-full h-44 bg-white/5 overflow-hidden">
                                            <img
                                                src={ad.thumbnail}
                                                alt="Ad preview"
                                                className="w-full h-full object-contain"
                                            />
                                            <div className="absolute top-2 left-2">
                                                <FormatBadge format={ad.format} />
                                            </div>
                                            {ad.hasDetails && (
                                                <div className="absolute top-2 right-2 bg-green-500/20 text-green-400 text-[10px] font-semibold px-2 py-0.5 rounded-full border border-green-500/20">
                                                    Enriched
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {!ad.thumbnail && (
                                        <div className="relative w-full h-32 bg-white/5 flex items-center justify-center">
                                            {ad.format === 'video' ? <Video className="w-8 h-8 text-muted-foreground/30" /> :
                                                ad.format === 'image' ? <ImageIcon className="w-8 h-8 text-muted-foreground/30" /> :
                                                    <FileText className="w-8 h-8 text-muted-foreground/30" />}
                                            <div className="absolute top-2 left-2">
                                                <FormatBadge format={ad.format} />
                                            </div>
                                        </div>
                                    )}

                                    <div className="p-4">
                                        <p className="text-sm font-semibold text-white truncate">
                                            {ad.title || ad.headline || ad.advertiser}
                                        </p>
                                        {ad.snippet && (
                                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ad.snippet}</p>
                                        )}
                                        {ad.target_domain && (
                                            <p className="text-xs text-green-600/80 font-mono mt-1.5">{ad.target_domain}</p>
                                        )}

                                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                                            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                                                {ad.first_shown && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-3 h-3" />
                                                        {formatDate(ad.first_shown)}
                                                    </span>
                                                )}
                                                {ad.total_days_shown && (
                                                    <span>{ad.total_days_shown}d</span>
                                                )}
                                            </div>
                                            <button className="text-brand-400 group-hover:text-brand-300 transition-colors">
                                                {expandedAdId === ad.ad_creative_id ?
                                                    <ChevronUp className="w-4 h-4" /> :
                                                    <ChevronDown className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {data.adCreatives?.length === 0 && (
                            <div className="glass-card p-8 text-center">
                                <p className="text-muted-foreground">No ad creatives found for this search.</p>
                            </div>
                        )}
                    </div>

                    {/* Expanded Ad Detail */}
                    <AnimatePresence>
                        {expandedAdId && (
                            <>
                                {data.adCreatives
                                    ?.filter(ad => ad.ad_creative_id === expandedAdId)
                                    .map(ad => (
                                        <AdDetailPanel
                                            key={ad.ad_creative_id}
                                            ad={ad}
                                            onClose={() => setExpandedAdId(null)}
                                        />
                                    ))}
                            </>
                        )}
                    </AnimatePresence>
                </>
            )}

            {/* No results */}
            {!isLoading && data?.empty && (
                <div className="glass-card p-8 text-center">
                    <p className="text-muted-foreground">{data.message || 'No results found.'}</p>
                </div>
            )}
        </div>
    );
}
