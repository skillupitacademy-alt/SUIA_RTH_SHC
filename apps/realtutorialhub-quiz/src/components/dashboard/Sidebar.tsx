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
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 shadow-xl shadow-slate-200/20 fixed inset-y-0 left-0 z-50">
            <div className="flex-1 flex flex-col pt-6 px-6 overflow-hidden">
                <div className="flex items-center gap-3 mb-10 pl-2 shrink-0">
                    <div className="h-8 w-8 rounded-xl bg-[#FF4B91] flex items-center justify-center text-white font-outfit font-black text-lg shadow-lg shadow-[#FF4B91]/30">Q</div>
                    <span className="font-outfit font-black text-xl tracking-tighter text-[#1A1A1A]">QUIZHUB</span>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide [mask-image:linear-gradient(to_bottom,transparent,black_2%,black_98%,transparent)] pt-2 pb-6 space-y-6">
                    {NAV_SECTIONS.map((section) => (
                        <div key={section.label}>
                            <p className="alpha-terminal text-slate-400 mb-2 px-4 !tracking-[0.2em]">{section.label}</p>
                            <nav className="space-y-1">
                                {section.items.map((item) => {
                                    const isActive = pathname === item.href;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={cn(
                                                "flex items-center gap-3 px-5 py-3.5 rounded-[1.25rem] transition-all duration-300 group",
                                                isActive
                                                    ? "bg-[#FF4B91] text-white shadow-xl shadow-[#FF4B91]/40 scale-[1.02] z-10"
                                                    : "text-slate-600 hover:bg-slate-50 hover:text-[#1A1A1A]"
                                            )}
                                            aria-label={item.name}
                                            aria-current={isActive ? "page" : undefined}
                                        >
                                            <item.icon
                                                size={20}
                                                className={cn(
                                                    "transition-colors duration-300",
                                                    isActive ? "text-white" : "text-[#FF4B91]"
                                                )}
                                            />
                                            <span className="font-inter font-bold text-[13px] uppercase tracking-wide">{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    ))}
                </div>
            </div>

            <div className="mt-auto p-6 border-t border-slate-50 bg-slate-50/30">
                <div
                    className="p-5 rounded-[2rem] bg-white border border-slate-200/60 shadow-sm cursor-help hover:border-[#FF4B91]/30 transition-colors group"
                    title="Target: 4 exams this week; progress can exceed 100%"
                >
                    <p className="alpha-terminal text-[#FF4B91] mb-3 !tracking-[0.2em]">Weekly Target</p>
                    <div className="h-2 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                        <div
                            className="h-full bg-[#FF4B91] transition-all duration-1000 ease-out shadow-[0_0_12px_rgba(255,75,145,0.4)]"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <div className="flex items-center justify-between mt-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {weeklyExams} / {weeklyGoal}
                        </span>
                        <span className="text-[10px] font-black text-[#FF4B91] uppercase tracking-widest">
                            {Math.round(progress)}%
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    );
}
