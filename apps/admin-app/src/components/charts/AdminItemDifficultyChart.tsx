"use client";

import { apiClient, ItemDifficultyResponse } from "@quiz/api-client";
import { useEffect, useState } from "react";

import BaseChart from "./BaseChart";

export default function AdminItemDifficultyChart() {
    const [data, setData] = useState<ItemDifficultyResponse>({
        ids: [],
        accuracy: [],
        attempts: [],
    });
    const [loading, setLoading] = useState(true);
    const [forbidden, setForbidden] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await apiClient.analytics.getAdminItemDifficulty();
                setData(res);
            } catch (err: unknown) {
                console.error("Failed to load item difficulty", err);
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

    const isEmpty = !loading && data.ids.length === 0;

    if (isEmpty) {
        return (
            <div className="flex items-center justify-center h-[400px] text-sm text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No difficult items found (min 5 attempts).
            </div>
        );
    }

    // Truncate IDs for Y-axis visual
    const truncatedIds = data.ids.map(id => "..." + id.slice(-8));

    const option = {
        tooltip: {
            trigger: "item",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderColor: "#E2E8F0",
            textStyle: { color: "#1E293B" },
            padding: [10, 15],
            extraCssText: "box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-radius: 8px;",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter: (params: any) => {
                const index = params.dataIndex;
                const fullId = data.ids[index];
                const accuracy = data.accuracy[index];
                const attempts = data.attempts[index];

                return `
          <div class="font-bold mb-1 text-slate-800">Question ID</div>
          <div class="text-xs text-slate-500 mb-2 font-mono">${fullId}</div>
          <div class="flex items-center gap-4">
            <div>
              <div class="text-xs text-slate-500">Accuracy</div>
              <div class="font-bold text-red-500">${accuracy}%</div>
            </div>
            <div>
              <div class="text-xs text-slate-500">Attempts</div>
              <div class="font-bold text-slate-800">${attempts}</div>
            </div>
          </div>
        `;
            },
        },
        grid: {
            top: 30,
            right: 30,
            bottom: 20,
            left: 100, // Space for Y-axis labels
        },
        xAxis: {
            type: "value",
            max: 100,
            axisLabel: { color: "#64748B", fontSize: 11 },
            splitLine: { lineStyle: { type: "dashed", color: "#F1F5F9" } },
        },
        yAxis: {
            type: "category",
            data: truncatedIds,
            axisLabel: {
                color: "#64748B",
                fontSize: 11,
                fontFamily: "monospace"
            },
            axisLine: { show: false },
            axisTick: { show: false },
            inverse: true, // Show lowest accuracy (hardest) at top
        },
        series: [
            {
                name: "Difficulty",
                type: "bar",
                data: data.accuracy,
                barMaxWidth: 20,
                itemStyle: {
                    borderRadius: [0, 4, 4, 0],
                    color: {
                        type: "linear",
                        x: 0,
                        y: 0,
                        x2: 1,
                        y2: 0,
                        colorStops: [
                            { offset: 0, color: "#ef4444" }, // Red-500
                            { offset: 1, color: "#f59e0b" }, // Amber-500
                        ],
                    },
                },
            },
        ],
    };

    return (
        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Hardest Questions</h3>
                    <p className="text-sm text-slate-500">Items with lowest accuracy (min 5 attempts)</p>
                </div>
                <div className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold uppercase tracking-wider">
                    Audit Required
                </div>
            </div>
            <BaseChart option={option} height={400} loading={loading} />
        </div>
    );
}
