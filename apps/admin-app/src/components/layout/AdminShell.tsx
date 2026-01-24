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

    return (
        <div className="flex h-screen bg-muted/10 overflow-hidden">
            {/* Sidebar */}
            <aside className="w-72 border-r bg-background flex flex-col shadow-xl shadow-muted/20">
                <div className="p-8">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground font-black text-xl">A</div>
                        <span className="font-black text-2xl tracking-tighter">ADMIN CORE</span>
                    </div>

                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50 mb-6">Management</p>
                    <nav className="space-y-2">
                        {NAV_ITEMS.map((item) => {
                            const isActive = pathname === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center justify-between group px-4 py-3 rounded-2xl transition-all duration-300",
                                        isActive
                                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]"
                                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <item.icon size={22} className={cn("transition-colors", isActive ? "text-white" : "text-primary")} />
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

                <div className="mt-auto p-8 border-t bg-muted/5">
                    <button
                        onClick={logout}
                        className="flex items-center gap-4 w-full px-4 py-3 rounded-2xl text-red-500 font-bold hover:bg-red-50 transition-colors group"
                    >
                        <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
                        <span>Sign Out</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-20 border-b bg-background flex items-center justify-between px-10">
                    <div className="relative w-96 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Global command search..."
                            className="w-full bg-muted/50 border-none rounded-xl py-3 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-black italic">SUPER ADMIN</p>
                            <p className="text-xs text-muted-foreground font-bold">id: rh-9012-ad</p>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary to-secondary p-0.5">
                            <div className="h-full w-full rounded-[14px] bg-background flex items-center justify-center font-black">RH</div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-10">
                    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-700">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
