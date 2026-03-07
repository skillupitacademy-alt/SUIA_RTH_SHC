'use client';

import { ZLoader } from '@quiz/ui';
import { ShieldAlert, Terminal } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { type AuthState, useAuthStore } from '@/store/auth-store';

// Modern Tier-3 Security Constants
const WARNING_THRESHOLD = 180; // 3 min before token expiry
const DEFAULT_IDLE_WARNING_MS = 3 * 60 * 1000;
const DEFAULT_IDLE_LOCK_MS = 5 * 60 * 1000;
const DEFAULT_FORCED_IDLE_WARNING_MS = 55 * 60 * 1000;
const DEFAULT_FORCED_IDLE_LOGOUT_MS = 60 * 60 * 1000;

interface SessionWatcherProps {
    expiresAt: string | null;
    onRefresh: () => Promise<void>;
    onLogout: () => Promise<void>;
    isRedirecting?: boolean;
}

export function SessionWatcher({ expiresAt, onRefresh, onLogout, isRedirecting }: SessionWatcherProps) {
    const { lock, isLocked, isLoggingOut } = useAuthStore(
        useShallow((s: AuthState) => ({
            lock: s.lock,
            isLocked: s.isLocked,
            isLoggingOut: s.isLoggingOut,
        }))
    );
    const [showWarning, setShowWarning] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);
    const redirecting = isRedirecting === true;

    // Activity State
    const [lastActivityAt, setLastActivityAt] = useState(Date.now());
    const [isIdleWarning, setIsIdleWarning] = useState(false);
    const [isForcedLogoutWarning, setIsForcedLogoutWarning] = useState(false);

    const handleStayActive = async () => {
        if (isIdleWarning || isForcedLogoutWarning) {
            setLastActivityAt(Date.now());
            setIsIdleWarning(false);
            setIsForcedLogoutWarning(false);
            setShowWarning(false);
        } else {
            setIsRefreshing(true);
            try {
                await onRefresh();
                setShowWarning(false);
            } catch {
                await onLogout();
            } finally {
                setIsRefreshing(false);
            }
        }
    };

    const resetIdleTimer = useCallback(() => {
        if (!isLocked && !isForcedLogoutWarning) {
            setLastActivityAt(Date.now());
        }
    }, [isLocked, isForcedLogoutWarning]);

    useEffect(() => {
        const events = ['mousedown', 'keydown', 'scroll', 'mousemove'];
        events.forEach(e => window.addEventListener(e, resetIdleTimer));
        return () => events.forEach(e => window.removeEventListener(e, resetIdleTimer));
    }, [resetIdleTimer]);

    useEffect(() => {
        if (!isLocked) setLastActivityAt(Date.now());
    }, [isLocked]);

    useEffect(() => {
        const check = async () => {
            if (isLoggingOut) return;
            const now = Date.now();
            const idleTime = now - lastActivityAt;

            // 1. Critical Cutoff
            if (idleTime >= DEFAULT_FORCED_IDLE_LOGOUT_MS) {
                await onLogout();
                return;
            }

            // 2. Token Expiry Check
            if (expiresAt !== null && expiresAt !== undefined && expiresAt !== '') {
                const expiryTime = new Date(expiresAt).getTime();
                const timeLeft = Math.floor((expiryTime - now) / 1000);
                setRemainingSeconds(timeLeft);

                if (timeLeft <= 0) {
                    await onLogout();
                    return;
                } else if (timeLeft <= WARNING_THRESHOLD) {
                    setIsIdleWarning(false);
                    setIsForcedLogoutWarning(false);
                    setShowWarning(true);
                    return;
                }
            }

            // 3. Activity-Based Protections
            if (idleTime >= DEFAULT_FORCED_IDLE_WARNING_MS) {
                setIsForcedLogoutWarning(true);
                setIsIdleWarning(false);
                setShowWarning(true);
            } else if (isLocked === false) {
                if (idleTime >= DEFAULT_IDLE_LOCK_MS) {
                    setIsIdleWarning(false);
                    setShowWarning(false);
                    lock();
                } else if (idleTime >= DEFAULT_IDLE_WARNING_MS) {
                    setIsIdleWarning(true);
                    setShowWarning(true);
                }
            }
        };

        const interval = setInterval(() => { void check(); }, 1000);
        void check();
        return () => clearInterval(interval);
    }, [expiresAt, lastActivityAt, isLocked, lock, isLoggingOut, onLogout]);

    useEffect(() => {
        if ((redirecting || isLocked) && !isForcedLogoutWarning) {
            setShowWarning(false);
        }
    }, [redirecting, isLocked, isForcedLogoutWarning]);

    if (redirecting) {
        return (
            <div className="fixed top-8 right-8 z-[10000] animate-in slide-in-from-right duration-500">
                <div className="bg-slate-900/90 backdrop-blur border-l-4 border-[#FF4B91] px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[320px]">
                    <ZLoader size="xs" color="#FF4B91" />
                    <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF4B91]">Security Breach Recovery</span>
                        <span className="text-sm font-bold text-white">Terminating link safely...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!showWarning) return null;

    const title = isForcedLogoutWarning ? "Security Cutoff Imminent" : isIdleWarning ? "Inactivity Protection" : "Link Expiry";
    const minutesLeft = remainingSeconds !== null ? Math.ceil(remainingSeconds / 60) : 3;
    const desc = isForcedLogoutWarning
        ? "Infrastructure node has been idle for 55m. Auto-cutoff in 5m."
        : isIdleWarning
            ? "Node inactivity detected. Terminal will lockdown in 2 minutes."
            : `Cryptographic session expires in ${minutesLeft} minutes. Stay active?`;

    return (
        <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-300">
            <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-[2rem] p-8 shadow-2xl space-y-6">
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="w-16 h-16 rounded-2xl bg-pink-500/10 flex items-center justify-center text-[#FF4B91] border border-[#FF4B91]/20">
                        {isForcedLogoutWarning ? <ShieldAlert size={32} /> : <Terminal size={32} />}
                    </div>
                    <div className="space-y-1">
                        <h3 className="text-xl font-black text-white uppercase tracking-tight">{title}</h3>
                        <p className="text-xs text-slate-400 font-medium leading-relaxed">{desc}</p>
                    </div>
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={() => { void handleStayActive(); }}
                        disabled={isRefreshing}
                        className="w-full py-4 rounded-2xl bg-[#FF4B91] text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-lg shadow-pink-500/20 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        {isRefreshing ? "Synchronizing..." : "Maintain Link"}
                    </button>
                    <button
                        onClick={() => { void onLogout(); }}
                        className="w-full py-4 rounded-2xl bg-white/5 text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] hover:bg-white/10 hover:text-white transition-all"
                    >
                        Terminate Session
                    </button>
                </div>
            </div>
        </div>
    );
}
