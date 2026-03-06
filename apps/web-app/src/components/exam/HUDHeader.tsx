/* eslint-disable @typescript-eslint/no-explicit-any */
import { Timer } from 'lucide-react';
import { cn } from '@/lib/utils';

interface HUDHeaderProps {
    examId: string;
    timeLeft: number;
    isNearEnd: boolean;
    formatTime: (seconds: number) => string;
    onTerminate: () => void;
    theme: any;
}

export function HUDHeader({
    examId,
    timeLeft,
    isNearEnd,
    formatTime,
    onTerminate,
    theme
}: HUDHeaderProps) {
    return (
        <header className={cn(
            "shrink-0 z-50 border-b px-6 flex items-center justify-between backdrop-blur-xl",
            theme.spacing.headerHeight,
            "bg-white/90 border-gray-200"
        )}>
            <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-lg bg-pink-500 flex items-center justify-center font-black text-white">!G</div>
                <div className="h-4 w-[1px] bg-gray-200 mx-2" />
                <div>
                    <h2 className="text-xs font-black font-outfit uppercase tracking-widest text-gray-500">Active Campaign</h2>
                    <p className="text-sm font-bold truncate max-w-[200px] text-gray-900">{examId}</p>
                </div>
            </div>

            <div className={cn(
                "flex items-center gap-3 px-6 py-2 rounded-full border transition-all duration-500",
                isNearEnd ? "border-pink-500/50 bg-pink-50 animate-pulse" : "border-gray-200 bg-gray-50"
            )}>
                <Timer size={18} className={isNearEnd ? "text-pink-500" : "text-gray-600"} />
                <span className={cn(
                    "font-mono font-black text-lg tabular-nums",
                    isNearEnd ? "text-pink-500" : "text-gray-900"
                )}>
                    {formatTime(timeLeft)}
                </span>
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={onTerminate}
                    className="px-6 py-2 bg-pink-500 text-white text-sm font-black font-outfit rounded-full hover:scale-105 active:scale-95 transition-all shadow-lg shadow-pink-500/20"
                >
                    TERMINATE SESSION
                </button>
            </div>
        </header>
    );
}
