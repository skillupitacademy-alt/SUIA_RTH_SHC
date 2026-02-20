'use client';

import { apiClient } from '@quiz/api-client';
import { ZLoader } from '@quiz/ui';
import { ArrowRight, Lock, Shield } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { GuestInfrastructureLayout } from '@/components/layout/GuestInfrastructureLayout';
import { useAuthStore } from '@/store/auth-store';

export default function LoginPage() {
    const router = useRouter();
    const login = useAuthStore((state) => state.login);

    const [email, setEmail] = useState('root@system.internal');
    const [password, setPassword] = useState('password_infra_core');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            // Executive Handshake Protocol
            apiClient.client.setPortalIdentity('infrastructure');
            const { user, expiresAt } = await apiClient.admin.login(email, password);

            // Critical Role Check: Only 'infrastructure' users can pass this gateway
            if (user.role !== 'infrastructure') {
                throw new Error("ACCESS_DENIED: SECURE_NODE_REQUIREMENT");
            }

            login(user, expiresAt);
            void router.push('/');
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message || 'Handshake failed. Verify passkey.');
            } else {
                setError('Handshake failed. Verify passkey.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <GuestInfrastructureLayout>
            <div className="space-y-8">
                <div className="space-y-2 text-center lg:text-left">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900 font-outfit uppercase">Handshake Required</h2>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Provide cryptographic passkey to initialize session.</p>
                </div>

                {error !== null && error !== '' && (
                    <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 flex items-center gap-3 animate-shake">
                        <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-rose-600">{error}</span>
                    </div>
                )}

                <form onSubmit={(e) => { void handleLogin(e); }} className="space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1" htmlFor="infra-id">Identity</label>
                            <div className="relative group">
                                <input
                                    type="email"
                                    id="infra-id"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 pl-12 text-sm focus:outline-none focus:border-[#FF2D55]/50 focus:bg-white transition-all text-slate-900 font-semibold"
                                    placeholder="root@system.internal"
                                />
                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#FF2D55] transition-colors" size={18} />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1" htmlFor="infra-key">Passkey</label>
                            <div className="relative group">
                                <input
                                    type="password"
                                    id="infra-key"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 pl-12 text-sm focus:outline-none focus:border-[#FF2D55]/50 focus:bg-white transition-all text-slate-900 font-semibold"
                                    placeholder="••••••••••••"
                                />
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#FF2D55] transition-colors" size={18} />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-14 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3
                       bg-[#FF2D55] text-white hover:bg-[#E61E44] transition-all
                       disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-[#FF2D55]/20 hover:scale-[1.02] active:scale-95"
                    >
                        {isLoading ? (
                            <>
                                <ZLoader size="xs" color="white" />
                                <span>Establishing Link...</span>
                            </>
                        ) : (
                            <>
                                <span>Initialize Session</span>
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                <div className="pt-8 border-t border-slate-100 text-center">
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.3em]">
                        RESTRICTED ACCESS • SECURE NODE V3.0
                    </p>
                </div>
            </div>
        </GuestInfrastructureLayout>
    );
}
