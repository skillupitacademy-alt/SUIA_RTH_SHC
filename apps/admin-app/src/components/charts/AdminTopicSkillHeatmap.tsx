"use client";

import { apiClient, TopicSkillHeatmapResponse } from "@quiz/api-client";
import type { EChartsOption } from "echarts";
import { useEffect, useState } from "react";

import { clientLogger } from "@/utils/clientLogger";

import BaseChart from "./BaseChart";

type HeatmapParams = { value: [number, number, number] };

export default function AdminTopicSkillHeatmap() {
    const [data, setData] = useState<TopicSkillHeatmapResponse>({
        topics: [],
        skills: [],
        matrix: [],
    });
    const [loading, setLoading] = useState(true);
    const [forbidden, setForbidden] = useState(false);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await apiClient.analytics.getAdminTopicSkillHeatmap();
                setData(res);
            } catch (err: unknown) {
                clientLogger.error("Failed to load topic-skill heatmap", { error: err instanceof Error ? err.message : 'unknown' });
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

    const isEmpty = !loading && data.matrix.length === 0;

    if (isEmpty) {
        return (
            <div className="flex items-center justify-center h-[400px] text-sm text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                No topic-skill correlation data available yet.
            </div>
        );
    }

    const maxVal = Math.max(...data.matrix.map((m) => m[2]), 10);

    const option: EChartsOption = {
        tooltip: {
            position: "top",
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderColor: "#E2E8F0",
            textStyle: { color: "#1E293B" },
            padding: [10, 15],
            extraCssText: "box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border-radius: 8px;",
            formatter: (params: HeatmapParams) => {
                const topic = data.topics[params.value[0]];
                const skill = data.skills[params.value[1]];
                const count = params.value[2];
                return `
          <div class="font-bold mb-1 text-slate-800">${topic}</div>
          <div class="text-xs text-slate-500 mb-2">${skill}</div>
          <div class="flex items-center gap-2">
            <span class="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span class="text-slate-600 font-medium">Questions:</span>
            <span class="font-bold text-slate-900">${count}</span>
          </div>
        `;
            },
        },
        grid: {
            height: "70%",
            top: "10%",
            bottom: "20%",
            left: "10%",
            right: "5%"
        },
        xAxis: {
            type: "category" as const,
            data: data.topics,
            splitArea: { show: true, areaStyle: { color: ['#fff', '#f8fafc'] } },
            axisLabel: {
                rotate: 45,
                interval: 0,
                color: "#64748B",
                fontSize: 10,
                width: 100,
                overflow: 'truncate' as const
            },
            axisLine: { show: false },
            axisTick: { show: false }
        },
        yAxis: {
            type: "category" as const,
            data: data.skills,
            splitArea: { show: true },
            axisLabel: { color: "#64748B", fontSize: 11 },
            axisLine: { show: false },
            axisTick: { show: false }
        },
        visualMap: {
            min: 0,
            max: maxVal,
            calculable: true,
            orient: "horizontal",
            left: "center",
            bottom: "0%",
            inRange: {
                color: ['#eff6ff', '#3b82f6', '#1d4ed8'] // Blue-50 -> Blue-500 -> Blue-700
            },
            textStyle: { color: "#64748B" }
        },
        series: [
            {
                name: "Question Coverage",
                type: "heatmap",
                data: data.matrix,
                label: { show: false },
                itemStyle: {
                    borderColor: '#fff',
                    borderWidth: 1
                },
                emphasis: {
                    itemStyle: {
                        shadowBlur: 10,
                        shadowColor: "rgba(0, 0, 0, 0.2)",
                        borderColor: "#3b82f6",
                        borderWidth: 2
                    },
                },
            },
        ],
    } as unknown as EChartsOption;

    return (
        <div className="w-full bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-800">Knowledge Matrix</h3>
                    <p className="text-sm text-slate-500">Global question distribution by Topic & Skill</p>
                </div>
                <div className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
                    Heatmap
                </div>
            </div>
            <BaseChart option={option} height={450} loading={loading} />
        </div>
    );
}
