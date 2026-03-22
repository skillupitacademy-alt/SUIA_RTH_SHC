"use client";

import { apiClient, WeaknessTreeNode } from "@quiz/api-client";
import type { EChartsOption } from "echarts";
import { useEffect, useState } from "react";

import BaseChart from "./BaseChart";
import { clientLogger } from "@/utils/clientLogger";

type TreemapFormatterParams = {
    name: string;
    value?: number;
};

export default function WeaknessTreeChart() {
    const [data, setData] = useState<WeaknessTreeNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await apiClient.analytics.getUserWeaknessTree();
                setData(res);
            } catch (err: unknown) {
                const message = err instanceof Error ? err.message : "Failed to load weakness tree";
                clientLogger.error("Failed to load weakness tree", { error: message });
                setError(message);
            } finally {
                setLoading(false);
            }
        }

        void fetchData();
    }, []);

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] text-sm text-red-600 bg-red-50 rounded-xl border border-red-100">
                <p className="font-semibold">Unable to load weakness analysis</p>
                <span className="text-xs text-red-500">{error}</span>
            </div>
        );
    }

    const isEmpty = !loading && data.length === 0;

    if (isEmpty) {
        return (
            <div className="flex items-center justify-center h-[400px] text-sm text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                Complete more quizzes to see your weakness analysis
            </div>
        );
    }

    const option: EChartsOption = {
        tooltip: {
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderColor: "#E2E8F0",
            textStyle: { color: "#1E293B" },
            padding: [10, 15],
            extraCssText: "box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-radius: 8px;",
            formatter: (info: TreemapFormatterParams) => {
                const value = info.value as number;
                if (value === undefined || value === null || isNaN(value)) {
                    return `<div class="font-bold text-slate-800">${info.name}</div>
                            <div class="text-xs text-slate-500">Category</div>`;
                }

                const accuracy = 100 - value;
                const label = accuracy < 40 ? "Needs Focus 🔴" : accuracy < 70 ? "Developing 🟡" : "Strong 🟢";
                const color = accuracy < 40 ? "#ef4444" : accuracy < 70 ? "#f59e0b" : "#22c55e";

                return `
          <div class="font-bold mb-1 text-slate-800">${info.name}</div>
          <div class="flex items-center gap-2 mb-1">
            <div class="text-xs text-slate-500">Accuracy:</div>
            <div class="font-bold" style="color:${color}">${accuracy}%</div>
          </div>
          <div class="flex items-center gap-2 mb-1">
          <div class="text-xs text-slate-500">Weakness:</div>
          <div class="font-bold text-slate-700">${value}</div>
        </div>
          <div class="text-xs mt-1 px-2 py-0.5 rounded-full inline-block" style="background:${color}20; color:${color}">${label}</div>
        `;
            },
        },
        series: [
            {
                type: "treemap" as const,
                data: data,
                roam: false,
                nodeClick: "zoomToNode",
                leafDepth: 1,
                label: {
                    show: true,
                    formatter: "{b}",
                    fontSize: 12,
                    fontWeight: "black",
                    color: "#fff"
                },
                upperLabel: {
                    show: true,
                    height: 35,
                    color: "#fff",
                    fontWeight: "black",
                    fontSize: 14,
                    textBorderColor: "rgba(0,0,0,0.1)",
                    textBorderWidth: 2
                },
                itemStyle: {
                    borderColor: "#fff",
                    borderWidth: 2,
                    gapWidth: 1
                },
                levels: [
                    {
                        itemStyle: {
                            borderColor: "#334155",
                            borderWidth: 4,
                            gapWidth: 4
                        },
                        upperLabel: { show: true }
                    },
                    {
                        itemStyle: {
                            borderColor: "#64748B",
                            borderWidth: 2,
                            gapWidth: 2
                        }
                    },
                    {
                        colorMappingBy: "value",
                        itemStyle: {
                            gapWidth: 1
                        },
                        label: {
                            show: true,
                            color: "#fff",
                            fontWeight: "bold",
                            fontSize: 10,
                            formatter: (params: TreemapFormatterParams) => {
                                const val = params.value as number;
                                return `${params.name}\n${100 - val}%`;
                            },
                        },
                    }
                ],
                visualMin: 0,
                visualMax: 100,
                visualDimension: 0,
                color: ["#22c55e", "#84cc16", "#eab308", "#f59e0b", "#ef4444"],
                colorMappingBy: "value",
            },
        ],
    } as unknown as EChartsOption;

    return (
        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100 h-full flex flex-col">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Weakness Analysis</h3>
                    <p className="text-sm text-slate-500">Domain → Topic → Skill — click to drill down</p>
                </div>
                <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold uppercase tracking-wider">
                    Adaptive
                </div>
            </div>
            <div className="flex-grow min-h-[450px]">
                <BaseChart option={option} loading={loading} height="100%" />
            </div>
        </div>
    );
}
