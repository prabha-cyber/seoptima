'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Zap, ArrowRight, Chrome, Check } from 'lucide-react';

const plans = [
    { id: 'FREE', label: 'Free', price: '$0', features: ['1 website', '50 AI credits/mo', 'Basic SEO'] },
    { id: 'GROWTH', label: 'Growth', price: '$29', features: ['5 websites', '500 AI credits/mo', 'Full SEO'] },
    { id: 'PRO', label: 'Pro', price: '$79', features: ['Unlimited websites', '2000 AI credits/mo', 'Everything'], popular: true },
];

export default function SignupPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({ name: '', email: '', password: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    async function handleSignup(e: React.FormEvent) {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Signup failed');
                setIsLoading(false);
                return;
            }

            // Auto sign in
            const result = await signIn('credentials', {
                email: formData.email,
                password: formData.password,
                redirect: false,
            });

            if (result?.ok) {
                router.push('/dashboard');
            } else {
                router.push('/login');
            }
        } catch {
            setError('Something went wrong. Please try again.');
            setIsLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-background">
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-brand-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-1/3 left-1/4 w-80 h-80 bg-accent-600/15 rounded-full blur-3xl pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative w-full max-w-md mx-4"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center mb-4">
                        <img src="/seoptima-logo.png" alt="Seoptima" className="h-16 w-auto object-contain" />
                    </div>
                    <h1 className="text-3xl font-bold font-display">Create your account</h1>
                    <p className="text-muted-foreground mt-2">Start your free trial today — no credit card required</p>
                </div>

                <div className="glass-card p-8 space-y-6">
                    <button
                        onClick={() => signIn('google', { callbackUrl: '/dashboard' })}
                        className="w-full btn-secondary justify-center gap-3 py-3"
                    >
                        <Chrome className="w-4 h-4" />
                        Continue with Google
                    </button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs text-muted-foreground">
                            <span className="bg-card px-3">or sign up with email</span>
                        </div>
                    </div>

                    <form onSubmit={handleSignup} className="space-y-4">
                        {error && (
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Full Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="John Smith"
                                required
                                className="input-base"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Email Address</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                placeholder="you@example.com"
                                required
                                className="input-base"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Min 8 characters"
                                    required
                                    minLength={8}
                                    className="input-base pr-11"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center py-3">
                            {isLoading ? (
                                <span className="flex items-center gap-2">
                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating account...
                                </span>
                            ) : (
                                <span className="flex items-center gap-2">
                                    Create Free Account <ArrowRight className="w-4 h-4" />
                                </span>
                            )}
                        </button>
                    </form>

                    <p className="text-center text-sm text-muted-foreground">
                        Already have an account?{' '}
                        <Link href="/login" className="text-brand-400 hover:text-brand-300 font-medium">Sign in</Link>
                    </p>
                </div>

                {/* Trust badges */}
                <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
                    {['Free forever plan', 'No credit card', '50 AI credits/mo'].map((item) => (
                        <span key={item} className="flex items-center gap-1">
                            <Check className="w-3 h-3 text-green-400" />
                            {item}
                        </span>
                    ))}
                </div>
            </motion.div>
        </div>
    );
}
