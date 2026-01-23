'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    Settings,
    ChevronRight,
    TrendingUp,
    Award
} from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Exams', href: '/dashboard/exams', icon: BookOpen },
    { name: 'Learning Path', href: '/dashboard/path', icon: TrendingUp },
    { name: 'Certifications', href: '/dashboard/certs', icon: Award },
    { name: 'Reports', href: '/dashboard/reports', icon: FileText },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="hidden md:flex flex-col w-64 border-r bg-muted/10">
            <div className="p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60 mb-4">Main Menu</p>
                <nav className="space-y-1">
                    {NAV_ITEMS.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "flex items-center justify-between group px-3 py-2.5 rounded-xl transition-all",
                                    isActive
                                        ? "bg-primary text-primary-foreground shadow-md"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon size={20} className={cn(isActive ? "text-white" : "text-primary")} />
                                    <span className="font-semibold text-sm">{item.name}</span>
                                </div>
                                <ChevronRight
                                    size={16}
                                    className={cn(
                                        "transition-transform",
                                        isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0"
                                    )}
                                />
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="mt-auto p-6">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-secondary/10 to-primary/10 border border-primary/20">
                    <p className="text-sm font-bold mb-1">Weekly Goal</p>
                    <div className="h-2 w-full bg-muted rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-secondary w-3/4" />
                    </div>
                    <p className="text-[10px] mt-2 text-muted-foreground">75% complete (3/4 exams)</p>
                </div>
            </div>
        </aside>
    );
}
