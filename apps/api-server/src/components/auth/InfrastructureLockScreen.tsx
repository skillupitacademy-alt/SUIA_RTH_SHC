'use client';

import { apiClient } from '@quiz/api-client';
import { ZLoader } from '@quiz/ui';
import { ChevronRight, Lock, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useAuthStore } from '@/store/auth-store';

export function InfrastructureLockScreen() {
    const { unlock, logout, isLocked, login } = useAuthStore(
        useShallow((s) => ({
            unlock: s.unlock,
            logout: s.logout,
            isLocked: s.isLocked,
            login: s.login,
        }))
    );
    const _user = useAuthStore((s) => s._user);
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (isLocked && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isLocked]);

    if (isLocked === false || _user === null || _user === undefined) return null;

    const handleUnlock = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (password === '') return;

        setIsLoading(true);
        setError(null);

        try {
            const email = _user?.email ?? '';
            if (email.length === 0) {
                setError('IDENTITY_MISSING');
                setIsLoading(false);
                return;
            }

            // 1. Re-authenticate with Portal Identity Hint
            apiClient.client.setPortalIdentity('infrastructure');
            const { user: refreshedUser, expiresAt } = await apiClient.admin.login(email, password);

            // 2. Validate Infrastructure Role Persistence
            if (refreshedUser.role !== 'infrastructure') {
                throw new Error("ACCESS_DENIED: ROLE_MISMATCH_ON_UNLOCK");
            }

            // 3. Re-establish Local Session
            login(refreshedUser, expiresAt);
            setPassword('');
            unlock();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'HANDSHAKE_FAILED_CRYPTO_ERROR');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSwitchAccount = () => {
        logout();
        window.location.href = '/login';
    };

    return (
        <div className="fixed inset-0 z-[100000] bg-slate-950/98 backdrop-blur-2xl flex items-center justify-center animate-in fade-in duration-700">
            <div className="w-full max-w-md px-8 py-16 flex flex-col items-center space-y-10 animate-in zoom-in-95 duration-500">

                {/* Secure Status Indicator */}
                <div className="flex flex-col items-center space-y-6">
                    <div className="relative">
                        <div className="w-28 h-28 rounded-[2.5rem] bg-[#FF2D55] flex items-center justify-center shadow-2xl shadow-[#FF2D55]/30 ring-1 ring-white/20">
                            <Lock size={44} className="text-white" />
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white p-2.5 rounded-full border-[6px] border-slate-950 shadow-lg">
                            <ShieldCheck size={18} />
                        </div>
                    </div>

                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-black font-outfit uppercase tracking-tighter text-white">
                            Terminal Lockdown
                        </h1>
                        <p className="text-[10px] font-black text-rose-500/80 uppercase tracking-[0.4em] flex items-center justify-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                            CRITICAL SYSTEM NODE • SECURE HANDSHAKE REQUIRED
                        </p>
                    </div>
                </div>

                {/* Identity Panel */}
                <div className="w-full p-5 rounded-3xl bg-white/5 border border-white/10 flex items-center gap-5 ring-1 ring-inset ring-white/5">
                    <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-white/10 flex items-center justify-center text-slate-400 shadow-inner">
                        <UserIcon size={28} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] truncate">
                            {_user?.email}
                        </p>
                        <p className="text-lg font-black text-white truncate flex items-center gap-3">
                            {_user?.name}
                            <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.2em] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                <ShieldCheck size={10} /> INFRA
                            </span>
                        </p>
                    </div>
                </div>

                {/* Authentication Interface */}
                <form onSubmit={(e) => { void handleUnlock(e); }} className="w-full space-y-6">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between px-1">
                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500" htmlFor="infra-passkey">
                                Passkey Verification
                            </label>
                            <button
                                type="button"
                                onClick={handleSwitchAccount}
                                className="text-[9px] font-black uppercase tracking-[0.2em] text-rose-500/60 hover:text-rose-500 transition-colors"
                            >
                                Switch Identity <ChevronRight size={10} className="inline ml-0.5" />
                            </button>
                        </div>
                        <div className="relative group">
                            <input
                                ref={inputRef}
                                id="infra-passkey"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full rounded-2xl bg-white/5 border border-white/10 px-5 py-4 text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-[#FF2D55]/50 focus:bg-white/10 transition-all font-semibold"
                                placeholder="Enter system passkey"
                            />
                            <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-[#FF2D55] transition-colors">
                                <Lock size={18} />
                            </div>
                        </div>
                    </div>

                    {error !== null && error !== '' && (
                        <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 text-center">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500">
                                {error}
                            </p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading || password === ''}
                        className="w-full py-5 rounded-2xl bg-[#FF2D55] text-white font-black uppercase tracking-[0.3em] text-xs shadow-2xl shadow-[#FF2D55]/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed overflow-hidden relative"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-3">
                                <ZLoader size="xs" color="white" />
                                <span>Re-establishing Link...</span>
                            </span>
                        ) : (
                            <span>Unlock Terminal</span>
                        )}
                    </button>
                </form>

                <div className="pt-4 flex flex-col items-center space-y-4">
                    <button
                        type="button"
                        onClick={handleSwitchAccount}
                        className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600 hover:text-white transition-colors flex items-center gap-3"
                    >
                        <LogOut size={16} className="text-rose-500" />
                        Terminate All Sessions
                    </button>

                    <div className="h-px w-12 bg-white/10" />

                    <p className="text-[8px] font-black text-slate-700 uppercase tracking-[0.5em]">
                        SECURE NODE ACCESS • ENCRYPTED LAYER 7
                    </p>
                </div>
            </div>
        </div>
    );
}
