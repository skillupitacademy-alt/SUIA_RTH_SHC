import { ArrowLeft, Box } from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { PageTitle } from './PageTitle';

interface FactoryLayoutProps {
    children: React.ReactNode;
    title: string;
    subtitle?: string;
    backPath?: string;
}

export function FactoryLayout({ children, title, subtitle, backPath = '/' }: FactoryLayoutProps) {
    return (
        <div className="min-h-screen bg-slate-50 flex flex-col">
            {/* Factory Header */}
            <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-6 flex items-center justify-between shadow-sm/50">
                <div className="flex items-center gap-4">
                    <Link
                        href={backPath}
                        className="p-2 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <div className="flex items-center gap-2">
                            <Box className="w-5 h-5 text-indigo-600" />
                            <PageTitle text={title} className="text-4xl leading-none" />
                        </div>
                        {(subtitle as string | undefined) !== undefined && (subtitle as string) !== '' ? <p className="text-[10px] font-bold text-slate-400 tracking-wide uppercase mt-0.5 ml-7">
                            {subtitle}
                        </p> : null}
                    </div>
                </div>

                {/* Status Indicator (Optional) */}
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                        Factory Engine Ready
                    </span>
                </div>
            </header>

            {/* Main Workspace */}
            <main className="flex-1 flex flex-col max-w-[1920px] mx-auto w-full">
                {children}
            </main>
        </div>
    );
}
