'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { Palette } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ExamTheme, EXAM_THEMES } from '@/lib/exam-themes';

/**
 * Theme Switcher Component
 * 
 * Dev-only floating button to switch between exam themes.
 * Allows live comparison of 3 visual designs without page reload.
 */
export function ThemeSwitcher() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentTheme = (searchParams.get('theme') || 'executive') as ExamTheme;

    const switchTheme = (theme: ExamTheme) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('theme', theme);
        router.push(`?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="fixed top-24 right-4 z-[60] bg-white border-2 border-pink-500 rounded-2xl p-4 shadow-2xl shadow-pink-500/20 animate-in slide-in-from-right duration-300">
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-200">
                <Palette size={16} className="text-pink-500" />
                <p className="text-xs font-black uppercase tracking-wider text-gray-900">Theme Selector</p>
            </div>

            <div className="space-y-2">
                {(Object.keys(EXAM_THEMES) as ExamTheme[]).map((theme) => {
                    const config = EXAM_THEMES[theme];
                    const isActive = currentTheme === theme;

                    return (
                        <button
                            key={theme}
                            onClick={() => switchTheme(theme)}
                            className={cn(
                                "w-full text-left px-4 py-3 rounded-xl border-2 transition-all duration-150 group",
                                isActive
                                    ? "bg-pink-50 border-pink-500 shadow-md"
                                    : "bg-white border-gray-200 hover:border-pink-300 hover:bg-pink-50/50"
                            )}
                        >
                            <div className="flex items-center justify-between mb-1">
                                <span className={cn(
                                    "text-sm font-bold",
                                    isActive ? "text-pink-600" : "text-gray-900"
                                )}>
                                    {config.name}
                                </span>
                                {isActive && (
                                    <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
                                )}
                            </div>
                            <p className="text-[10px] text-gray-500 leading-tight">
                                {config.description}
                            </p>
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-[9px] text-gray-400 uppercase tracking-wider font-bold">
                    Dev Mode • Pick Your Favorite
                </p>
            </div>
        </div>
    );
}
