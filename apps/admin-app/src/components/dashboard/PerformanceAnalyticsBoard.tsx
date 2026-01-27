'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@quiz/api-client';
import { BarChart3, Target } from 'lucide-react';

export function PerformanceAnalyticsBoard() {
    const [perf, setPerf] = useState<any>(null);
    const [growth, setGrowth] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const [perfData, growthData] = await Promise.all([
                    apiClient.admin.getPerformanceAnalytics(),
                    apiClient.admin.getGrowthMetrics()
                ]);
                setPerf(perfData);
                setGrowth(growthData);
            } catch (err) {
                console.error("Failed to fetch performance analytics", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetch();
    }, []);

    if (isLoading || !perf) return null;

    return (
        <div className="space-y-8">
            <div className="p-8 rounded-[2rem] border border-primary/10 bg-muted/5 backdrop-blur-md shadow-sm">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h3 className="text-2xl font-black uppercase tracking-tighter italic text-[#1A1A1A]">Performance Insights</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Aggregated Scoring & Mastery levels</p>
                    </div>
                    <div className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center gap-2.5">
                        <BarChart3 size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Global Accuracy Tracking</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {perf.domains.map((domain: any) => (
                        <div key={domain.id} className="p-6 rounded-[1.5rem] bg-background border border-muted/50 hover:border-blue-500/30 transition-all group shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{domain.name}</span>
                                <Target size={16} className="text-blue-500 opacity-40" />
                            </div>
                            <p className="text-3xl font-black tracking-tighter text-[#1A1A1A]">{domain.avgAccuracy}%</p>
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1.5">{domain.sampleSize} Exams Analyzed</p>

                            <div className="mt-6 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500"
                                    style={{ width: `${domain.avgAccuracy}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Section 9: Difficulty & Trends */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12 pt-12 border-t border-muted-foreground/10">
                    <div>
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-6">Accuracy by Difficulty</h4>
                        <div className="grid grid-cols-3 gap-4">
                            {perf.difficulty.map((d: any) => (
                                <div key={d.level} className="p-5 rounded-3xl bg-background border border-muted/50 text-center">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{d.level}</p>
                                    <p className="text-2xl font-black text-[#1A1A1A]">{d.avgAccuracy}%</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-6">Outcome Distribution</h4>
                        <div className="flex items-center gap-8">
                            <div className="flex-1 p-5 rounded-3xl bg-green-500/5 border border-green-500/10 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-green-600 uppercase tracking-widest">Passed (≥70%)</span>
                                <span className="text-xl font-black text-green-600">{perf.passFailTrends.pass}</span>
                            </div>
                            <div className="flex-1 p-5 rounded-3xl bg-red-500/5 border border-red-500/10 flex items-center justify-between">
                                <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Failed</span>
                                <span className="text-xl font-black text-red-600">{perf.passFailTrends.fail}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Section 10: Growth Zones */}
            {growth.length > 0 && (
                <div className="p-8 rounded-[2rem] border border-yellow-500/10 bg-yellow-500/5 backdrop-blur-md shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter italic text-[#1A1A1A]">Growth Zones</h3>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-0.5">Derived Systemic Skill Gaps (Lowest Accuracy Topics)</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {growth.map((t) => (
                            <div key={t.id} className="p-6 rounded-[2rem] bg-background border border-yellow-500/20 shadow-sm text-center">
                                <p className="text-[11px] font-black uppercase tracking-widest text-muted-foreground mb-1">{t.name}</p>
                                <p className="text-2xl font-black text-red-500">{t.accuracy}% Accuracy</p>
                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-2">{t.sampleSize} Results</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
