'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Database,
    FileText,
    ShieldAlert,
    Settings,
    LogOut,
    ChevronRight,
    Search
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

const NAV_ITEMS = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Question Bank', href: '/questions', icon: Database },
    { name: 'Blueprint Manager', href: '/blueprints', icon: FileText },
    { name: 'Audit Logs', href: '/audit', icon: ShieldAlert },
    { name: 'Settings', href: '/settings', icon: Settings },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const { logout } = useAuthStore();

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    return (
        <div className="flex h-screen bg-muted/10 overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-80 border-r bg-background flex flex-col shadow-xl shadow-muted/5">
                <div className="p-10">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="flex items-center gap-2">
                            <div className="h-10 w-10 rounded-xl bg-[#FF4B91] flex items-center justify-center text-white font-black text-xl shadow-lg shadow-[#FF4B91]/30">Q</div>
                            <span className="font-black text-2xl tracking-tighter text-[#1A1A1A]">QUIZADMIN</span>
                        </div>
                    </div>

                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 mb-8 px-4">Platform Control</p>
                    <nav className="space-y-4">
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center justify-between group px-6 py-4 rounded-[1.5rem] transition-all duration-300",
                                        isActive
                                            ? "bg-[#FF4B91] text-white shadow-xl shadow-[#FF4B91]/30 scale-[1.02]"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <item.icon size={22} className={cn("transition-colors", isActive ? "text-white" : "text-[#FF4B91]")} />
                                        <span className="font-bold text-[15px]">{item.name}</span>
                                    </div>
                                    <ChevronRight
                                        size={18}
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

                <div className="mt-auto p-10 border-t bg-muted/5">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 w-full px-6 py-4 rounded-[1.5rem] text-red-500 font-bold hover:bg-red-50 transition-colors group"
                    >
                        <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-24 border-b bg-background flex items-center justify-between px-12">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-3 pr-8 border-r border-muted-foreground/10">
                            <div className="h-12 w-12 rounded-2xl bg-[#FF4B91] flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-[#FF4B91]/30">A</div>
                            <span className="font-black text-3xl tracking-tighter text-[#1A1A1A]">ADMIN CORE</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Terminal v1.0.4</span>
                            <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-widest border border-green-500/20">Connected_Secure</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="text-right">
                            <p className="text-sm font-black italic text-[#1A1A1A]">SUPER ADMIN</p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">id: rh-9012-ad</p>
                        </div>
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#FF4B91] to-[#FF8E9E] p-0.5 shadow-lg shadow-[#FF4B91]/20">
                            <div className="h-full w-full rounded-[14px] bg-background flex items-center justify-center font-black text-[#FF4B91]">RH</div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-12">
                    <div className="w-full animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
