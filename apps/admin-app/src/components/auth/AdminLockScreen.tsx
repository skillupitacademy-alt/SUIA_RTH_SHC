
'use client';

import { apiClient } from '@quiz/api-client';
import { ZLoader } from '@quiz/ui';
import { ChevronRight, Lock, LogOut, ShieldCheck, User as UserIcon } from 'lucide-react';
import { useState } from 'react';

import { useAuthStore } from '@/store/auth-store';

export function AdminLockScreen() {
    const { user, unlock, logout, isLocked, login } = useAuthStore();
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (isLocked === false || user === null || user === undefined) return null;

    const handleUnlock = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (password === '') return;

        setIsLoading(true);
        setError(null);

        try {
            // 1. Verify password & establish fresh cookies
            await apiClient.auth.login(user.email, password);

            // 2. Hardening: Sync local state with server session to get fresh expiresAt
            const { user: refreshedUser, expiresAt } = await apiClient.auth.getAdminSession();
            login(refreshedUser, expiresAt);

            setPassword('');
            unlock();
        } catch (err: unknown) {
            setError('Incorrect master password');
            console.error('Lock screen unlock failed:', err);
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

                {/* Branding & Status */}
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

                {/* User Info */}
                <div className="w-full p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-slate-400">
                        <UserIcon size={24} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider truncate">
                            {user.name}
                        </p>
                        <p className="text-[10px] font-medium text-slate-500 truncate lowercase">
                            {user.email}
                        </p>
                    </div>
                </div>

                {/* Password Input */}
                <form onSubmit={(e) => void handleUnlock(e)} className="w-full space-y-4">
                    <div className="relative group">
                        <input
                            type="password"
                            placeholder="MASTER PASSWORD"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isLoading}
                            autoFocus
                            className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl text-white text-center font-bold tracking-[0.2em] focus:outline-none focus:border-[#FF4B91] focus:ring-1 focus:ring-[#FF4B91] transition-all placeholder:text-slate-600 placeholder:tracking-normal placeholder:font-medium placeholder:text-xs"
                        />
                        {(error as string | null) !== null ? <p className="absolute -bottom-6 left-0 right-0 text-center text-[10px] font-bold text-red-400 uppercase tracking-wider">
                            {error}
                        </p> : null}
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading === true || password === ''}
                        className="w-full h-14 rounded-2xl bg-[#FF4B91] text-white font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl shadow-pink-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:hover:scale-100"
                    >
                        {isLoading ? (
                            <ZLoader size="sm" />
                        ) : (
                            <>
                                Unlock Protocol
                                <ChevronRight size={18} />
                            </>
                        )}
                    </button>
                </form>

                {/* Secondary Actions */}
                <button
                    onClick={handleSwitchAccount}
                    className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-bold uppercase tracking-widest py-2"
                >
                    <LogOut size={14} />
                    Switch Authority
                </button>
            </div>

            {/* Background Aesthetic */}
            <div className="absolute inset-0 z-[-1] overflow-hidden pointer-events-none opacity-20">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF4B91] rounded-full blur-[160px]" />
                <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-500 rounded-full blur-[140px] opacity-30" />
            </div>
        </div>
    );
}
