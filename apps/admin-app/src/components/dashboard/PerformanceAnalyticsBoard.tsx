'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@quiz/api-client';
import { BarChart3, Target } from 'lucide-react';
import { EfficiencyQuadrant } from './EfficiencyQuadrant';

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
                        <p className="text-sm font-bold text-slate-600 mt-1">Aggregated scoring & mastery levels across all domains</p>
                    </div>
                    <div className="px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 flex items-center gap-2.5">
                        <BarChart3 size={16} />
                        <span className="text-xs font-bold uppercase tracking-wide">Global Accuracy Tracking</span>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {perf.domains.map((domain: any) => (
                        <div key={domain.id} className="p-6 rounded-[1.5rem] bg-background border border-muted/50 hover:border-blue-500/30 transition-all group shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold uppercase tracking-wide text-slate-600">{domain.name}</span>
                                <Target size={16} className="text-blue-500 opacity-40" />
                            </div>
                            <div className="flex items-end gap-3">
                                <p className="text-3xl font-black tracking-tighter text-[#1A1A1A]">{domain.avgAccuracy}%</p>
                                {domain.delta !== undefined && domain.delta !== 0 && (
                                    <span className={`text-xs font-bold mb-1.5 px-2 py-0.5 rounded-full ${domain.delta > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {domain.delta > 0 ? '+' : ''}{domain.delta}%
                                    </span>
                                )}
                            </div>
                            <p className="text-xs font-medium text-slate-500 mt-2">{domain.sampleSize} Exams Analyzed</p>

                            <div className="mt-6 h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                <div
                                    className={`h-full ${domain.avgAccuracy >= 70 ? 'bg-green-500' : domain.avgAccuracy >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                    style={{ width: `${domain.avgAccuracy}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Section 9: Difficulty & Trends */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12 pt-12 border-t border-muted-foreground/10">
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-wide text-slate-500 mb-6">Accuracy by Difficulty</h4>
                        <div className="grid grid-cols-3 gap-4">
                            {perf.difficulty.map((d: any) => (
                                <div key={d.level} className="p-5 rounded-3xl bg-background border border-muted/50 text-center">
                                    <p className="text-xs font-bold text-slate-600 uppercase tracking-wide mb-1">{d.level}</p>
                                    <p className="text-2xl font-black text-[#1A1A1A]">{d.avgAccuracy}%</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-wide text-slate-500 mb-6">Outcome Distribution</h4>
                        <div className="flex items-center gap-8">
                            <div className="flex-1 p-5 rounded-3xl bg-green-500/5 border border-green-500/10 flex items-center justify-between">
                                <span className="text-xs font-bold text-green-700 uppercase tracking-wide">Passed (≥70%)</span>
                                <span className="text-xl font-black text-green-700">{perf.passFailTrends.pass}</span>
                            </div>
                            <div className="flex-1 p-5 rounded-3xl bg-red-500/5 border border-red-500/10 flex items-center justify-between">
                                <span className="text-xs font-bold text-red-700 uppercase tracking-wide">Failed</span>
                                <span className="text-xl font-black text-red-700">{perf.passFailTrends.fail}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <EfficiencyQuadrant data={perf.efficiency} loading={isLoading} />

            {/* Section 10: Growth Zones */}
            {growth.length > 0 && (
                <div className="p-8 rounded-[2rem] border border-yellow-500/10 bg-yellow-500/5 backdrop-blur-md shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter italic text-[#1A1A1A]">Growth Zones</h3>
                            <p className="text-sm font-bold text-slate-600 mt-1">Derived Systemic Skill Gaps (Lowest Accuracy Topics)</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {growth.map((t) => (
                            <div key={t.id} className="p-6 rounded-[2rem] bg-background border border-yellow-500/20 shadow-sm text-center">
                                <p className="text-xs font-bold uppercase tracking-wide text-slate-600 mb-1">{t.name}</p>
                                <p className="text-2xl font-black text-red-600">{t.accuracy}% Accuracy</p>
                                <p className="text-xs font-medium text-slate-500 mt-2">{t.sampleSize} Results</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
