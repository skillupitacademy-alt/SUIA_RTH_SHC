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
    const colorClasses = {
        primary: "text-primary bg-primary/10",
        secondary: "text-secondary bg-secondary/10",
        accent: "text-accent bg-accent/10",
    };

    return (
        <div className="p-6 rounded-3xl border bg-background shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl ${colorClasses[color]}`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-bold ${trend.positive ? "text-green-500" : "text-red-500"}`}>
                        {trend.positive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                        {trend.value}
                    </div>
                )}
            </div>
            <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{title}</h3>
                <p className="text-3xl font-extrabold mt-1">{value}</p>
            </div>
        </div>
    );
}

export function StatsGrid({ overview }: { overview?: any }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                value={(overview?.totalExams || 0) * 50} // Mock calculation for now
                icon={TrendingUp}
                color="accent"
            />
            <StatCard
                title="Global Rank"
                value="#-"
                icon={TrendingUp}
                trend={{ value: "0", positive: false }}
                color="primary"
            />
        </div>
    );
}
