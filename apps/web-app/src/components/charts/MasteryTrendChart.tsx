"use client";

import { useEffect, useState } from "react";
import { apiClient, MasteryTrendResponse } from "@quiz/api-client";
import BaseChart from "./BaseChart";

interface MasteryTrendChartProps {
    onDataFetched?: (data: MasteryTrendResponse) => void;
}

export default function MasteryTrendChart({ onDataFetched }: MasteryTrendChartProps) {
    const [data, setData] = useState<MasteryTrendResponse | null>(null);
    const [loading, setLoading] = useState(true);

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
            },
        ],
    };

    return (
        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-800">Mastery Trend</h3>
                <p className="text-sm text-slate-500">Your average accuracy over time.</p>
            </div>
            <BaseChart option={option} height={300} loading={loading} />
        </div>
    );
}
