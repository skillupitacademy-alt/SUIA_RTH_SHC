'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@quiz/api-client';
import { ShieldCheck, Lock, Mail } from 'lucide-react';
import { ZLoader } from '@quiz/ui';

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
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 border border-slate-100">
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-10 w-10 rounded-2xl bg-[#1A1A1A] flex items-center justify-center text-white font-black">
                            API
                        </div>
                        <h1 className="font-black text-2xl tracking-tighter text-[#1A1A1A]">TERMINAL_AUTH</h1>
                    </div>
                    <p className="text-sm font-medium text-slate-400 leading-relaxed italic">
                        Authenticate to access the backend governance dashboard.
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-100 text-rose-600 text-[11px] font-black uppercase tracking-widest flex items-center gap-3">
                        <ShieldCheck size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Governance_Email</label>
                        <div className="relative">
                            <Mail className="absolute left-5 top-5 text-slate-300 h-5 w-5" />
                            <input
                                type="email"
                                required
                                className="w-full pl-14 pr-6 py-5 rounded-2xl border border-slate-100 bg-slate-50/50 text-[#1A1A1A] text-sm focus:bg-white focus:ring-4 focus:ring-slate-100 focus:border-slate-200 outline-none transition-all font-bold placeholder:text-slate-200"
                                placeholder="governance@quizplatform.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Access_Key</label>
                        <div className="relative">
                            <Lock className="absolute left-5 top-5 text-slate-300 h-5 w-5" />
                            <input
                                type="password"
                                required
                                className="w-full pl-14 pr-6 py-5 rounded-2xl border border-slate-100 bg-slate-50/50 text-[#1A1A1A] text-sm focus:bg-white focus:ring-4 focus:ring-slate-100 focus:border-slate-200 outline-none transition-all font-bold placeholder:text-slate-200"
                                placeholder="••••••••••••"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-6 rounded-2xl bg-[#1A1A1A] text-white font-black tracking-[0.15em] text-[11px] shadow-xl shadow-slate-200 hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-3 uppercase"
                    >
                        {isLoading ? (
                            <>
                                <ZLoader size="xs" className="text-white" center={false} />
                                Verifying...
                            </>
                        ) : (
                            "Grant Access"
                        )}
                    </button>
                </form>

                <div className="mt-10 pt-10 border-t border-slate-50 text-center">
                    <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-300">System Governance Kernel v1.0.4</p>
                </div>
            </div>
        </div>
    );
}
