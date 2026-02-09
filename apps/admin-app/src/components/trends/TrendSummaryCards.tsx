'use client';

interface TrendSummaryCardsProps {
    summary: {
        avgScore: number;
        passRate: number;
        totalExams: number;
        bestSkill: { name: string; delta: number } | null;
        worstSkill: { name: string; delta: number } | null;
        currentStreak: number;
    };
}

export function TrendSummaryCards({ summary }: TrendSummaryCardsProps) {
    const cards = [
        {
            label: 'Average Score',
            value: `${summary.avgScore}%`,
            subtext: `${summary.totalExams} exams`,
            color: summary.avgScore >= 70 ? 'text-green-600' : 'text-red-600'
        },
        {
            label: 'Pass Rate',
            value: `${Math.round(summary.passRate * 100)}%`,
            subtext: `${summary.currentStreak} streak`,
            color: summary.passRate >= 0.7 ? 'text-green-600' : 'text-red-600'
        },
        {
            label: 'Best Skill',
            value: summary.bestSkill ? `+${summary.bestSkill.delta}%` : '—',
            subtext: summary.bestSkill?.name || 'No data',
            color: 'text-green-600'
        },
        {
            label: 'Worst Skill',
            value: summary.worstSkill ? `${summary.worstSkill.delta}%` : '—',
            subtext: summary.worstSkill?.name || 'No data',
            color: 'text-red-600'
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, idx) => (
                <div
                    key={idx}
                    className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm"
                >
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        {card.label}
                    </div>
                    <div className={`text-3xl font-bold ${card.color} mb-1`}>
                        {card.value}
                    </div>
                    <div className="text-sm text-slate-600">{card.subtext}</div>
                </div>
            ))}
        </div>
    );
}
