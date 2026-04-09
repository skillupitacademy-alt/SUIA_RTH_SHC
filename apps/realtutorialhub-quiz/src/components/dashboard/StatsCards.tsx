import { LucideIcon, TrendingUp, TrendingDown, Info } from "lucide-react";
import React from "react";

export type StatsOverview = {
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
    color: "primary" | "secondary" | "accent" | "success" | "warning" | "danger";
    tooltip?: string;
}

export const StatCard = React.memo(function StatCard({ title, value, icon: Icon, trend, color, tooltip }: StatCardProps) {
    const colorClasses = {
        primary: "text-pink-500 bg-pink-50",
        secondary: "text-blue-600 bg-blue-50",
        accent: "text-purple-600 bg-purple-50",
        success: "text-green-600 bg-green-50",
        warning: "text-yellow-600 bg-yellow-50",
        danger: "text-red-600 bg-red-50",
    };

    return (
        <div className="w-full max-w-full min-w-0 rounded-xl border-2 border-gray-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
            <div className="mb-4 flex min-w-0 items-center justify-between gap-3">
                <div className={`shrink-0 rounded-xl p-3 ${colorClasses[color]}`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <div className={`flex min-w-0 shrink items-center gap-1 text-right text-xs font-bold ${trend.positive ? "text-green-600" : "text-red-600"}`}>
                        {trend.positive ? <TrendingUp size={14} className="shrink-0" /> : <TrendingDown size={14} className="shrink-0" />}
                        <span className="truncate">{trend.value}</span>
                    </div>
                )}
            </div>
            <div className="min-w-0">
                <div className="group flex min-w-0 items-center gap-2">
                    <h3 className="truncate text-sm font-medium tracking-wider text-gray-600 uppercase">{title}</h3>
                    {tooltip && (
                        <div title={tooltip} className="shrink-0 cursor-help opacity-40 transition-opacity group-hover:opacity-100">
                            <Info size={14} />
                        </div>
                    )}
                </div>
                <p className="truncate text-3xl font-extrabold text-gray-900 mt-1">{value}</p>
            </div>
        </div>
    );
});

export function StatsGrid({ overview, deltaPct, healthStatus }: { overview?: StatsOverview; deltaPct?: number | null; healthStatus?: "green" | "yellow" | "red" }) {
    const globalRankValue = overview?.globalRank ?? "Pending";
    const globalRankTrend = overview?.globalRank
        ? { value: "Top 10%", positive: true }
        : undefined;

    const getScoreTrend = () => {
        if (deltaPct === undefined || deltaPct === null) return undefined;
        const isPos = deltaPct >= 0;
        return {
            value: `${isPos ? "+" : ""}${deltaPct} pp`,
            positive: isPos
        };
    };

    const getHealthColor = () => {
        switch (healthStatus) {
            case "green":
                return "success";
            case "yellow":
                return "warning";
            case "red":
                return "danger";
            default:
                return "secondary";
        }
    };

    return (
        <div className="w-full max-w-full overflow-x-hidden">
            <div className="grid w-full max-w-full min-w-0 grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
            </div>
            {overview?.globalRank === null && (
                <p className="mt-1 text-center text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                    Take 5 exams to see your global rank
                </p>
            )}
        </div>
    );
}