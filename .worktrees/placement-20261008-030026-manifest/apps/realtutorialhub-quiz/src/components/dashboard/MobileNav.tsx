'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    BookOpen,
    TrendingUp,
    Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';

const MOBILE_ITEMS = [
    { name: 'Home', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Quizzes', href: '/dashboard/my-exams', icon: BookOpen },
    { name: 'Stats', href: '/dashboard/path', icon: TrendingUp },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function MobileNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 w-full max-w-full overflow-x-hidden border-t-2 border-gray-200 bg-white px-4 py-3 md:hidden">
            <div className="mx-auto flex w-full max-w-lg min-w-0 items-center justify-between gap-2">
                {MOBILE_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex min-w-0 flex-1 flex-col items-center gap-1 overflow-hidden rounded-xl px-1 text-center transition-all",
                                isActive ? "text-pink-500" : "text-gray-500"
                            )}
                        >
                            <div className={cn(
                                "rounded-xl p-2 transition-all",
                                isActive && "bg-pink-50"
                            )}>
                                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className="w-full min-w-0 truncate text-[10px] font-black uppercase tracking-tighter">
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}