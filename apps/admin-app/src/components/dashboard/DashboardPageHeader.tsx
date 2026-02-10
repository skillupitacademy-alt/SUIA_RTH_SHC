'use client';

import { useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';

interface DashboardPageHeaderProps {
    title: string;
    subtitle?: string;
}

export function DashboardPageHeader({ title, subtitle }: DashboardPageHeaderProps) {
    const router = useRouter();

    return (
        <div className="flex flex-col gap-6 mb-8">
            <button
                onClick={() => router.push('/')} // Go back to main dashboard
                className="flex items-center gap-2 group w-fit"
            >
                <div className="p-2 rounded-xl bg-white border border-slate-200 group-hover:bg-[#FF4B91] group-hover:border-[#FF4B91] group-hover:text-white transition-all shadow-sm">
                    <ChevronLeft size={16} />
                </div>
                <span className="text-xs font-black uppercase tracking-widest text-slate-500 group-hover:text-[#FF4B91] transition-colors">
                    Back to Terminal
                </span>
            </button>

            <div>
                <h1 className="text-4xl font-outfit font-black tracking-tighter italic uppercase text-[#1A1A1A] mb-2">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest max-w-2xl">
                        {subtitle}
                    </p>
                )}
            </div>
            
            <div className="h-px w-full bg-slate-200/60" />
        </div>
    );
}
