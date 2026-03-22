"use client";

import { apiClient, ItemDifficultyResponse } from "@quiz/api-client";
import type { EChartsOption } from "echarts";
import type { CallbackDataParams } from "echarts/types/dist/shared";
import { useEffect, useState } from "react";

import { clientLogger } from "@/utils/clientLogger";

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
                apiClient.client.setPortalIdentity("admin");
                const res = await apiClient.analytics.getAdminItemDifficulty();
                setData(res);
            } catch (err: unknown) {
                clientLogger.error("Failed to load item difficulty", { error: err instanceof Error ? err.message : "unknown" });
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

    const truncatedIds = data.ids.map((id) => "..." + id.slice(-8));

    const option: EChartsOption = {
        tooltip: {
            trigger: "item",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderColor: "#E2E8F0",
            textStyle: { color: "#1E293B" },
            padding: [10, 15],
            extraCssText: "box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-radius: 8px;",
            formatter: (params: CallbackDataParams) => {
                const index = params.dataIndex;
                const fullId = data.ids[index];
                const accuracy = data.accuracy[index];
                const attempts = data.attempts[index];
                const acColor = accuracy < 40 ? "#ef4444" : accuracy < 70 ? "#f59e0b" : "#22c55e";

                return `
          <div class="font-bold mb-1 text-slate-800">Question ID</div>
          <div class="text-xs text-slate-500 mb-2 font-mono">${fullId}</div>
          <div class="flex items-center gap-4">
            <div>
              <div class="text-xs text-slate-500">Accuracy</div>
              <div class="font-bold" style="color:${acColor}">${accuracy}%</div>
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
            left: 100,
        },
        xAxis: {
            type: "value" as const,
            max: 100,
            axisLabel: { color: "#64748B", fontSize: 11 },
            splitLine: { lineStyle: { type: "dashed", color: "#F1F5F9" } },
        },
        yAxis: {
            type: "category" as const,
            data: truncatedIds,
            axisLabel: {
                color: "#64748B",
                fontSize: 11,
                fontFamily: "monospace",
            },
            axisLine: { show: false },
            axisTick: { show: false },
            inverse: true,
        },
        series: [
            {
                name: "Difficulty",
                type: "bar",
                data: data.accuracy,
                barMaxWidth: 20,
                itemStyle: {
                    borderRadius: [0, 4, 4, 0],
                    color: (params: CallbackDataParams) => {
                        const value = Number(params.value);
                        if (value < 40) return "#ef4444";
                        if (value < 70) return "#f59e0b";
                        return "#22c55e";
                    },
                },
            },
        ],
    } as unknown as EChartsOption;

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
