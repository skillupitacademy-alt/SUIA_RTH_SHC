'use client';

import { loginPortalSession, ZLoader } from '@quiz/ui';
import { ChevronRight, Lock, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useFocusTrap } from '@/hooks/useFocusTrap';
import { useAuthStore } from '@/store/auth-store';
import { clientLogger } from '@/utils/clientLogger';

export function AdminLockScreen() {
    const { user, unlock, logout, isLocked, login } = useAuthStore(
        useShallow((s) => ({
            user: s.user,
            unlock: s.unlock,
            logout: s.logout,
            isLocked: s.isLocked,
            login: s.login,
        }))
    );
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    useFocusTrap(inputRef, isLocked === true);

    if (isLocked === false || user === null || user === undefined) return null;

    const handleUnlock = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (password === '') return;

        setIsLoading(true);
        setError(null);

        try {
            const email = user?.email ?? '';
            if (email.length === 0) {
                setError('Missing admin email');
                setIsLoading(false);
                return;
            }
            clientLogger.warn('[AUTH_FLOW][ADMIN_LOCK_SCREEN][UNLOCK_SUBMIT]', {
                step: 'submit',
                emailDomain: email.includes('@') ? email.split('@')[1] : 'unknown',
            });
            const { user: refreshedUser } = await loginPortalSession({
                email,
                password,
                platform: 'realtutorialhub',
                portalIdentity: 'admin',
                portalName: 'RealTutorialHub Admin',
                allowedRoles: ['admin', 'super_admin'],
            });

            clientLogger.warn('[AUTH_FLOW][ADMIN_LOCK_SCREEN][UNLOCK_RESPONSE]', {
                step: 'response',
                hasUser: refreshedUser !== null && refreshedUser !== undefined,
            });

            // 2. Update local state
            if (refreshedUser !== undefined && refreshedUser.email !== undefined) {
                login({
                    id: refreshedUser.id ?? user.id,
                    email: refreshedUser.email,
                    name: refreshedUser.name ?? user.name ?? '',
                    isAdmin: refreshedUser.isAdmin ?? true,
                    role: refreshedUser.role ?? 'admin',
                    onboarded: refreshedUser.onboarded ?? true,
                });
            }

            setPassword('');
            unlock();
        } catch (err: unknown) {
            setError('Incorrect master password');
            clientLogger.error('Lock screen unlock failed', { error: err instanceof Error ? err.message : 'unknown' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSwitchAccount = () => {
        logout();
        window.location.href = '/login';
    };

    return (
        <div className="fixed inset-0 z-[100000] bg-[#1A1A1A]/95 backdrop-blur-xl flex items-center justify-center animate-in fade-in duration-500">
            <div className="w-full max-w-sm px-6 py-12 flex flex-col items-center space-y-8 animate-in zoom-in-95 duration-500">

                {/* Branding and status */}
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-[#FF4B91] to-[#FF8E9E] flex items-center justify-center shadow-2xl shadow-pink-500/20">
                            <Lock size={40} className="text-white" />
                        </div>
                        <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-full border-4 border-[#1A1A1A] shadow-lg">
                            <ShieldCheck size={16} />
                        </div>
                    </div>

                    <div className="text-center">
                        <h1 className="text-2xl font-black font-outfit uppercase tracking-tighter text-white">
                            Terminal Locked
                        </h1>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center justify-center gap-2 mt-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Security Protocol Alpha v1.0.4
                        </p>
                    </div>
                </div>

                {/* User info */}
                <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-slate-400">
                        <UserIcon size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
                            {user?.email}
                        </p>
                        <p className="text-sm font-black text-white truncate flex items-center gap-2">
                            {user?.name ?? 'Admin User'}
                            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-emerald-400">
                                <ShieldCheck size={12} /> Admin
                            </span>
                        </p>
                    </div>
                </div>

                {/* Input */}
                <form onSubmit={(e) => { void handleUnlock(e); }} className="w-full space-y-4">
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-slate-300 text-[11px] font-bold uppercase tracking-[0.2em]">
                            <span id="lock-screen-password-label">Master Password</span>
                            <button
                                type="button"
                                onClick={handleSwitchAccount}
                                className="inline-flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors"
                                aria-label="Switch account"
                            >
                                Switch Account <ChevronRight size={12} />
                            </button>
                        </div>
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                minLength={1}
                                className="w-full rounded-2xl bg-white/10 border border-white/20 px-4 py-3 text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#FF4B91]/40"
                                placeholder="Enter master password"
                                aria-label="Master password"
                                aria-labelledby="lock-screen-password-label"
                            />
                            <LogOut className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        </div>
                    </div>

                    {error !== null ? <div className="text-red-400 text-[11px] font-bold uppercase tracking-[0.2em] text-center">{error}</div> : null}

                    <button
                        type="submit"
                        disabled={isLoading || password === ''}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#FF4B91] to-[#FF8E9E] text-white font-black uppercase tracking-[0.2em] text-sm shadow-lg shadow-pink-500/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        aria-label="Unlock terminal"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <ZLoader size="xs" className="text-white" center={false} />
                                Re-establishing Session...
                            </span>
                        ) : 'Unlock Terminal'}
                    </button>
                </form>

                <button
                    type="button"
                    onClick={handleSwitchAccount}
                    className="text-[11px] font-bold uppercase tracking-[0.25em] text-slate-500 hover:text-white transition-colors flex items-center gap-2"
                >
                    <LogOut size={14} /> Log out securely
                </button>
            </div>
        </div>
    );
}
