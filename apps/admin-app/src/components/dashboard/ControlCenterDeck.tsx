'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@quiz/api-client';
import { TrendingUp, TrendingDown, Target, CheckCircle2, FileBarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ZTooltip } from '@/components/ui/ZTooltip';

interface SummaryData {
    avgScore: number;
    passRate: number;
    totalExams: number;
    deltaPct: number | null;
    healthStatus: 'green' | 'yellow' | 'red';
}

export function ControlCenterDeck() {
    const [stats, setStats] = useState<SummaryData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const data = await apiClient.admin.getPerformanceAnalytics();
                setStats(data.summary);
            } catch (err) {
                console.error("Failed to fetch control center stats", err);
            } finally {
                setLoading(false);
            }
        };
        fetch();
    }, []);

    if (loading || !stats) return null;

    const cards = [
        {
            label: 'Global Average Score',
            value: `${stats.avgScore}%`,
            subtext: 'Mean across all domains',
            icon: Target,
            delta: stats.deltaPct,
            status: stats.healthStatus,
            tooltip: "The average score of all completed exams in the current period."
        },
        {
            label: 'Pass Rate',
            value: `${Math.round(stats.passRate * 100)}%`,
            subtext: 'Candidates scoring ≥70%',
            icon: CheckCircle2,
            delta: null, // Pass rate delta calculation requires previous pass rate (api refactor needed for strict pp, using score delta as proxy for health)
            status: stats.passRate >= 0.7 ? 'green' : stats.passRate >= 0.5 ? 'yellow' : 'red',
            tooltip: "Percentage of exams meeting the 70% passing threshold."
        },
        {
            label: 'Total Exams Evaluated',
            value: stats.totalExams.toLocaleString(),
            subtext: 'Volume this period',
            icon: FileBarChart2,
            delta: null,
            status: 'green',
            tooltip: "Total number of exams completed and analyzed."
        }
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'green': return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
            case 'yellow': return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
            case 'red': return 'bg-rose-500/10 text-rose-600 border-rose-500/20';
            default: return 'bg-slate-100 text-slate-600 border-slate-200';
        }
    };

    const getStatusIconColor = (status: string) => {
        switch (status) {
            case 'green': return 'text-emerald-500';
            case 'yellow': return 'text-amber-500';
            case 'red': return 'text-rose-500';
            default: return 'text-slate-400';
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map((card, i) => (
                <div key={i} className={cn(
                    "p-6 rounded-[2rem] border backdrop-blur-md transition-all group hover:scale-[1.01]",
                    getStatusColor(card.status)
                )}>
                    <div className="flex items-start justify-between mb-4">
                        <div className={cn("p-3 rounded-2xl bg-white/60", getStatusIconColor(card.status))}>
                            <card.icon size={24} />
                        </div>
                        {card.delta !== null && (
                            <div className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border bg-white/50",
                                card.delta >= 0 ? "text-emerald-700 border-emerald-200" : "text-rose-700 border-rose-200"
                            )}>
                                {card.delta >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                <span>{card.delta > 0 ? '+' : ''}{card.delta}%</span>
                            </div>
                        )}
                    </div>

                    <div>
                        <ZTooltip content={card.tooltip} side="top">
                            <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-1 cursor-help flex items-center gap-2 w-fit">
                                {card.label}
                            </p>
                        </ZTooltip>

                        <p className="text-4xl font-black tracking-tighter mb-1">{card.value}</p>
                        <p className="text-xs font-bold opacity-60 uppercase tracking-wide">{card.subtext}</p>
                    </div>

                    {/* Status Indicator Bar */}
                    <div className="mt-6 h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
                        <div className={cn(
                            "h-full rounded-full transition-all duration-1000",
                            card.status === 'green' ? 'bg-emerald-500 w-[90%]' :
                                card.status === 'yellow' ? 'bg-amber-500 w-[60%]' : 'bg-rose-500 w-[30%]'
                        )} />
                    </div>
                </div>
            ))}
        </div>
    );
}
