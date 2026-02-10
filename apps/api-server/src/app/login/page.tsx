'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@quiz/api-client';
import { ShieldCheck, Lock, Mail } from 'lucide-react';
import { ZLoader } from '@quiz/ui';
import Link from 'next/link';

export default function ApiTerminalLoginPage() {
    const router = useRouter();
    const { login, isAuthenticated, initialized } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });

    useEffect(() => {
        if (initialized && isAuthenticated) {
            router.push('/');
        }
    }, [initialized, isAuthenticated, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // Use Admin Login parity
            const { user, expiresAt } = await apiClient.admin.login(formData.email, formData.password);

            if (!user.isAdmin) {
                throw new Error("Access Denied: Terminal Governance Privileges Required.");
            }

            login(user, expiresAt);
            router.push('/');
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Authentication failed');
        } finally {
            setIsLoading(false);
        }
    };

    if (!initialized) return null;

    return (
        <div className="w-full min-h-screen bg-white flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                <div className="mb-8">
                    <h2 className="text-3xl font-bold tracking-tight mb-2 text-[#1A1A1A]">API Terminal Access</h2>
                    <p className="text-sm text-muted-foreground">Authenticate to access the backend governance dashboard.</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm font-bold flex items-center gap-2">
                        <ShieldCheck size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none text-slate-500">Governance Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-4 text-slate-400 h-5 w-5" />
                            <input
                                type="email"
                                required
                                className="w-full pl-12 pr-4 py-4 rounded-xl border bg-slate-50 text-[#1A1A1A] text-[15px] focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-semibold"
                                placeholder="governance@quizplatform.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-sm font-medium leading-none text-slate-500">Access Key</label>
                            {/* <Link // Removed Forgot Password as it's not implemented for API yet
                                href="/forgot-password"
                                className="text-sm font-medium text-[#FF4B91] hover:underline"
                            >
                                Forgot Password?
                            </Link> */}
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-4 text-slate-400 h-5 w-5" />
                            <input
                                type="password"
                                required
                                className="w-full pl-12 pr-4 py-4 rounded-xl border bg-slate-50 text-[#1A1A1A] text-[15px] focus:bg-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all font-semibold"
                                placeholder="••••••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-5 rounded-xl bg-[#1A1A1A] text-white font-bold tracking-normal text-sm shadow-lg shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 uppercase"
                    >
                        {isLoading ? (
                            <>
                                <ZLoader size="xs" className="text-white" center={false} />
                                VERIFYING...
                            </>
                        ) : (
                            "GRANT ACCESS"
                        )}
                    </button>
                </form>

                <div className="mt-8 pt-8 border-t text-center">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">System Governance Kernel v1.0.4</p>
                    <p className="mt-2 text-[10px] font-medium text-slate-400 uppercase tracking-widest">Unauthorized access attempts are logged.</p>
                </div>
            </div>
        </div>
    );
}
