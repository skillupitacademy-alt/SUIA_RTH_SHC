"use client";

import { apiClient, WeaknessTreeNode } from "@quiz/api-client";
import { useEffect, useState } from "react";

import BaseChart from "./BaseChart";

export default function WeaknessTreeChart() {
    const [data, setData] = useState<WeaknessTreeNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await apiClient.analytics.getUserWeaknessTree();
                setData(res);
            } catch (err: unknown) {
                console.error("Failed to load weakness tree", err);
                setError(true);
            } finally {
                setLoading(false);
            }
        }

        void fetchData();
    }, []);

    if (error) {
        return (
            <div className="flex items-center justify-center h-[400px] text-sm text-red-500 bg-red-50 rounded-xl border border-red-100">
                Unable to load weakness analysis
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

    const option = {
        tooltip: {
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderColor: "#E2E8F0",
            textStyle: { color: "#1E293B" },
            padding: [10, 15],
            extraCssText: "box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-radius: 8px;",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter: (info: any) => {
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
                type: "treemap",
                data: data,
                roam: false,
                nodeClick: "zoomToNode",
                breadcrumb: {
                    show: true,
                    top: 5,
                    left: "center",
                    itemStyle: {
                        color: "#F1F5F9",
                        borderColor: "#E2E8F0",
                        textStyle: { color: "#475569", fontSize: 11 },
                    },
                },
                levels: [
                    {
                        // Domain level
                        itemStyle: {
                            borderColor: "#94A3B8",
                            borderWidth: 2,
                            gapWidth: 3,
                        },
                        upperLabel: {
                            show: true,
                            height: 28,
                            color: "#1E293B",
                            fontWeight: "bold",
                            fontSize: 13,
                            backgroundColor: "rgba(241, 245, 249, 0.9)",
                            padding: [4, 8],
                        },
                    },
                    {
                        // Topic level
                        itemStyle: {
                            borderColor: "#CBD5E1",
                            borderWidth: 1,
                            gapWidth: 2,
                        },
                        upperLabel: {
                            show: true,
                            height: 24,
                            color: "#334155",
                            fontWeight: "600",
                            fontSize: 11,
                            backgroundColor: "rgba(248, 250, 252, 0.9)",
                            padding: [3, 6],
                        },
                    },
                    {
                        // Skill level (leaf)
                        itemStyle: {
                            borderColor: "#E2E8F0",
                            borderWidth: 1,
                            gapWidth: 1,
                        },
                        label: {
                            show: true,
                            color: "#fff",
                            fontWeight: "bold",
                            fontSize: 10,
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            formatter: (params: any) => {
                                const val = params.value as number;
                                return `${params.name}\n${100 - val}%`;
                            },
                        },
                    },
                ],
                visualMin: 0,
                visualMax: 100,
                visualDimension: 0,
                color: ["#22c55e", "#84cc16", "#eab308", "#f59e0b", "#ef4444"],
                colorMappingBy: "value",
            },
        ],
    };

    return (
        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Weakness Analysis</h3>
                    <p className="text-sm text-slate-500">Domain → Topic → Skill — click to drill down</p>
                </div>
                <div className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-xs font-bold uppercase tracking-wider">
                    Adaptive
                </div>
            </div>
            <BaseChart option={option} height={450} loading={loading} />
        </div>
    );
}
