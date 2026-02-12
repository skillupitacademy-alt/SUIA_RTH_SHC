'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Suspense, useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiClient } from '@quiz/api-client';
import { Lock, ShieldCheck, CheckCircle2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { ZLoader } from '@quiz/ui';
import Link from 'next/link';

function ResetPasswordForm() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isVerifying, setIsVerifying] = useState(true);
    const [isTokenValid, setIsTokenValid] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setError('Reset token is missing.');
                setIsVerifying(false);
                return;
            }

            try {
                const { valid } = await apiClient.auth.validateResetToken(token);
                setIsTokenValid(valid);
                if (!valid) setError('This link has expired or is invalid.');
            } catch {
                setError('Failed to verify security token.');
            } finally {
                setIsVerifying(false);
            }
        };

        verifyToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setIsLoading(true);
        setError('');

        try {
            await apiClient.auth.resetPassword(token!, newPassword);
            setIsSuccess(true);
            setTimeout(() => router.push('/login'), 5000); // Redirect after 5s
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to update password.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isVerifying) {
        return (
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <ZLoader size="lg" text="Establishing Secure Channel..." />
            </div>
        );
    }

    if (!isTokenValid && !isSuccess) {
        return (
            <div className="text-center space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-red-500/10 flex items-center justify-center text-red-500 mx-auto border border-red-500/20">
                    <AlertTriangle size={32} />
                </div>
                <div>
                    <h2 className="text-2xl font-black tracking-tight mb-2">Security Violation</h2>
                    <p className="text-muted-foreground text-sm font-medium">{error}</p>
                </div>
                <Link
                    href="/forgot-password"
                    className="block w-full py-4 rounded-xl border border-primary/20 bg-primary/5 text-primary font-black tracking-wide hover:bg-primary/10 transition-all text-center"
                >
                    REQUEST NEW LINK
                </Link>
            </div>
        );
    }

    if (isSuccess) {
        return (
            <div className="p-8 rounded-[2rem] bg-green-500/10 border border-green-500/20 text-center space-y-6">
                <div className="w-16 h-16 rounded-3xl bg-green-500/20 flex items-center justify-center text-green-500 mx-auto">
                    <CheckCircle2 size={32} />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-green-600 mb-2">ACCESS RESTORED</h3>
                    <p className="text-muted-foreground text-sm font-medium leading-relaxed">
                        Your admin credentials have been securely updated. You are being redirected to the governance terminal...
                    </p>
                </div>
                <div className="flex items-center justify-center gap-2">
                    <ZLoader size="xs" text="Secure Handshake in progress" center={false} />
                </div>
            </div>
        );
    }

    return (
        <div className="w-full">
            <div className="mb-10">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                        <ShieldCheck size={20} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-[0.2em] text-primary">Governance Protocol #RO-441</span>
                </div>
                <h2 className="text-3xl font-black tracking-tight mb-2">Secure Reset</h2>
                <p className="text-muted-foreground text-sm font-medium">Define your new administrative access credentials.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-bold flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        {error}
                    </div>
                )}

                <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">New Password</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-muted-foreground h-5 w-5" />
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            minLength={8}
                            className="w-full pl-12 pr-12 py-3 rounded-xl border bg-muted/30 text-foreground focus:bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium"
                            placeholder="••••••••••••"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-3.5 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-muted-foreground">Confirm New Password</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-3.5 text-muted-foreground h-5 w-5" />
                        <input
                            type={showPassword ? "text" : "password"}
                            required
                            className="w-full pl-12 pr-4 py-3 rounded-xl border bg-muted/30 text-foreground focus:bg-background focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-medium"
                            placeholder="••••••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-black tracking-wide shadow-lg shadow-primary/25 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2"
                >
                    {isLoading ? <ZLoader size="xs" className="text-white" center={false} /> : "FINALIZE RESET"}
                </button>
            </form>
        </div>
    );
}

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center p-12 space-y-4">
                <ZLoader size="lg" text="Initializing Security..." />
            </div>
        }>
            <ResetPasswordForm />
        </Suspense>
    );
}
