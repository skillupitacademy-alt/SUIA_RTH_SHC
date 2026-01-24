import { AdminMetricsGrid } from "@/components/dashboard/AdminStats";
import { ContentManager } from "@/components/content/ContentManager";
import { AdminShell } from "@/components/layout/AdminShell";
import { ArrowUpRight, Zap, Target } from "lucide-react";

export default function AdminDashboard() {
    return (
        <AdminShell>
            <div className="space-y-12 pb-24">
                {/* Welcome Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b-2 border-primary/5">
                    <div>
                        <h1 className="text-5xl font-black tracking-tighter italic uppercase">Admin Terminal</h1>
                        <p className="text-muted-foreground font-bold tracking-tight mt-2">Observing platform-wide intelligence and governance.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Uptime Session</p>
                            <p className="font-mono text-lg font-bold">12:42:05</p>
                        </div>
                        <button className="px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-black shadow-xl shadow-primary/20 flex items-center gap-2 hover:scale-105 transition-transform active:scale-95">
                            <Zap size={18} className="fill-current" />
                            Quick Deploy
                        </button>
                    </div>
                </div>

                <AdminMetricsGrid />

                <div className="grid lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <ContentManager />
                    </div>
                    <div className="space-y-6">
                        <div className="p-8 rounded-[3rem] bg-gradient-to-br from-primary/10 to-transparent border border-primary/20">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-black uppercase tracking-tighter italic">Risk Intel</h3>
                                <Target className="text-primary" size={24} />
                            </div>
                            <div className="space-y-4">
                                {[
                                    { label: 'Latency Spike', val: '200ms', trend: '+12%' },
                                    { label: 'Token Expiry', val: 'Low', trend: 'OK' },
                                    { label: 'Node Status', val: 'Stable', trend: '100%' },
                                ].map(stat => (
                                    <div key={stat.label} className="flex items-center justify-between p-4 rounded-2xl bg-background/40 border border-primary/5">
                                        <span className="text-xs font-black uppercase text-muted-foreground">{stat.label}</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm tracking-tight">{stat.val}</span>
                                            <span className="text-[10px] font-black text-green-500">{stat.trend}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button className="w-full mt-6 py-4 rounded-2xl border-2 border-primary/20 font-black text-xs uppercase tracking-widest hover:bg-primary hover:text-primary-foreground transition-all">
                                Full Security Audit
                            </button>
                        </div>

                        <div className="p-8 rounded-[3rem] border border-muted-foreground/10 bg-muted/5">
                            <h3 className="text-xl font-black uppercase tracking-tighter italic mb-4">Operations</h3>
                            <div className="space-y-3">
                                <button className="w-full p-4 rounded-2xl bg-background border hover:border-primary transition-all text-left flex items-center justify-between group">
                                    <span className="font-bold text-sm">Backup Core DB</span>
                                    <ArrowUpRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                </button>
                                <button className="w-full p-4 rounded-2xl bg-background border hover:border-primary transition-all text-left flex items-center justify-between group">
                                    <span className="font-bold text-sm">Flush Edge Cache</span>
                                    <ArrowUpRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                </button>
                                <button className="w-full p-4 rounded-2xl bg-background border hover:border-primary transition-all text-left flex items-center justify-between group">
                                    <span className="font-bold text-sm">Rotate API Keys</span>
                                    <ArrowUpRight size={16} className="text-muted-foreground group-hover:text-primary transition-colors" />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminShell>
    );
}
