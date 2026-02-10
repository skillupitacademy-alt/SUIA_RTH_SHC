'use client';

interface TrendSummaryCardsProps {
    summary: {
        avgScore: number;
        passRate: number;
        totalExams: number;
        bestSkill: { name: string; delta: number } | null;
        worstSkill: { name: string; delta: number } | null;
        currentStreak: number;
        deltaPct?: number | null;
        healthStatus?: 'green' | 'yellow' | 'red';
    };
}

export function TrendSummaryCards({ summary }: TrendSummaryCardsProps) {
    const getDeltaColor = (delta: number) => delta > 0 ? 'text-emerald-600' : delta < 0 ? 'text-rose-600' : 'text-slate-600';
    const getHealthColor = (status?: 'green' | 'yellow' | 'red') => {
        switch (status) {
            case 'green': return 'text-emerald-600';
            case 'yellow': return 'text-amber-500';
            case 'red': return 'text-rose-600';
            default: return 'text-slate-900';
        }
    };

    const cards = [
        {
            label: 'Average Score',
            value: `${summary.avgScore}%`,
            subtext: summary.deltaPct !== undefined && summary.deltaPct !== null
                ? `${summary.deltaPct > 0 ? '+' : ''}${summary.deltaPct}pp vs last period`
                : `${summary.totalExams} exams`,
            color: getHealthColor(summary.healthStatus),
            subtextColor: summary.deltaPct ? getDeltaColor(summary.deltaPct) : 'text-slate-500'
        },
        {
            label: 'Pass Rate',
            value: `${Math.round(summary.passRate * 100)}%`,
            subtext: `${summary.currentStreak} streak`,
            color: summary.passRate >= 0.7 ? 'text-emerald-600' : 'text-rose-600',
            subtextColor: 'text-slate-500'
        },
        {
            label: 'Best Skill',
            value: summary.bestSkill ? `+${summary.bestSkill.delta}%` : '—',
            subtext: summary.bestSkill?.name || 'No data',
            color: 'text-emerald-600',
            subtextColor: 'text-slate-500'
        },
        {
            label: 'Worst Skill',
            value: summary.worstSkill ? `${summary.worstSkill.delta}%` : '—',
            subtext: summary.worstSkill?.name || 'No data',
            color: 'text-rose-600',
            subtextColor: 'text-slate-500'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, idx) => (
                <div
                    key={idx}
                    className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm flex flex-col justify-between"
                >
                    <div className="text-sm font-bold text-slate-600 uppercase tracking-wide mb-2">
                        {card.label}
                    </div>
                    <div className={`text-3xl font-black ${card.color} mb-1`}>
                        {card.value}
                    </div>
                    <div className={`text-sm font-medium ${card.subtextColor}`}>
                        {card.subtext}
                    </div>
                </div>
            ))}
        </div>
    );
}
