'use client';

import { apiClient } from '@quiz/api-client';
import { ZLoader } from '@quiz/ui';
import { ArrowLeft, CheckCircle2, Mail, Send } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

import { clientLogger } from '@/utils/clientLogger';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [, setMessage] = useState('');
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');
        setMessage('');

        try {
            await apiClient.auth.forgotPassword(email);
            setIsSuccess(true);
            setMessage('Recovery link sent! Check your inbox (including spam).');
        } catch (err: unknown) {
            clientLogger.error('Forgot password request failed', { error: err instanceof Error ? err.message : 'unknown' });
            const message = err instanceof Error ? err.message : 'Failed to send recovery link. Please verify your email.';
            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full">
            <Link
                href="/login"
                className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-8 group"
            >
                <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                Back to Login
            </Link>

            <div className="mb-8">
                <h2 className="text-3xl font-black tracking-tight mb-2">Password Recovery</h2>
                <p className="text-muted-foreground text-sm font-medium">Enter your admin email to receive a recovery link.</p>
            </div>

            {isSuccess ? (
                <div className="p-8 rounded-[2rem] bg-green-500/10 border border-green-500/20 text-center space-y-4">
                    <div className="w-16 h-16 rounded-3xl bg-green-500/20 flex items-center justify-center text-green-500 mx-auto">
                        <CheckCircle2 size={32} />
                    </div>
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-green-600">Email Sent!</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            A secure link has been sent to <span className="text-foreground font-bold">{email}</span>.
                            It will expire in 1 hour.
                        </p>
                    </div>
                    <Link
                        href="/login"
                        className="block w-full py-4 rounded-xl bg-primary text-primary-foreground font-black tracking-wide shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all text-center"
                    >
                        RETURN TO LOGIN
                    </Link>
                </div>
            ) : (
                <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
                    {error ? <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-bold flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        {error}
                    </div> : null}

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-muted-foreground" htmlFor="admin-forgot-email">Admin Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-3.5 text-muted-foreground h-5 w-5" />
                            <input
                                type="email"
                                required
                                id="admin-forgot-email"
                                className="w-full pl-12 pr-4 py-3 rounded-xl border bg-muted/30 text-foreground focus:bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium"
                                placeholder="admin@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-4 rounded-xl bg-[#1A1A1A] text-white font-black tracking-wide shadow-lg shadow-black/25 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 group"
                    >
                        {isLoading ? (
                            <ZLoader size="xs" className="text-white" center={false} />
                        ) : (
                            <>
                                <span>SEND RECOVERY LINK</span>
                                <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>
            )}

            <div className="mt-12 pt-8 border-t text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                    Governance Security Protocol Alpha-9
                </p>
            </div>
        </div>
    );
}
