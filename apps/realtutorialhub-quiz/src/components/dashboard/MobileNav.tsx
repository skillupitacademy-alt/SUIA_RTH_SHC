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
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t-2 border-gray-200 px-6 py-3">
            <div className="flex items-center justify-between max-w-lg mx-auto">
                {MOBILE_ITEMS.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex flex-col items-center gap-1 transition-all",
                                isActive ? "text-pink-500" : "text-gray-500"
                            )}
                        >
                            <div className={cn(
                                "p-2 rounded-xl transition-all",
                                isActive && "bg-pink-50"
                            )}>
                                <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-tighter">
                                {item.name}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
