"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient, MasteryTrendResponse } from "@quiz/api-client";
import BaseChart from "./BaseChart";

interface MasteryTrendChartProps {
    onDataFetched?: (data: MasteryTrendResponse) => void;
}

export default function MasteryTrendChart({ onDataFetched }: MasteryTrendChartProps) {
    const [data, setData] = useState<MasteryTrendResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [goal, setGoal] = useState<number>(80);

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await apiClient.analytics.getUserMasteryTrend();
                setData(response);
                if (onDataFetched) onDataFetched(response);
            } catch (error) {
                console.error("Failed to fetch mastery trend:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [onDataFetched]);

    useEffect(() => {
        const stored = typeof window !== "undefined" ? window.localStorage.getItem("masteryGoal") : null;
        if (stored) setGoal(Number(stored));
    }, []);

    const handleGoalChange = (value: number) => {
        const safe = Math.min(100, Math.max(0, value));
        setGoal(safe);
        if (typeof window !== "undefined") {
            window.localStorage.setItem("masteryGoal", String(safe));
        }
    };

    const { streakLabel, idleLabel } = useMemo(() => {
        if (!data || data.dates.length === 0) return { streakLabel: "No data yet", idleLabel: "" };
        const acc = data.accuracy;
        let streak = 1;
        for (let i = acc.length - 1; i > 0; i -= 1) {
            if (acc[i] >= acc[i - 1]) streak += 1;
            else break;
        }
        const lastDate = new Date(data.dates[data.dates.length - 1]);
        const today = new Date();
        const idleDays = Math.max(0, Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)));
        return {
            streakLabel: streak > 1 ? `Upward streak: ${streak} days` : "No upward streak yet",
            idleLabel: idleDays > 0 ? `Idle: ${idleDays} day${idleDays > 1 ? "s" : ""}` : "Active today",
        };
    }, [data]);

    if (!loading && (!data || data.dates.length === 0)) {
        return (
            <div className="h-[300px] w-full flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                <p>No mastery data yet.</p>
                <span className="text-sm">Complete more exams to see your trend!</span>
            </div>
        );
    }

    const option = {
        tooltip: {
            trigger: "axis",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderColor: "#E2E8F0",
            textStyle: { color: "#1E293B" },
            padding: [10, 15],
            extraCssText: "box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border-radius: 8px;",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter: (params: any) => {
                const date = params[0].axisValue;
                const accuracy = params[0].data;
                return `
          <div class="font-bold mb-1">${date}</div>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span class="text-slate-600">Accuracy:</span>
            <span class="font-bold text-slate-900">${accuracy}%</span>
          </div>
        `;
            }
        },
        grid: {
            top: 30,
            right: 48, // extra space for goal label
            bottom: 20,
            left: 20,
            containLabel: true,
        },
        xAxis: {
            type: "category",
            data: data?.dates || [],
            boundaryGap: false,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: "#64748B", fontSize: 12, margin: 12 },
        },
        yAxis: {
            type: "value",
            max: 100,
            splitLine: { lineStyle: { type: "dashed", color: "#F1F5F9" } },
            axisLabel: { color: "#64748B", fontSize: 12 },
        },
        series: [
            {
                name: "Accuracy",
                data: data?.accuracy || [],
                type: "line",
                smooth: true,
                showSymbol: false,
                symbol: "circle",
                symbolSize: 8,
                itemStyle: {
                    color: "#10B981", // Emerald-500
                    borderWidth: 2,
                    borderColor: "#ffffff",
                },
                lineStyle: {
                    width: 3,
                    color: "#10B981",
                    shadowColor: "rgba(16, 185, 129, 0.3)",
                    shadowBlur: 10,
                },
                areaStyle: {
                    color: {
                        type: "linear",
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: "rgba(16, 185, 129, 0.2)" },
                            { offset: 1, color: "rgba(16, 185, 129, 0)" },
                        ],
                    },
                },
                markLine: {
                    symbol: "none",
                    label: {
                        formatter: `Goal ${goal}%`,
                        color: "#475569",
                        fontWeight: 700,
                        backgroundColor: "rgba(226, 232, 240, 0.9)",
                        padding: [4, 8],
                        borderRadius: 8,
                        position: "insideEndTop",
                        distance: 6,
                    },
                    lineStyle: {
                        type: "dashed",
                        color: "#CBD5E1",
                        width: 2,
                    },
                    data: [{ yAxis: goal }],
                },
            },
        ],
    };

    return (
        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Mastery Trend</h3>
                    <p className="text-sm text-slate-500">Your average accuracy over time.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">{streakLabel}</div>
                    <div className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-bold text-slate-600">{idleLabel}</div>
                    <div className="flex items-center gap-2 text-[11px] font-bold text-slate-600">
                        <span>Goal</span>
                        <input
                            type="number"
                            min={0}
                            max={100}
                            value={goal}
                            onChange={(e) => handleGoalChange(Number(e.target.value))}
                            className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-right text-[11px] focus:outline-none focus:ring-2 focus:ring-emerald-300"
                        />
                        <span>%</span>
                    </div>
                </div>
            </div>
            <BaseChart option={option} height={300} loading={loading} />
            {data?.insight?.dataNotes && data.insight.dataNotes.length > 0 && (
                <div className="mt-4 bg-slate-50/70 border border-slate-100 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-slate-500">Data Notes</span>
                        <span className="text-[10px] font-bold text-slate-400">Personalized context</span>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {data.insight.dataNotes.map((note, idx) => (
                            <div key={idx} className="rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">{note.label}</p>
                                <p className="text-[11px] font-semibold text-slate-700 leading-snug">{note.value}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
