'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    Database,
    FileText,
    ShieldAlert,
    Settings,
    LogOut,
    ChevronRight,
    Bell,
    AlertTriangle,
    Search,
    Search,
    Users,
    ShieldCheck
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { AdminGuard } from '../auth/AdminGuard';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@quiz/api-client';
import { useEffect } from 'react';
import { useStrictNavigation } from '@/hooks/useStrictNavigation';
import { usePresenceHeartbeat } from '@/hooks/usePresenceHeartbeat';

const ADMIN_NAV = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Question Bank', href: '/questions', icon: Database },
    { name: 'Blueprint Manager', href: '/blueprints', icon: FileText },
    { name: 'Users', href: '/users', icon: Users },
    { name: 'Audit Logs', href: '/audit', icon: ShieldAlert },
    { name: 'Governance', href: '/governance', icon: ShieldCheck },
    { name: 'Settings', href: '/settings', icon: Settings },
];


export default function AdminLayout({ children }: { children: React.ReactNode }) {
    useStrictNavigation();
    usePresenceHeartbeat();
    const router = useRouter();
    const pathname = usePathname();
    const { token, logout } = useAuthStore();
    const { showWarning, confirmLogout, cancelNavigation } = useStrictNavigation();

    useEffect(() => {
        if (token) {
            apiClient.setAccessToken(token);
        }
    }, [token]);

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    const isGuestPath = ['/login', '/forgot-password', '/reset-password'].includes(pathname);

    if (isGuestPath) {
        return (
            <div className="min-h-screen grid lg:grid-cols-2 bg-background font-sans">
                {/* Visual Side */}
                <div className="hidden lg:flex flex-col justify-between p-12 bg-[#020408] text-white relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070')] bg-cover opacity-20" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="h-10 w-10 rounded-xl bg-[#FF4B91] flex items-center justify-center font-black text-xl shadow-lg shadow-[#FF4B91]/30">Q</div>
                            <span className="text-2xl font-black tracking-tighter text-white">QUIZADMIN</span>
                        </div>
                    </div>
                    <div className="relative z-10 space-y-6">
                        <h1 className="text-5xl font-black leading-tight tracking-tighter italic uppercase">
                            Secure <br />
                            <span className="text-[#FF4B91]">Governance</span>
                        </h1>
                        <p className="text-lg text-gray-400 max-w-md font-medium">
                            Authorized personnel only. Secure access to the governance terminal is strictly audited.
                        </p>
                    </div>
                    <div className="relative z-10 text-xs font-black uppercase tracking-widest text-gray-500">
                        SYSTEM_ID: RH-9011-GC // SECURE_LAYER_V1
                    </div>
                </div>

                {/* Form Side */}
                <div className="flex items-center justify-center p-8 bg-muted/5">
                    <div className="w-full max-w-md space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {children}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <AdminGuard>
            {showWarning && (
                <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-background border rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-[#FF4B91] z-10" />
                        <div className="flex flex-col items-center text-center gap-4">
                            <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-2">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-[#1A1A1A]">Security Warning</h3>
                            <p className="text-muted-foreground font-medium">
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
                                    onClick={confirmLogout}
                                    className="px-6 py-4 rounded-2xl bg-red-600 text-white font-black uppercase tracking-widest text-xs hover:bg-red-700 transition-all shadow-lg shadow-red-600/20"
                                >
                                    Log Out
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex min-h-screen bg-muted/10 overflow-hidden font-sans">
                {/* Sidebar */}
                <aside className="w-64 border-r bg-background flex flex-col shadow-xl shadow-muted/5 fixed inset-y-0 left-0 z-50">
                    <div className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-xl bg-[#FF4B91] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-[#FF4B91]/30">Q</div>
                                <span className="font-black text-lg tracking-tighter text-[#1A1A1A]">QUIZADMIN</span>
                            </div>
                        </div>

                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-6 px-4">Platform Control</p>
                        <nav className="space-y-2">
                            {ADMIN_NAV.map((item) => {
                                const isActive = pathname === item.href;
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center justify-between group px-4 py-2.5 rounded-[1.25rem] transition-all duration-300",
                                            isActive
                                                ? "bg-[#FF4B91] text-white shadow-xl shadow-[#FF4B91]/30 scale-[1.02]"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <item.icon size={20} className={cn("transition-colors", isActive ? "text-white" : "text-[#FF4B91]")} />
                                            <span className="font-bold text-[14px]">{item.name}</span>
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

                    <div className="mt-auto p-6 border-t bg-muted/5">
                        <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10 mb-4">
                            <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em] mb-1">System Health</p>
                            <div className="flex items-center gap-2">
                                <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-[10px] font-black uppercase tracking-tight">Engines Active</span>
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="flex items-center gap-4 w-full px-5 py-3 rounded-[1.25rem] text-red-500 font-bold hover:bg-red-50 transition-colors group"
                        >
                            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
                            <span className="text-xs font-black uppercase tracking-widest">Sign Out</span>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <div className="flex-1 flex flex-col overflow-hidden ml-64">
                    <header className="h-16 border-b bg-background flex items-center justify-between px-8 sticky top-0 z-40">
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-3 pr-6 border-r border-muted-foreground/10">
                                <div className="h-9 w-9 rounded-2xl bg-[#FF4B91] flex items-center justify-center text-white font-black text-lg shadow-lg shadow-[#FF4B91]/30">A</div>
                                <span className="font-black text-xl tracking-tighter text-[#1A1A1A]">ADMIN CORE</span>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Terminal v1.0.4</span>
                                <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-500 text-[9px] font-black uppercase tracking-widest border border-green-500/20">Connected_Secure</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-5">
                            <div className="text-right">
                                <p className="text-xs font-black italic text-[#1A1A1A]">SUPER ADMIN</p>
                                <p className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest">id: rh-9012-ad</p>
                            </div>
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[#FF4B91] to-[#FF8E9E] p-0.5 shadow-lg shadow-[#FF4B91]/20">
                                <div className="h-full w-full rounded-[10px] bg-background flex items-center justify-center font-black text-[#FF4B91] text-xs">RH</div>
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
