"use client";

import { useEffect, useState } from "react";
import { apiClient, ScoreHistoryResponse } from "@quiz/api-client";
import BaseChart from "./BaseChart";

interface ScoreHistoryChartProps {
    onDataFetched?: (data: ScoreHistoryResponse) => void;
}

export default function ScoreHistoryChart({ onDataFetched }: ScoreHistoryChartProps) {
    const [data, setData] = useState<ScoreHistoryResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await apiClient.analytics.getUserScoreHistory();
                setData(response);
                if (onDataFetched) onDataFetched(response);
            } catch (error) {
                console.error("Failed to fetch score history:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchData();
    }, [onDataFetched]);

    // Empty State
    if (!loading && (!data || data.dates.length === 0)) {
        return (
            <div className="h-[300px] w-full flex flex-col items-center justify-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400">
                <p>No quiz attempts yet.</p>
                <span className="text-sm">Complete a quiz to see your progress!</span>
            </div>
        );
    }

    const goalLine = 75;

    const option = {
        tooltip: {
            trigger: "axis",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderColor: "#E2E8F0",
            textStyle: { color: "#1E293B" },
            padding: [10, 15],
            extraCssText: "box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); border-radius: 8px;",
        },
        grid: {
            top: 30,
            right: 20,
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
            splitLine: { lineStyle: { type: "dashed", color: "#F1F5F9" } },
            axisLabel: { color: "#64748B", fontSize: 12 },
        },
        series: [
            {
                name: "Score",
                data: data?.scores || [],
                type: "line",
                smooth: true,
                showSymbol: false,
                symbol: "circle",
                symbolSize: 8,
                itemStyle: {
                    color: "#0EA5E9", // Sky-500
                    borderWidth: 2,
                    borderColor: "#ffffff",
                },
                lineStyle: {
                    width: 3,
                    color: "#0EA5E9",
                    shadowColor: "rgba(14, 165, 233, 0.3)",
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
                            { offset: 0, color: "rgba(14, 165, 233, 0.2)" },
                            { offset: 1, color: "rgba(14, 165, 233, 0)" },
                        ],
                    },
                },
                markLine: {
                    symbol: "none",
                    label: {
                        formatter: `Goal ${goalLine}%`,
                        color: "#475569",
                        fontWeight: 700,
                        backgroundColor: "rgba(226, 232, 240, 0.9)",
                        padding: [4, 8],
                        borderRadius: 8,
                    },
                    lineStyle: {
                        type: "dashed",
                        color: "#CBD5E1",
                        width: 2,
                    },
                    data: [{ yAxis: goalLine }],
                },
            },
        ],
    };

    return (
        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-800">Performance Trend</h3>
                <p className="text-sm text-slate-500">Your score history over the last 10 attempts.</p>
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
