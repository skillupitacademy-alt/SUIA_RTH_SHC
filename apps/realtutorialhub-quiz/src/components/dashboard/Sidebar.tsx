'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    BookOpen,
    FileText,
    Settings,
    TrendingUp,
    Award,
    Mail,
    Target,
    CheckSquare,
    FolderCode,
    Video,
    Library
} from 'lucide-react';
import { cn } from '@/lib/utils';

import { useDashboardStore } from '@/store/dashboard-store';

const NAV_SECTIONS = [
    {
        label: 'Assessment',
        items: [
            { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
            { name: 'My Exams', href: '/dashboard/my-exams', icon: BookOpen },
            { name: 'Reports', href: '/dashboard/reports', icon: FileText },
            { name: 'Certifications', href: '/dashboard/certs', icon: Award },
        ]
    },
    {
        label: 'Learning',
        items: [
            { name: 'Knowledge Hub', href: '/learn', icon: Library },
            { name: 'Remediation Plan', href: '/learn/remediation', icon: Target },
            { name: 'Assignments', href: '/dashboard/assignments', icon: CheckSquare },
            { name: 'My Projects', href: '/projects', icon: FolderCode },
            { name: 'Live Sessions', href: '/dashboard/sessions', icon: Video },
        ]
    },
    {
        label: 'Account',
        items: [
            { name: 'Learning Insights', href: '/dashboard/insights', icon: TrendingUp },
            { name: 'Inbox', href: '/dashboard/inbox', icon: Mail },
            { name: 'Settings', href: '/dashboard/settings', icon: Settings },
        ]
    }
];

export function Sidebar() {
    const pathname = usePathname();
    const data = useDashboardStore((s) => s.data);

    const weeklyExams = data?.overview?.weeklyExamsCount || 0;
    const weeklyGoal = 4;
    const progress = Math.min((weeklyExams / weeklyGoal) * 100, 100);

    return (
        <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 max-w-[100vw] shrink-0 overflow-hidden border-r border-slate-100 bg-white shadow-xl shadow-slate-200/20 md:flex md:flex-col">
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-6 pt-6">
                <div className="mb-10 flex shrink-0 items-center gap-3 overflow-hidden pl-2">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#FF4B91] text-lg font-outfit font-black text-white shadow-lg shadow-[#FF4B91]/30">Q</div>
                    <span className="min-w-0 truncate font-outfit text-xl font-black tracking-tighter text-[#1A1A1A]">QUIZHUB</span>
                </div>

                <div className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-hide [mask-image:linear-gradient(to_bottom,transparent,black_2%,black_98%,transparent)] pt-2 pb-6">
                    <div className="space-y-6 pr-1">
                        {NAV_SECTIONS.map((section) => (
                            <div key={section.label} className="min-w-0">
                                <p className="mb-2 overflow-hidden px-4 text-ellipsis whitespace-nowrap alpha-terminal !tracking-[0.2em] text-slate-400">{section.label}</p>
                                <nav className="space-y-1">
                                    {section.items.map((item) => {
                                        const isActive = pathname === item.href;
                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                className={cn(
                                                    "group flex w-full min-w-0 items-center gap-3 overflow-hidden rounded-[1.25rem] px-5 py-3.5 transition-all duration-300",
                                                    isActive
                                                        ? "z-10 bg-[#FF4B91] text-white shadow-xl shadow-[#FF4B91]/40"
                                                        : "text-slate-600 hover:bg-slate-50 hover:text-[#1A1A1A]"
                                                )}
                                                aria-label={item.name}
                                                aria-current={isActive ? "page" : undefined}
                                            >
                                                <item.icon
                                                    size={20}
                                                    className={cn(
                                                        "shrink-0 transition-colors duration-300",
                                                        isActive ? "text-white" : "text-[#FF4B91]"
                                                    )}
                                                />
                                                <span className="min-w-0 truncate font-inter text-[13px] font-bold uppercase tracking-wide">{item.name}</span>
                                            </Link>
                                        );
                                    })}
                                </nav>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mt-auto max-w-full overflow-hidden border-t border-slate-50 bg-slate-50/30 p-6">
                <div
                    className="group cursor-help rounded-[2rem] border border-slate-200/60 bg-white p-5 shadow-sm transition-colors hover:border-[#FF4B91]/30"
                    title="Target: 4 exams this week; progress can exceed 100%"
                >
                    <p className="mb-3 overflow-hidden text-ellipsis whitespace-nowrap alpha-terminal !tracking-[0.2em] text-[#FF4B91]">Weekly Target</p>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                            className="h-full bg-[#FF4B91] shadow-[0_0_12px_rgba(255,75,145,0.4)] transition-all duration-1000 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="mt-4 flex min-w-0 items-center justify-between gap-3">
                        <span className="min-w-0 truncate text-[10px] font-black uppercase tracking-widest text-slate-400">
                            {weeklyExams} / {weeklyGoal}
                        </span>
                        <span className="shrink-0 text-[10px] font-black uppercase tracking-widest text-[#FF4B91]">
                            {Math.round(progress)}%
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    );
}