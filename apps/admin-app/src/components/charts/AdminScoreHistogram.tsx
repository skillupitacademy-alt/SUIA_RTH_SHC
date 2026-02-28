"use client";

import { apiClient, ScoreHistogramResponse } from "@quiz/api-client";
import type { EChartsOption } from "echarts";
import { useEffect, useState } from "react";

import { clientLogger } from "@/utils/clientLogger";

import BaseChart from "./BaseChart";

type HistogramFormatterParams = { name: string; value: number };

export default function AdminScoreHistogram() {
    const [data, setData] = useState<ScoreHistogramResponse>({
        bins: [],
        counts: [],
    });
    const [loading, setLoading] = useState(true);
    const [forbidden, setForbidden] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await apiClient.analytics.getAdminScoreHistogram();
                setData(res);
            } catch (err: unknown) {
                clientLogger.error("Failed to load score histogram", { error: err instanceof Error ? err.message : 'unknown' });
                setForbidden(true);
            } finally {
                setLoading(false);
            }
        }

        void fetchData();
    }, []);

    if (forbidden) {
        return (
            <div className="flex items-center justify-center h-[400px] text-sm text-red-500 bg-red-50 rounded-xl border border-red-100">
                Admin Access Required
            </div>
        );
    }

    const isEmpty = !loading && data.bins.length === 0;

    if (isEmpty) {
        return (
            <div className="flex items-center justify-center h-[400px] text-sm text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No score data available yet.
            </div>
        );
    }

    // Calculate mean score for marker
    const totalStudents = data.counts.reduce((a, b) => a + b, 0);
    const weightedSum = data.counts.reduce(
        (sum, count, i) => sum + count * (i * 10 + 5),
        0
    );
    const meanScore = totalStudents ? weightedSum / totalStudents : 0;

    const option: EChartsOption = {
        tooltip: {
            trigger: "axis" as const,
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderColor: "#E2E8F0",
            textStyle: { color: "#1E293B" },
            padding: [10, 15],
            extraCssText: "box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-radius: 8px;",
            formatter: (params: HistogramFormatterParams[]) => {
                const p = params[0];
                return `
          <div class="font-bold mb-1 text-slate-800">Score Range: ${p.name}</div>
          <div class="flex items-center justify-between gap-4">
            <span class="text-xs text-slate-500">Students:</span>
            <span class="font-bold text-sky-600">${p.value}</span>
          </div>
        `;
            },
        },
        grid: {
            top: 40,
            right: 40,
            bottom: 40,
            left: 50,
        },
        xAxis: {
            type: "category" as const,
            data: data.bins.map((_, i) => `${i * 10}-${(i + 1) * 10}`),
            axisLabel: { color: "#64748B", fontSize: 11 },
            axisLine: { lineStyle: { color: "#E2E8F0" } },
        },
        yAxis: {
            type: "value" as const,
            name: "Students",
            nameTextStyle: { color: "#64748B", fontSize: 11, padding: [0, 0, 10, 0] },
            axisLabel: { color: "#64748B", fontSize: 11 },
            splitLine: { lineStyle: { type: "dashed", color: "#F1F5F9" } },
        },
        series: [
            {
                name: "Student Count",
                type: "bar",
                data: data.counts,
                barMaxWidth: 40,
                itemStyle: {
                    color: "#0ea5e9", // sky-500
                    borderRadius: [4, 4, 0, 0],
                },
                markLine: {
                    symbol: ["none", "none"],
                    data: [
                        {
                            xAxis: meanScore / 10,
                            name: "Mean",
                            lineStyle: { color: "#8b5cf6", type: "solid", width: 2 }, // purple-500
                            label: {
                                show: true,
                                formatter: `Mean: ${meanScore.toFixed(1)}`,
                                position: "end",
                                backgroundColor: "#8b5cf6",
                                color: "#fff",
                                padding: [2, 5],
                                borderRadius: 4,
                            },
                        },
                        {
                            xAxis: 4, // 40% Pass threshold
                            name: "Pass Threshold",
                            lineStyle: { color: "#22c55e", type: "dashed", width: 2 }, // green-500
                            label: {
                                show: true,
                                formatter: "Pass (40%)",
                                position: "end",
                                backgroundColor: "#22c55e",
                                color: "#fff",
                                padding: [2, 5],
                                borderRadius: 4,
                            },
                        },
                    ],
                },
            },
        ],
    } as unknown as EChartsOption;

    return (
        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Score Distribution</h3>
                    <p className="text-sm text-slate-500">Student performance across score buckets</p>
                </div>
                <div className="px-3 py-1 bg-sky-50 text-sky-600 rounded-full text-xs font-bold uppercase tracking-wider">
                    Global Data
                </div>
            </div>
            <BaseChart option={option} height={400} loading={loading} />
        </div>
    );
}
