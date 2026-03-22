"use client";

import { apiClient, DiscriminationResponse } from "@quiz/api-client";
import type { EChartsOption } from "echarts";
import type { CallbackDataParams } from "echarts/types/dist/shared";
import { useEffect, useState } from "react";

import { clientLogger } from "@/utils/clientLogger";

import BaseChart from "./BaseChart";

export default function AdminDiscriminationScatter() {
    const [points, setPoints] = useState<DiscriminationResponse["points"]>([]);
    const [loading, setLoading] = useState(true);
    const [forbidden, setForbidden] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                apiClient.client.setPortalIdentity("admin");
                const res = await apiClient.analytics.getAdminDiscrimination();
                setPoints(res.points);
            } catch (err: unknown) {
                clientLogger.error("Failed to load discrimination data", { error: err instanceof Error ? err.message : "unknown" });
                const error = err as Error;
                if (error.message?.includes("Forbidden") || error.message?.includes("403")) {
                    setForbidden(true);
                }
            } finally {
                setLoading(false);
            }
        }

        void fetchData();
    }, []);

    if (forbidden) {
        return (
            <div className="flex items-center justify-center h-[400px] text-sm text-red-500 bg-red-50 rounded-xl border border-red-100">
                Admin access required
            </div>
        );
    }

    const isEmpty = !loading && points.length === 0;

    if (isEmpty) {
        return (
            <div className="flex items-center justify-center h-[400px] text-sm text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No discrimination data available
            </div>
        );
    }

    const scatterData = points.map((p) => [p.bottom * 100, p.top * 100, p.id]);

    const option: EChartsOption = {
        tooltip: {
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderColor: "#E2E8F0",
            textStyle: { color: "#1E293B" },
            padding: [10, 15],
            extraCssText: "box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-radius: 8px;",
            formatter: (params: CallbackDataParams) => {
                const [bottom, top, id] = params.value as [number, number, string];
                const discrimination = top - bottom;

                let quality = "Average";
                let color = "#f59e0b"; // amber

                if (discrimination > 30) {
                    quality = "Good discriminator";
                    color = "#22c55e"; // green
                } else if (discrimination < 0) {
                    quality = "Broken question";
                    color = "#ef4444"; // red
                }

                return `
          <div class="font-bold mb-1 text-slate-800">Question ID: ${id}</div>
          <div class="space-y-1 text-xs">
            <div class="flex justify-between gap-4">
              <span class="text-slate-500">Top 25% Accuracy:</span>
              <span class="font-bold text-slate-700">${top.toFixed(1)}%</span>
            </div>
            <div class="flex justify-between gap-4">
              <span class="text-slate-500">Bottom 25% Accuracy:</span>
              <span class="font-bold text-slate-700">${bottom.toFixed(1)}%</span>
            </div>
            <div class="flex justify-between gap-4 border-t border-slate-100 pt-1 mt-1">
              <span class="text-slate-500">Discrimination Index:</span>
              <span class="font-bold" style="color: ${color}">${discrimination.toFixed(1)}%</span>
            </div>
            <div class="mt-2 text-center py-1 px-2 rounded-md font-bold text-white" style="background: ${color}">
              ${quality}
            </div>
          </div>
        `;
            },
        },
        grid: {
            top: 40,
            right: 60,
            bottom: 60,
            left: 60,
        },
        xAxis: {
            type: "value" as const,
            name: "Bottom Performers Accuracy (%)",
            nameLocation: "middle",
            nameGap: 30,
            min: 0,
            max: 100,
            axisLabel: { color: "#64748B" },
            splitLine: { lineStyle: { type: "dashed", color: "#F1F5F9" } },
        },
        yAxis: {
            type: "value" as const,
            name: "Top Performers Accuracy (%)",
            nameLocation: "middle",
            nameGap: 40,
            min: 0,
            max: 100,
            axisLabel: { color: "#64748B" },
            splitLine: { lineStyle: { type: "dashed", color: "#F1F5F9" } },
        },
        series: [
            {
                type: "scatter",
                data: scatterData,
                symbolSize: 12,
                itemStyle: {
                    shadowBlur: 10,
                    shadowColor: "rgba(0, 0, 0, 0.1)",
                    color: (params: CallbackDataParams) => {
                        const bottom = (params.value as number[])[0];
                        const top = (params.value as number[])[1];
                        const diff = top - bottom;

                        if (diff < 0) return "#ef4444"; // broken (red)
                        if (diff > 30) return "#22c55e"; // good (green)
                        return "#f59e0b"; // average (amber)
                    },
                },
                markLine: {
                    silent: true,
                    symbol: "none",
                    lineStyle: { color: "#CBD5E1", type: "dashed" },
                    data: [
                        { type: "average", name: "Avg" },
                        {
                            // Diagonal line representing top = bottom (no discrimination)
                            symbol: "none",
                            lineStyle: { color: "#64748B", type: "dotted", opacity: 0.5 },
                            data: [
                                [0, 0],
                                [100, 100],
                            ],
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
                    <h3 className="text-lg font-semibold text-slate-800">Discrimination Analysis</h3>
                    <p className="text-sm text-slate-500">Comparing top vs. bottom performers to find question quality</p>
                </div>
                <div className="px-3 py-1 bg-violet-50 text-violet-600 rounded-full text-xs font-bold uppercase tracking-wider">
                    Psychometrics
                </div>
            </div>
            <BaseChart option={option} height={450} loading={loading} />
            <div className="mt-4 grid grid-cols-3 gap-4 text-[10px] uppercase font-bold tracking-widest text-slate-400">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Good Discriminator ({">"}30%)</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Average Distinguisher</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Broken / Neg. Discrimination</span>
                </div>
            </div>
        </div>
    );
}
