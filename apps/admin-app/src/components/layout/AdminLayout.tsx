'use client';

import { apiClient } from '@quiz/api-client';
import { ThemeToggle } from '@quiz/ui';
import {
    AlertTriangle,
    BarChart3,
    ChevronRight,
    Database,
    LayoutDashboard,
    LogOut,
    ShieldCheck,
    Users} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { AdminGuard } from '@/components/auth/AdminGuard';
import { AdminLockScreen } from '@/components/auth/AdminLockScreen';
import { SessionWatcher } from '@/components/auth/SessionWatcher';
import { JobStatusBadge } from '@/components/jobs/JobStatusBadge';
import { usePresenceHeartbeat } from '@/hooks/usePresenceHeartbeat';
import { useStrictNavigation } from '@/hooks/useStrictNavigation';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

const ADMIN_NAV = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Question Bank', href: '/questions', icon: Database },
    { name: 'Question Factory', href: '/factory/question-generator', icon: BarChart3 },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Governance', href: '/governance', icon: ShieldCheck },
];


export default function AdminLayout({ children }: { children: React.ReactNode }) {
    useStrictNavigation();
    usePresenceHeartbeat();
    const pathname = usePathname();
    const { logout, expiresAt, user, login, setLoggingOut } = useAuthStore();
    const [isRedirecting, setIsRedirecting] = useState(false);
    const [redirectMessage, setRedirectMessage] = useState<string | undefined>(undefined);
    const { showWarning, cancelNavigation } = useStrictNavigation();

    const handleLogout = async (reason?: 'session_expired') => {
        if (isRedirecting) return;
        setLoggingOut(true);
        setIsRedirecting(true);
        setRedirectMessage(reason === 'session_expired' ? 'Session expired. Redirecting...' : 'Logging out. Redirecting...');

        // Terminate session on server immediately
        try {
            await apiClient.auth.logout();
        } catch (err) {
            console.error("Admin logout server call failed:", err);
        }

        // Brief delay for toast visibility
        setTimeout(() => {
            logout();
            localStorage.removeItem('quiz-platform-admin-auth');
            const targetUrl = reason ? `/login?reason=${reason}` : '/login';
            window.location.href = targetUrl;
            setIsRedirecting(false);
        }, 3000);
    };

    const onManualLogout = () => handleLogout();
    const onExpiryLogout = () => handleLogout('session_expired');

    const handleRefresh = async () => {
        const response = await apiClient.auth.refresh();
        if (response && response.expiresAt && user) {
            login(user, response.expiresAt);
        } else {
            throw new Error("Refresh failed");
        }
    };

    return (
        <AdminGuard>
            <SessionWatcher
                expiresAt={expiresAt}
                onRefresh={handleRefresh}
                onLogout={onExpiryLogout}
                isRedirecting={isRedirecting}
                redirectMessage={redirectMessage}
            />
            <AdminLockScreen />
            {showWarning && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-background border rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-[#FF4B91] z-10" />
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-2xl font-outfit font-black text-[#1A1A1A]">Security Warning</h3>
                            <p className="text-muted-foreground font-inter font-medium">
                                Navigation attempt detected. For security reasons, using the browser <strong>Back</strong> button will terminate your session.
                            </p>

                            <div className="grid grid-cols-2 gap-4 w-full mt-6">
                                <button
                                    onClick={cancelNavigation}
                                    className="px-6 py-4 rounded-2xl border-2 font-black uppercase tracking-widest text-xs hover:bg-muted transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={onManualLogout}
                                    className="px-6 py-4 rounded-2xl bg-red-600 text-white font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                                >
                                    Log Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="h-screen bg-muted/10 overflow-hidden font-sans relative">
                {/* Sidebar */}
                <aside className="w-64 border-r bg-background flex flex-col shadow-xl shadow-muted/5 fixed inset-y-0 left-0 z-50">
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-xl bg-[#FF4B91] flex items-center justify-center text-white font-outfit font-black text-lg shadow-lg shadow-[#FF4B91]/30">Q</div>
                                <span className="font-outfit font-black text-lg tracking-tighter text-[#1A1A1A]">QUIZADMIN</span>
                            </div>
                        </div>

                        <p className="alpha-terminal text-slate-400 mb-6 px-4">Platform Control</p>
                        <nav className="space-y-2">
                            {ADMIN_NAV.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center justify-between group px-4 py-3 rounded-[1.25rem] transition-all duration-300",
                                            isActive
                                                ? "bg-[#FF4B91] text-white shadow-xl shadow-[#FF4B91]/30 scale-[1.02]"
                                                : "text-slate-600 hover:bg-slate-50 hover:text-[#1A1A1A]"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon size={20} className={cn("transition-colors", isActive ? "text-white" : "text-[#FF4B91]")} />
                                            <span className="font-inter font-bold text-[15px]">{item.name}</span>
                                        </div>
                                        <ChevronRight
                                            size={16}
                                            className={cn(
                                                "transition-all duration-300",
                                                isActive ? "opacity-100 rotate-90" : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                                            )}
                                        />
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>

                    <div className="mt-auto p-6 border-t bg-slate-50/50">
                        <div className="p-4 rounded-2xl bg-white border border-slate-200 mb-4 shadow-sm">
                            <p className="alpha-terminal text-[#FF4B91] mb-1.5 !tracking-[0.2em]">System Health</p>
                            <div className="flex items-center gap-2.5">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="alpha-terminal tracking-tight text-slate-700">Engines Active</span>
                            </div>
                        </div>
                        <button
                            onClick={onManualLogout}
                            className="flex items-center gap-4 w-full px-5 py-4 rounded-[1.25rem] text-red-500 font-inter font-bold hover:bg-red-50 transition-colors group"
                        >
                            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="alpha-terminal !tracking-widest">Sign Out</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex flex-col h-full ml-64 overflow-hidden">
                    <header className="h-20 border-b bg-white flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
                        <div className="flex items-center gap-8">
                            <div className="flex items-center gap-4 pr-8 border-r border-slate-100">
                                <div className="h-10 w-10 rounded-2xl bg-[#FF4B91] flex items-center justify-center text-white font-outfit font-black text-xl shadow-lg shadow-[#FF4B91]/30">A</div>
                                <span className="font-outfit font-black text-2xl tracking-tighter text-[#1A1A1A]">ADMIN CORE</span>
                            </div>
                            <div className="flex items-center gap-4">
                                <span className="alpha-terminal !tracking-widest text-slate-400">Terminal v1.0.4</span>
                                <span className="px-3 py-1 rounded-full bg-green-50 text-green-600 alpha-terminal !tracking-widest border border-green-200">Connected_Secure</span>
                                <div className="h-6 w-[1px] bg-slate-200 mx-2" />
                                <JobStatusBadge />
                                <div className="h-6 w-[1px] bg-slate-200 mx-2" />
                                <ThemeToggle />
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <p className="alpha-terminal !tracking-widest text-[#1A1A1A]">SUPER ADMIN</p>
                                <p className="alpha-terminal !tracking-widest text-slate-400 mt-0.5">id: rh-9012-ad</p>
                            </div>
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#FF4B91] to-[#FF8E9E] p-0.5 shadow-xl shadow-[#FF4B91]/20">
                                <div className="h-full w-full rounded-[14px] bg-white flex items-center justify-center font-outfit font-black text-[#FF4B91] text-sm">RH</div>
                            </div>
                        </div>
                    </header>

                    <main className="flex-1 overflow-y-auto p-8">
                        <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </AdminGuard>
    );
}
