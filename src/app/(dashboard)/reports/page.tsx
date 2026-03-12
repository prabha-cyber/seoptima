'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, TrendingUp, AlertTriangle, CheckCircle2, Sparkles, Calendar, Loader2, Globe } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWebsite } from '@/context/website-context';
import { generateTechnicalSeoPdf } from '@/lib/seo/reports';

export default function ReportsPage() {
    const { activeWebsite, runAnalysis, isAnalyzing } = useWebsite();
    const [reports, setReports] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);

    const fetchReports = async () => {
        if (!activeWebsite) return;
        setIsLoading(true);
        try {
            const res = await fetch(`/api/reports?websiteId=${activeWebsite.id}`);
            if (res.ok) {
                const data = await res.json();
                setReports(data);
            }
        } catch (error) {
            console.error('Failed to fetch reports:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (activeWebsite) {
            fetchReports();
        } else {
            setIsLoading(false);
        }
    }, [activeWebsite]);

    // Fetch profile for email display
    useEffect(() => {
        fetch('/api/profile').then(r => r.ok ? r.json() : null).then(setProfile);
    }, []);

    const handleGenerateReport = async () => {
        await runAnalysis();
        fetchReports(); // Refresh list after analysis
    };

    const handleDownloadPdf = (report: any) => {
        const url = activeWebsite?.domain || `https://${activeWebsite?.subdomain}.antigravity.run`;
        if (report?.fullResults) {
            try {
                const results = typeof report.fullResults === 'string' ? JSON.parse(report.fullResults) : report.fullResults;
                generateTechnicalSeoPdf(url, { results, stats: { performance: { performanceScore: report.speedScore }, score: report.overallScore } });
            } catch (e) {
                window.open(`/report?url=${encodeURIComponent(url)}`, '_blank');
            }
        } else {
            window.open(`/report?url=${encodeURIComponent(url)}`, '_blank');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-8 h-8 text-brand-500 animate-spin" />
            </div>
        );
    }

    if (!activeWebsite) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                    <Globe className="w-8 h-8 text-muted-foreground" />
                </div>
                <h2 className="text-xl font-bold font-display">No Website Selected</h2>
                <p className="text-muted-foreground max-w-sm">Please select a website from the top bar to view its reports.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold font-display flex items-center gap-2">
                        <FileText className="w-6 h-6 text-orange-400" />
                        Reports
                    </h1>
                    <p className="text-muted-foreground mt-1">Automated monthly SEO &amp; performance reports</p>
                </div>
                <button
                    onClick={handleGenerateReport}
                    disabled={isAnalyzing}
                    className="btn-primary gap-2"
                >
                    {isAnalyzing ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Analyzing...
                        </>
                    ) : (
                        <>
                            <Sparkles className="w-4 h-4" />
                            Generate Report
                        </>
                    )}
                </button>
            </div>

            {/* Next report countdown */}
            <div className="glass-card p-5 border-brand-500/20 bg-brand-500/5 flex items-center gap-4 flex-wrap">
                <div className="w-10 h-10 rounded-xl bg-brand-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-brand-400" />
                </div>
                <div>
                    <p className="font-medium">Next automated report</p>
                    <p className="text-sm text-muted-foreground">March 1, 2026 — 1 day away</p>
                </div>
                <div className="ml-auto text-sm text-muted-foreground">
                    Reports are sent automatically to <strong className="text-foreground">{profile?.email || 'your@email.com'}</strong>
                </div>
            </div>

            {/* Reports list */}
            <div className="space-y-4">
                {reports.length === 0 ? (
                    <div className="text-center py-12 glass-card border-dashed">
                        <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                        <p className="text-muted-foreground">No reports found for this website yet.</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Click &quot;Generate Report&quot; to run your first analysis.</p>
                    </div>
                ) : (
                    reports.map((report, i) => (
                        <motion.div
                            key={report.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.08 }}
                            className="glass-card-hover p-5"
                        >
                            <div className="flex items-start justify-between gap-4 flex-wrap">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/20 flex items-center justify-center">
                                        <FileText className="w-5 h-5 text-orange-400" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">SEO Report — {new Date(report.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5">Generated {new Date(report.createdAt).toLocaleDateString()}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-4 text-sm text-center">
                                        <div>
                                            <p className="font-bold font-display text-brand-400">{report.overallScore}</p>
                                            <p className="text-xs text-muted-foreground">SEO Score</p>
                                        </div>
                                        <div>
                                            <p className="font-bold font-display text-red-400">{report.issuesFound}</p>
                                            <p className="text-xs text-muted-foreground">Issues</p>
                                        </div>
                                        <div>
                                            <p className="font-bold font-display text-green-400">
                                                {/* Heuristic for "fixed" since we don't track resolved issues in first report */}
                                                {report.overallScore > 70 ? 'High' : 'Audit'}
                                            </p>
                                            <p className="text-xs text-muted-foreground">Status</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDownloadPdf(report)}
                                        className="btn-secondary text-xs gap-1.5 py-1.5 px-3"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        PDF
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
