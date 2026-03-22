"use client";

import { apiClient } from "@quiz/api-client";
import { Timer, Zap, Hourglass, HelpCircle } from "lucide-react";
import { useEffect, useState } from "react";
import type { EChartsOption } from "echarts";

import BaseChart from "./BaseChart";
import { clientLogger } from "@/utils/clientLogger";

export default function PersonalTimeBoxplot() {
    const [data, setData] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await apiClient.analytics.getUserTimeBoxplot();
                setData(res.data || []);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Failed to fetch timing data";
                setError(message);
                clientLogger.error("Failed to fetch timing data", { error: message });
                setData([]);
            } finally {
                setLoading(false);
            }
        }

        void fetchData();
    }, []);

    const isEmpty = !loading && data.length === 0;

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[300px] text-sm text-red-600 bg-red-50 rounded-2xl border border-red-100">
                <Timer className="w-8 h-8 mb-2 opacity-60 text-red-500" />
                <p className="font-semibold">Unable to load pacing data</p>
                <span className="text-xs text-red-500">{error}</span>
            </div>
        );
    }

    if (isEmpty) {
        return (
            <div className="flex flex-col items-center justify-center h-[300px] text-sm text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <Timer className="w-8 h-8 mb-2 opacity-20" />
                No timing data available yet
            </div>
        );
    }

    // [min, q1, median, q3, max]
    const [minVal, q1Val, medianVal, q3Val, maxVal] = data;

    const option = {
        tooltip: {
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderColor: "#E2E8F0",
            textStyle: { color: "#1E293B" },
            padding: [10, 15],
            extraCssText: "box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-radius: 12px;",
            formatter: () => {
                return `
          <div class="font-bold mb-2 text-slate-800 border-b border-slate-100 pb-1">Pacing Quartiles</div>
          <div class="space-y-1.5 text-xs">
            <div class="flex justify-between gap-8">
              <span class="text-slate-500 font-medium">Fastest (Min):</span>
              <span class="font-bold text-slate-700">${minVal}s</span>
            </div>
            <div class="flex justify-between gap-8">
              <span class="text-slate-500 font-medium">Lower 25% (Q1):</span>
              <span class="font-bold text-slate-700">${q1Val}s</span>
            </div>
            <div class="flex justify-between gap-8 bg-slate-50 p-1 rounded">
              <span class="text-slate-600 font-bold">Typical Pace (Median):</span>
              <span class="font-bold text-indigo-600">${medianVal}s</span>
            </div>
            <div class="flex justify-between gap-8">
              <span class="text-slate-500 font-medium">Upper 75% (Q3):</span>
              <span class="font-bold text-slate-700">${q3Val}s</span>
            </div>
            <div class="flex justify-between gap-8">
              <span class="text-slate-500 font-medium">Slowest (Max):</span>
              <span class="font-bold text-slate-700">${maxVal}s</span>
            </div>
          </div>
        `;
            },
        },
        grid: {
            top: 60,
            bottom: 60,
            left: 80,
            right: 40,
        },
        xAxis: {
            type: "category",
            data: ["Global Pacing"],
            axisLine: { lineStyle: { color: "#E2E8F0" } },
            axisTick: { show: false },
            axisLabel: { color: "#94A3B8", fontSize: 10, fontWeight: "bold", margin: 20 },
        },
        yAxis: {
            type: "value",
            name: "Seconds / Question",
            nameTextStyle: {
                color: "#64748B",
                fontSize: 10,
                fontWeight: "bold",
                padding: [0, 0, 20, 0],
            },
            splitLine: {
                lineStyle: { type: "dashed", color: "#F1F5F9" },
            },
            axisLabel: { color: "#94A3B8", fontSize: 10, fontWeight: "bold" },
            minInterval: 10,
            scale: true,
        },
        series: [
            {
                name: "Time per Question",
                type: "boxplot",
                data: [data],
                itemStyle: {
                    color: "#EEF2FF",
                    borderColor: "#6366F1",
                    borderWidth: 2,
                },
                emphasis: {
                    itemStyle: {
                        color: "#E0E7FF",
                        shadowBlur: 10,
                        shadowColor: "rgba(99, 102, 241, 0.2)",
                    },
                },
            },
        ],
    } as unknown as EChartsOption;

    // Interpretation logic
    const isGuessingIdx = medianVal < 5;
    const isOverthinkingIdx = q3Val > 60;
    const iqr = q3Val - q1Val;
    const isConsistent = iqr < 15;

    return (
        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col h-full">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Speed Profile</h3>
                    <p className="text-sm text-slate-500">Distribution of time spent per question</p>
                </div>
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Timer size={20} />
                </div>
            </div>

            <div className="flex-grow min-h-[300px]">
                <BaseChart option={option} loading={loading} height="100%" />
            </div>

            <div className="mt-6 pt-6 border-t border-slate-50 grid grid-cols-2 gap-4">
                <div className={`p-3 rounded-xl flex items-start gap-3 ${isGuessingIdx ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                    {isGuessingIdx ? (
                        <Zap size={16} className="text-amber-500 mt-0.5 shrink-0" />
                    ) : (
                        <Zap size={16} className="text-emerald-500 mt-0.5 shrink-0" />
                    )}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Pacing Insight</p>
                        <p className="text-xs font-bold text-slate-700 leading-tight">
                            {isGuessingIdx ? "Potential Guessing detected" : "Controlled Pacing observed"}
                        </p>
                    </div>
                </div>

                <div className={`p-3 rounded-xl flex items-start gap-3 ${isOverthinkingIdx ? 'bg-rose-50' : 'bg-indigo-50'}`}>
                    {isOverthinkingIdx ? (
                        <Hourglass size={16} className="text-rose-500 mt-0.5 shrink-0" />
                    ) : (
                        <HelpCircle size={16} className="text-indigo-500 mt-0.5 shrink-0" />
                    )}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-slate-400 mb-1">Focus Factor</p>
                        <p className="text-xs font-bold text-slate-700 leading-tight">
                            {isOverthinkingIdx ? "Overthinking risk" : isConsistent ? "Very consistent flow" : "Good time management"}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
