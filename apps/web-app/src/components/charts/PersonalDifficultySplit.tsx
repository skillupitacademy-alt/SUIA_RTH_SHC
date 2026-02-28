"use client";

import { apiClient, DifficultyAccuracyResponse } from "@quiz/api-client";
import { BarChart3, TrendingUp, ShieldCheck, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { EChartsOption } from "echarts";

import BaseChart from "./BaseChart";
import { clientLogger } from "@/utils/clientLogger";

export default function PersonalDifficultySplit() {
    const [data, setData] = useState<DifficultyAccuracyResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await apiClient.analytics.getUserDifficultyAccuracy();
                setData(res);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Failed to fetch difficulty accuracy";
                setError(message);
                clientLogger.error("Failed to fetch difficulty accuracy", { error: message });
            } finally {
                setLoading(false);
            }
        }

        void fetchData();
    }, []);

    const isEmpty = !loading && (!data || data.accuracy.every(v => v === 0));

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[350px] text-sm text-red-600 bg-red-50 rounded-2xl border border-red-100">
                <BarChart3 className="w-8 h-8 mb-2 opacity-50 text-red-500" />
                <p className="font-semibold">Unable to load difficulty accuracy</p>
                <span className="text-xs text-red-500">{error}</span>
            </div>
        );
    }

    if (isEmpty) {
        return (
            <div className="flex flex-col items-center justify-center h-[350px] text-sm text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <BarChart3 className="w-8 h-8 mb-2 opacity-20" />
                No difficulty data available yet
            </div>
        );
    }

    const labels = data?.labels || ["simple", "intermediate", "expert"];
    const accuracy = data?.accuracy || [0, 0, 0];

    // Promotion readiness logic
    // Ready for next if accuracy > 75%
    const readiness = {
        simple: accuracy[0] > 75,
        intermediate: accuracy[1] > 70,
        expert: accuracy[2] > 65
    };

    const option = {
        tooltip: {
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderColor: "#E2E8F0",
            textStyle: { color: "#1E293B" },
            padding: [10, 15],
            extraCssText: "box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-radius: 12px;",
            formatter: (params: { value: number; name: string }) => {
                const val = params.value;
                const label = params.name;
                const isReady = (label === 'simple' && val > 75) || (label === 'intermediate' && val > 70) || (label === 'expert' && val > 65);

                return `
                    <div class="font-bold mb-1 text-slate-800 uppercase tracking-widest text-[10px]">${label} Mastery</div>
                    <div class="flex items-center gap-3">
                        <span class="text-2xl font-black text-indigo-600">${val}%</span>
                        <div class="text-[10px] ${isReady ? 'text-emerald-500' : 'text-slate-400'} font-bold">
                            ${isReady ? 'Ready for Promotion' : 'Needs Practice'}
                        </div>
                    </div>
                `;
            }
        },
        grid: {
            top: 40,
            bottom: 60,
            left: 60,
            right: 40,
            containLabel: true
        },
        xAxis: {
            type: 'category' as const,
            data: labels,
            axisLine: { lineStyle: { color: "#E2E8F0" } },
            axisTick: { show: false },
            axisLabel: {
                color: '#94A3B8',
                fontWeight: 'bold',
                fontSize: 10,
                margin: 15,
                formatter: (v: string) => v.toUpperCase()
            }
        },
        yAxis: {
            type: 'value' as const,
            max: 100,
            minInterval: 20,
            splitLine: {
                lineStyle: { type: 'dashed', color: '#F1F5F9' }
            },
            axisLabel: { color: '#94A3B8', fontSize: 10, fontWeight: 'bold' as const }
        },
        series: [
            {
                data: accuracy,
                type: 'bar' as const,
                barWidth: '35%',
                itemStyle: {
                    borderRadius: [4, 4, 0, 0],
                    color: (params: { value: number }) => {
                        const val = params.value;
                        if (val > 75) return "#10b981"; // Emerald
                        if (val > 50) return "#6366f1"; // Indigo
                        return "#f59e0b"; // Amber
                    }
                },
                showBackground: true,
                backgroundStyle: {
                    color: 'rgba(241, 245, 249, 0.5)',
                    borderRadius: [4, 4, 0, 0]
                }
            }
        ]
    } as unknown as EChartsOption;

    return (
        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Difficulty Accuracy</h3>
                    <p className="text-sm text-slate-500">Your performance across complexity levels</p>
                </div>
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                    <TrendingUp size={20} />
                </div>
            </div>

            <div className="flex-grow min-h-[300px]">
                <BaseChart option={option} loading={loading} height="100%" />
            </div>

            <div className="mt-6 pt-6 border-t border-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldCheck size={14} className={readiness.intermediate ? "text-emerald-500" : "text-slate-300"} />
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-tight">Adaptive Progression</span>
                    </div>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${readiness.intermediate ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {readiness.intermediate ? "Promoted" : "Evolving"}
                    </span>
                </div>

                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                    <AlertCircle size={16} className="text-indigo-500 mt-0.5" />
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                        {readiness.expert
                            ? "You've mastered all levels. Focus on speed and edge-case skills."
                            : readiness.intermediate
                                ? "Strong intermediate skills. We'll prioritize expert questions now."
                                : "Building baseline competency. Focus on 'Intermediate' topics to level up."
                        }
                    </p>
                </div>
            </div>
        </div>
    );
}
