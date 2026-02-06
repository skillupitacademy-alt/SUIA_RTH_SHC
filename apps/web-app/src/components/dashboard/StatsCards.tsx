import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: string;
        positive: boolean;
    };
    color: 'primary' | 'secondary' | 'accent';
}

export function StatCard({ title, value, icon: Icon, trend, color }: StatCardProps) {
    // Executive Minimal: Clean, high-contrast icon backgrounds
    const colorClasses = {
        primary: "text-pink-500 bg-pink-50",
        secondary: "text-blue-600 bg-blue-50",
        accent: "text-purple-600 bg-purple-50",
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
                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wider">{title}</h3>
                <p className="text-3xl font-extrabold mt-1 text-gray-900">{value}</p>
            </div>
        </div>
    );
}

export function StatsGrid({ overview }: { overview?: any }) {
    const globalRankValue = overview?.globalRank ?? "Pending";
    const globalRankTrend = overview?.globalRank
        ? { value: "Top 10%", positive: true }
        : undefined;

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
                trend={{ value: "+0%", positive: true }}
                color="secondary"
            />
            <StatCard
                title="Mastery Points"
                value={overview?.masteryPoints || 0}
                icon={TrendingUp}
                color="accent"
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
