'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    BarChart3,
    Database,
    Users,
    ShieldAlert,
    Settings,
    ChevronRight,
    LogOut,
    Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { AdminGuard } from '../auth/AdminGuard';
import { useAuthStore } from '@/store/auth-store';
import { apiClient } from '@quiz/api-client';
import { useEffect } from 'react';

const ADMIN_NAV = [
    { name: 'Dashboard', href: '/', icon: BarChart3 },
    { name: 'Content Engine', href: '/content', icon: Database },
    { name: 'User Moderation', href: '/users', icon: Users },
    { name: 'Risk & Audit', href: '/audit', icon: ShieldAlert },
    { name: 'Platform Settings', href: '/settings', icon: Settings },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { token } = useAuthStore();

    useEffect(() => {
        if (token) {
            apiClient.setAccessToken(token);
        }
    }, [token]);

    return (
        <div className="flex min-h-screen bg-background text-foreground">
            {/* Sidebar */}
            <aside className="fixed inset-y-0 left-0 w-72 border-r bg-muted/30 backdrop-blur-md z-50 overflow-y-auto">
                <div className="flex flex-col h-full">
                    <div className="p-8">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-black">A</div>
                            <span className="text-xl font-black tracking-tight italic uppercase">QuizAdmin</span>
                        </Link>
                    </div>

                    <nav className="flex-1 px-4 space-y-2">
                        <p className="px-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-4">Platform Control</p>
                        {ADMIN_NAV.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center justify-between group px-4 py-3.5 rounded-2xl transition-all",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-xl shadow-primary/10"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <item.icon size={20} className={cn(isActive ? "text-primary-foreground" : "text-primary")} />
                                        <span className="font-bold text-sm tracking-tight">{item.name}</span>
                                    </div>
                                    <ChevronRight size={14} className={cn("transition-transform", isActive ? "opacity-100" : "opacity-0")} />
                                </Link>
                            );
                        })}
                    </nav>

                    <div className="p-6 mt-auto">
                        <div className="p-5 rounded-3xl bg-primary/5 border border-primary/10 mb-4">
                            <p className="text-xs font-bold text-primary uppercase mb-1">System Health</p>
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-sm font-bold">All Engines Active</span>
                            </div>
                        </div>
                        <button className="flex items-center gap-3 w-full px-4 py-3 rounded-2xl text-muted-foreground hover:text-primary hover:bg-muted transition-all">
                            <LogOut size={20} />
                            <span className="font-bold text-sm">Exit Terminal</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="pl-72 flex-1 w-full">
                {/* Top Header */}
                <header className="h-20 border-b flex items-center justify-between px-10 bg-background/50 backdrop-blur-sm sticky top-0 z-40">
                    <div className="flex items-center gap-4">
                        <h2 className="font-black text-sm uppercase tracking-widest text-muted-foreground">Terminal v1.0.4</h2>
                        <div className="h-4 w-px bg-border" />
                        <span className="text-xs font-bold text-green-500 tracking-tighter cursor-default">CONNECTED_SECURE</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <button className="relative p-2 rounded-xl hover:bg-muted transition-colors">
                            <Bell size={20} />
                            <div className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
                        </button>
                        <div className="flex items-center gap-3">
                            <div className="text-right">
                                <p className="text-xs font-black uppercase">Root Admin</p>
                                <p className="text-[10px] text-muted-foreground font-bold">Governance Level 5</p>
                            </div>
                            <div className="h-10 w-10 rounded-xl bg-muted border flex items-center justify-center font-black">RA</div>
                        </div>
                    </div>
                </header>

                <div className="p-10 max-w-7xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
