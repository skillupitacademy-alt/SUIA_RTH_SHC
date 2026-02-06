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

import { useDashboardStore } from '@/store/dashboard-store';

const NAV_ITEMS = [
    { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
    { name: 'My Exams', href: '/dashboard/my-exams', icon: BookOpen },
    { name: 'Learning Path', href: '/dashboard/path', icon: TrendingUp },
    { name: 'Certifications', href: '/dashboard/certs', icon: Award },
    { name: 'Reports', href: '/dashboard/reports', icon: FileText },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export function Sidebar() {
    const pathname = usePathname();
    const { data } = useDashboardStore();

    const weeklyExams = data?.overview?.weeklyExamsCount || 0;
    const weeklyGoal = 4;
    const progress = Math.min((weeklyExams / weeklyGoal) * 100, 100);

    return (
        <aside className="hidden md:flex flex-col w-64 border-r-2 border-gray-200 bg-white">
            <div className="p-6">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-4">Main Menu</p>
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
                                        ? "bg-pink-50 text-pink-600 border-l-4 border-pink-500"
                                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon size={20} className={cn(isActive ? "text-pink-500" : "text-gray-500")} />
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
                <div className="p-4 rounded-xl bg-pink-50 border-2 border-pink-200">
                    <p className="text-sm font-bold text-gray-900 mb-1">Weekly Goal</p>
                    <div className="h-2 w-full bg-gray-200 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-pink-500 transition-all duration-500" style={{ width: `${progress}%` }} />
                    </div>
                    <p className="text-[10px] mt-2 text-gray-600">{progress}% complete ({weeklyExams}/{weeklyGoal} exams)</p>
                </div>
            </div>
        </aside>
    );
}
