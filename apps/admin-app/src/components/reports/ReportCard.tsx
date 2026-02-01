import React from 'react';
import { ChevronRight, Target, Brain, Shield, Zap, TrendingUp, Layers } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportCardProps {
    title: string;
    count: number;
    distribution: {
        simple: number;
        intermediate: number;
        expert: number;
    };
    isReady: boolean;
    onClick: () => void;
    level: 'domain' | 'subject' | 'topic' | 'subtopic';
    subtitle?: string;
}

export const ReportCard: React.FC<ReportCardProps> = ({
    title,
    count,
    distribution,
    isReady,
    onClick,
    level,
    subtitle
}) => {
    // Dynamic styling based on level
    const themeParams = {
        domain: {
            icon: Target,
            gradient: "from-blue-500 to-indigo-600",
            bg: "bg-blue-50/50",
            border: "border-blue-100",
            accent: "text-blue-600",
            shadow: "shadow-blue-500/10"
        },
        subject: {
            icon: Brain,
            gradient: "from-[#FF4B91] to-[#FF8E9E]",
            bg: "bg-pink-50/50",
            border: "border-pink-100",
            accent: "text-[#FF4B91]",
            shadow: "shadow-[#FF4B91]/10"
        },
        topic: {
            icon: Zap,
            gradient: "from-amber-400 to-orange-500",
            bg: "bg-amber-50/50",
            border: "border-amber-100",
            accent: "text-amber-600",
            shadow: "shadow-amber-500/10"
        },
        subtopic: {
            icon: Layers,
            gradient: "from-teal-400 to-emerald-500",
            bg: "bg-teal-50/50",
            border: "border-teal-100",
            accent: "text-teal-600",
            shadow: "shadow-teal-500/10"
        }
    }[level];

    const Icon = themeParams.icon;

    return (
        <button
            onClick={onClick}
            className={cn(
                "group relative w-full text-left bg-white rounded-[2.5rem] border-2 p-8 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl",
                themeParams.border,
                themeParams.shadow
            )}
        >
            {/* Header Area */}
            <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-4">
                    <div className={cn(
                        "p-4 rounded-2xl bg-gradient-to-br shadow-lg transition-transform duration-500 group-hover:rotate-6",
                        themeParams.gradient
                    )}>
                        <Icon size={24} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-[#1A1A1A] tracking-tighter uppercase italic group-hover:text-primary transition-colors">
                            {title}
                        </h3>
                        {subtitle && (
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">
                                {subtitle}
                            </p>
                        )}
                    </div>
                </div>
                <div className={cn(
                    "flex flex-col items-end gap-1 px-4 py-2 rounded-2xl border transition-all duration-500 group-hover:bg-white group-hover:shadow-md",
                    themeParams.bg,
                    themeParams.border
                )}>
                    <span className={cn("text-2xl font-black tracking-tighter leading-none", themeParams.accent)}>
                        {count.toString().padStart(2, '0')}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">Questions_</span>
                </div>
            </div>

            {/* Distribution Bar */}
            <div className="space-y-3 mb-8">
                <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                    <span>Complexity Balance</span>
                    <span className={cn(
                        "px-2 py-0.5 rounded-lg border",
                        isReady ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
                    )}>
                        {isReady ? "READY_ACTIVE" : "INSUFFICIENT_DATA"}
                    </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full flex overflow-hidden p-0.5">
                    <div
                        style={{ width: `${(distribution.simple / count) * 100 || 0}%` }}
                        className="h-full bg-blue-400 rounded-full"
                        title={`Simple: ${distribution.simple}`}
                    />
                    <div
                        style={{ width: `${(distribution.intermediate / count) * 100 || 0}%` }}
                        className="h-full bg-[#FF4B91] rounded-full mx-0.5"
                        title={`Intermediate: ${distribution.intermediate}`}
                    />
                    <div
                        style={{ width: `${(distribution.expert / count) * 100 || 0}%` }}
                        className="h-full bg-slate-800 rounded-full"
                        title={`Expert: ${distribution.expert}`}
                    />
                </div>
            </div>

            {/* Footer Stats */}
            <div className="grid grid-cols-3 gap-2">
                <StatBox label="Simple" value={distribution.simple} color="text-blue-500" />
                <StatBox label="Interm" value={distribution.intermediate} color="text-[#FF4B91]" />
                <StatBox label="Expert" value={distribution.expert} color="text-slate-900" />
            </div>

            {/* Hover Action Indicator */}
            <div className="absolute bottom-6 right-8 opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 transition-all duration-500">
                <div className={cn(
                    "p-2 rounded-xl text-white",
                    themeParams.gradient
                )}>
                    <ChevronRight size={16} />
                </div>
            </div>
        </button>
    );
};

const StatBox = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="bg-[#FAFAFA] rounded-2xl border border-primary/5 p-3 text-center">
        <p className="text-[8px] font-black uppercase tracking-widest text-muted-foreground mb-1">{label}</p>
        <p className={cn("text-xs font-black", color)}>{value}</p>
    </div>
);
