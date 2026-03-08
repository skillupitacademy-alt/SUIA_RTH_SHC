import { LucideIcon, TrendingUp, TrendingDown, Info } from 'lucide-react';
import React from 'react';

type StatsOverview = {
    avgScore: number;
    totalExams: number;
    masteryPoints: number;
    weeklyExamsCount: number;
    globalRank: number | null;
};

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: string;
        positive: boolean;
    };
    color: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger';
    tooltip?: string;
}

export const StatCard = React.memo(function StatCard({ title, value, icon: Icon, trend, color, tooltip }: StatCardProps) {
    // Executive Minimal: Clean, high-contrast icon backgrounds
    const colorClasses = {
        primary: "text-pink-500 bg-pink-50",
        secondary: "text-blue-600 bg-blue-50",
        accent: "text-purple-600 bg-purple-50",
        success: "text-green-600 bg-green-50",
        warning: "text-yellow-600 bg-yellow-50",
        danger: "text-red-600 bg-red-50",
    };

    return (
        <div className="p-6 rounded-xl border-2 border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${colorClasses[color]}`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-bold ${trend.positive ? "text-green-600" : "text-red-600"}`}>
                        {trend.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {trend.value}
                    </div>
                )}
            </div>
            <div>
                <div className="flex items-center gap-2 group">
                    <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wider">{title}</h3>
                    {tooltip && (
                        <div title={tooltip} className="cursor-help opacity-40 group-hover:opacity-100 transition-opacity">
                            <Info size={14} />
                        </div>
                    )}
                </div>
                <p className="text-3xl font-extrabold mt-1 text-gray-900">{value}</p>
            </div>
        </div>
    );
});

export function StatsGrid({ overview, deltaPct, healthStatus }: { overview?: StatsOverview; deltaPct?: number | null; healthStatus?: 'green' | 'yellow' | 'red' }) {
    const globalRankValue = overview?.globalRank ?? "Pending";
    const globalRankTrend = overview?.globalRank
        ? { value: "Top 10%", positive: true }
        : undefined;

    // Time Machine Delta Logic
    const getScoreTrend = () => {
        if (deltaPct === undefined || deltaPct === null) return undefined;
        const isPos = deltaPct >= 0;
        return {
            value: `${isPos ? '+' : ''}${deltaPct} pp`,
            positive: isPos
        };
    };

    const getHealthColor = () => {
        switch (healthStatus) {
            case 'green': return 'success';
            case 'yellow': return 'warning';
            case 'red': return 'danger';
            default: return 'secondary';
        }
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                title="Exams Taken"
                value={overview?.totalExams || "0"}
                icon={TrendingUp}
                trend={{ value: "+0%", positive: true }}
                color="primary"
            />
            <StatCard
                title="Avg Score"
                value={`${Math.round(overview?.avgScore || 0)}%`}
                icon={TrendingUp}
                trend={getScoreTrend()}
                color={getHealthColor()}
                tooltip={deltaPct !== undefined ? "vs previous 7 days" : "Average accuracy across all completed exams to date."}
            />
            <StatCard
                title="Mastery Points"
                value={overview?.masteryPoints || 0}
                icon={TrendingUp}
                color="accent"
                tooltip="Cumulative points earned across all domains and subjects."
            />
            <StatCard
                title="Global Rank"
                value={globalRankValue}
                icon={TrendingUp}
                trend={globalRankTrend}
                color="primary"
            />
            {overview?.globalRank === null && (
                <p className="col-span-full text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1 text-center">
                    Take 5 exams to see your global rank
                </p>
            )}
        </div>
    );
}
