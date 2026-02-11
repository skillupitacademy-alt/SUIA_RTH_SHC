'use client';

import { useEffect, useState } from 'react';
import { apiClient } from '@quiz/api-client';
import { Target, BarChart2, CalendarDays } from 'lucide-react';
import { EfficiencyQuadrant } from './EfficiencyQuadrant';
import { ZLoader } from '@quiz/ui';

type TimeRange = '7d' | '14d' | '28d';

export function PerformanceAnalyticsBoard() {
    const [perf, setPerf] = useState<any>(null);
    const [growth, setGrowth] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [range, setRange] = useState<TimeRange>('7d');

    useEffect(() => {
        const fetch = async () => {
            setIsLoading(true);
            try {
                const [perfData, growthData] = await Promise.all([
                    apiClient.admin.getPerformanceAnalytics(range),
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
    }, [range]);

    if (isLoading || !perf) {
        return (
            <div className="p-20 flex items-center justify-center">
                <ZLoader text="Analyzing Performance Data..." />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="p-8 rounded-[2rem] border border-primary/10 bg-muted/5 backdrop-blur-md shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div>
                        <h3 className="text-2xl font-outfit font-black tracking-tighter uppercase text-premium-gradient">Performance by Domain</h3>
                        <p className="text-sm font-inter font-bold text-slate-600 mt-1">Accuracy & Skill Mastery Breakdown</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex bg-white/50 p-1 rounded-xl border border-slate-200">
                            {(['7d', '14d', '28d'] as TimeRange[]).map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setRange(r)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${range === r
                                        ? 'bg-[#1A1A1A] text-white shadow-sm'
                                        : 'text-slate-500 hover:text-slate-900'
                                        }`}
                                >
                                    {r.toUpperCase()}
                                </button>
                            ))}
                        </div>
                        <div className="hidden md:flex px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-500 items-center gap-2.5">
                            <BarChart2 size={16} />
                            <span className="alpha-terminal tracking-wide text-blue-500">Live Accuracy</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {perf.domains.map((domain: any) => (
                        <div key={domain.id} className="p-6 rounded-[1.5rem] bg-white border border-slate-200 hover:border-blue-500/30 transition-all group shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                                <span className="alpha-terminal text-slate-600">{domain.name}</span>
                                <Target size={16} className="text-blue-500 opacity-40" />
                            </div>
                            <div className="flex items-end gap-3">
                                <p className="text-4xl font-outfit font-black tracking-tighter text-[#1A1A1A]">{domain.avgAccuracy}%</p>
                                {domain.delta !== undefined && domain.delta !== 0 && (
                                    <span className={`text-xs font-bold mb-1.5 px-2 py-0.5 rounded-full ${domain.delta > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                        {domain.delta > 0 ? '+' : ''}{domain.delta}%
                                    </span>
                                )}
                            </div>
                            <p className="text-xs font-inter font-bold text-slate-500 mt-2 uppercase tracking-wide">{domain.sampleSize} Exams</p>

                            <div className="mt-6 h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                <div
                                    className={`h-full rounded-full ${domain.avgAccuracy >= 70 ? 'bg-emerald-500' : domain.avgAccuracy >= 50 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                    style={{ width: `${domain.avgAccuracy}%` }}
                                />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Section 9: Difficulty & Trends */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12 pt-12 border-t border-slate-200/60">
                    <div>
                        <h4 className="alpha-terminal text-slate-500 mb-6 !tracking-wide">Accuracy by Difficulty</h4>
                        <div className="grid grid-cols-3 gap-4">
                            {perf.difficulty.map((d: any) => (
                                <div key={d.level} className="p-5 rounded-3xl bg-white border border-slate-200 text-center">
                                    <p className="alpha-terminal text-slate-600 mb-1 !tracking-wide">{d.level}</p>
                                    <p className="text-2xl font-outfit font-black text-[#1A1A1A]">{d.avgAccuracy}%</p>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="alpha-terminal text-slate-500 mb-6 !tracking-wide">Outcome Distribution</h4>
                        <div className="flex items-center gap-4">
                            <div className="flex-1 p-5 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 flex items-center justify-between">
                                <span className="alpha-terminal text-emerald-700 !tracking-wide">Passed</span>
                                <span className="text-2xl font-outfit font-black text-emerald-700">{perf.passFailTrends.pass}</span>
                            </div>
                            <div className="flex-1 p-5 rounded-3xl bg-rose-500/5 border border-rose-500/10 flex items-center justify-between">
                                <span className="alpha-terminal text-rose-700 !tracking-wide">Failed</span>
                                <span className="text-2xl font-outfit font-black text-rose-700">{perf.passFailTrends.fail}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <EfficiencyQuadrant data={perf.efficiency} loading={isLoading} />

            {/* Section 10: Growth Zones */}
            {growth.length > 0 && (
                <div className="p-8 rounded-[2rem] border border-amber-500/10 bg-amber-500/5 backdrop-blur-md shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-2xl font-outfit font-black tracking-tighter uppercase text-amber-700">Growth Zones</h3>
                            <p className="text-sm font-inter font-bold text-slate-600 mt-1">Derived Systemic Skill Gaps (Lowest Accuracy Topics)</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {growth.map((t) => (
                            <div key={t.id} className="p-6 rounded-[2rem] bg-white border border-amber-500/20 shadow-sm text-center">
                                <p className="alpha-terminal text-slate-600 mb-1 truncate !tracking-wide">{t.name}</p>
                                <p className="text-2xl font-outfit font-black text-rose-600">{t.accuracy}% Accuracy</p>
                                <p className="text-xs font-inter font-bold text-slate-400 mt-2 uppercase tracking-wide">{t.sampleSize} Results</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
