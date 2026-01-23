import { LucideIcon, Users, FileCheck, ShieldAlert, Cpu } from 'lucide-react';

interface MetricCardProps {
    label: string;
    value: string | number;
    icon: LucideIcon;
    subValue?: string;
    variant?: 'default' | 'alert';
}

export function MetricCard({ label, value, icon: Icon, subValue, variant = 'default' }: MetricCardProps) {
    return (
        <div className="p-8 rounded-[2.5rem] border bg-muted/5 backdrop-blur-sm hover:border-primary/20 transition-all group">
            <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between">
                    <div className={`p-4 rounded-2xl group-hover:scale-110 transition-transform ${variant === 'alert' ? 'bg-primary text-primary-foreground' : 'bg-muted text-primary'}`}>
                        <Icon size={24} />
                    </div>
                    {subValue && (
                        <span className="text-[10px] font-black tracking-widest uppercase py-1 px-3 rounded-full bg-muted/50 text-muted-foreground border">
                            {subValue}
                        </span>
                    )}
                </div>
                <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-4xl font-black italic">{value}</p>
                </div>
            </div>
        </div>
    );
}

export function AdminMetricsGrid() {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <MetricCard
                label="Total Operators"
                value="42,105"
                icon={Users}
                subValue="+240 Today"
            />
            <MetricCard
                label="Exams Verified"
                value="12,504"
                icon={FileCheck}
                subValue="+1.2k Weekly"
            />
            <MetricCard
                label="Security Alerts"
                value="0"
                icon={ShieldAlert}
                subValue="Clean Trace"
            />
            <MetricCard
                label="System Load"
                value="4.2%"
                icon={Cpu}
                subValue="Optimized"
            />
        </div>
    );
}
