import Link from 'next/link';
import { Zap, Search, Sparkles, Bot, BarChart3, ArrowRight, Check, Shield, Globe, TrendingUp } from 'lucide-react';

const features = [
    { icon: Search, title: 'SEO Health Dashboard', desc: 'Real-time SEO score (0–100) with technical, content, speed, schema & sitemap breakdowns.', color: 'from-brand-600 to-brand-500' },
    { icon: Sparkles, title: 'AI Content Engine', desc: 'Generate titles, meta descriptions, product copy & FAQs optimized for Google, AEO, and GEO.', color: 'from-accent-600 to-accent-500' },
    { icon: Bot, title: 'Automation Brain', desc: 'Self-healing SEO — triggers fire automatically when issues are detected. Fix errors on autopilot.', color: 'from-green-600 to-green-500' },
    { icon: Globe, title: 'Website Builder', desc: 'AI-generated or drag-and-drop builder. Full CMS, ecommerce, blog, and portfolio support.', color: 'from-orange-600 to-orange-500' },
    { icon: BarChart3, title: 'Ads Intelligence', desc: 'Google Ads + Meta Ads analytics in one dashboard. CTR, CPC, ROAS, and Ads Health Score.', color: 'from-red-600 to-red-500' },
    { icon: TrendingUp, title: 'Monthly Reports', desc: 'Auto-generated PDF reports with SEO improvements, issues fixed, and performance changes.', color: 'from-purple-600 to-purple-500' },
];

const stats = [
    { value: '10K+', label: 'Websites Optimized' },
    { value: '95%', label: 'Avg Score Improvement' },
    { value: '50M+', label: 'AI Tokens Generated' },
    { value: '4.9★', label: 'User Rating' },
];

export default function LandingPage() {
    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/6 bg-background/80 backdrop-blur-xl">
                <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <img src="/seoptima-logo.png" alt="Seoptima" className="h-10 w-auto object-contain" />
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link href="/login" className="btn-ghost text-sm">Sign in</Link>
                        <Link href="/signup" className="btn-primary text-sm">Get started free</Link>
                    </div>
                </div>
            </nav>

            {/* Hero */}
            <section className="relative pt-32 pb-24 px-4">
                {/* Background */}
                <div className="absolute inset-0 bg-grid-pattern opacity-30 pointer-events-none" />
                <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-brand-600/20 via-accent-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />

                <div className="relative max-w-4xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20">
                        <Sparkles className="w-3.5 h-3.5 text-brand-400" />
                        <span className="text-sm text-brand-300 font-medium">Powered by GPT-4o</span>
                    </div>

                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold font-display leading-tight">
                        The{' '}
                        <span className="gradient-text">Self-Healing SEO</span>
                        <br />
                        Platform
                    </h1>

                    <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                        Seoptima automatically finds SEO issues, generates optimized content with AI,
                        fixes problems on autopilot, and grows your website while you sleep.
                    </p>

                    <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                        <Link href="/signup" className="btn-primary text-base py-3 px-6 gap-2">
                            Start for free <ArrowRight className="w-4 h-4" />
                        </Link>
                        <Link href="/login" className="btn-secondary text-base py-3 px-6">
                            View Dashboard Demo
                        </Link>
                    </div>

                    <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-sm text-muted-foreground">
                        {['No credit card required', 'Free plan forever', '50 AI credits included'].map((item) => (
                            <span key={item} className="flex items-center gap-1.5">
                                <Check className="w-3.5 h-3.5 text-green-400" />
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
            </section>

            {/* Stats */}
            <section className="py-12 px-4 border-y border-white/8">
                <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
                    {stats.map((stat) => (
                        <div key={stat.label} className="text-center">
                            <p className="text-3xl font-bold font-display gradient-text">{stat.value}</p>
                            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Features */}
            <section className="py-24 px-4">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold font-display">
                            Everything you need to{' '}
                            <span className="gradient-text">dominate search</span>
                        </h2>
                        <p className="text-muted-foreground mt-4 max-w-xl mx-auto">
                            23 modules working together as one intelligent platform. From website builder to AI SEO engine to ads intelligence.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {features.map((feature, i) => {
                            const Icon = feature.icon;
                            return (
                                <div key={feature.title} className="glass-card-hover p-6">
                                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4`}>
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>
                                    <h3 className="font-bold font-display mb-2">{feature.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="py-24 px-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-brand-500/10 to-accent-500/10 pointer-events-none" />
                <div className="relative max-w-3xl mx-auto text-center">
                    <div className="inline-flex items-center gap-2 mb-4 p-2 rounded-full bg-white/5 border border-white/10">
                        <Shield className="w-4 h-4 text-green-400" />
                        <span className="text-sm text-muted-foreground">Enterprise-grade security & RBAC</span>
                    </div>
                    <h2 className="text-4xl sm:text-5xl font-bold font-display">
                        Ready to grow on <span className="gradient-text">autopilot?</span>
                    </h2>
                    <p className="mt-4 text-muted-foreground text-lg">
                        Join thousands of websites that let AI handle their SEO while they focus on what matters.
                    </p>
                    <Link href="/signup" className="btn-primary inline-flex mt-8 text-base py-3 px-8 gap-2">
                        Launch your platform <Zap className="w-4 h-4" />
                    </Link>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/8 py-8 px-4">
                <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-3">
                        <img src="/seoptima-logo.png" alt="Seoptima" className="h-8 w-auto object-contain opacity-80 hover:opacity-100 transition-opacity" />
                        <span>© 2026</span>
                    </div>
                    <div className="flex gap-4">
                        <Link href="/privacy" className="hover:text-foreground">Privacy</Link>
                        <Link href="/terms" className="hover:text-foreground">Terms</Link>
                        <Link href="/dashboard" className="hover:text-foreground">Dashboard</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
