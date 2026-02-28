"use client";

import { apiClient, type DifficultyVarianceResponse } from "@quiz/api-client";
import type { EChartsOption } from "echarts";
import { Info, Target } from "lucide-react";
import React, { useEffect, useState } from "react";

import { clientLogger } from "@/utils/clientLogger";

import BaseChart from "./BaseChart";

export default function AdminPlannedVsActualDifficulty() {
    const [data, setData] = useState<DifficultyVarianceResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await apiClient.analytics.getAdminPlannedVsActualDifficulty();
                setData(res);
            } catch (err: unknown) {
                clientLogger.error("Failed to fetch difficulty variance", { error: err instanceof Error ? err.message : "unknown" });
            } finally {
                setLoading(false);
            }
        }

        void fetchData();
    }, []);

    const isEmpty = !loading && (!data || data.planned.every(v => v === 0));

    if (isEmpty) {
        return (
            <div className="flex flex-col items-center justify-center h-[400px] text-sm text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <Target className="w-8 h-8 mb-2 opacity-20" />
                No variance data available
            </div>
        );
    }

    const labels = data?.labels.map(l => l.toUpperCase()) || [];
    const planned = data?.planned || [];
    const actual = data?.actual || [];

    type TooltipItem = {
        name: string;
        color: string;
        value: number;
        seriesName: string;
    };

    const option: EChartsOption = {
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            backgroundColor: "rgba(255, 255, 255, 0.95)",
            borderColor: "#E2E8F0",
            padding: [12, 16],
            extraCssText: "box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-radius: 12px;",
            formatter: (params: TooltipItem[]) => {
                if (params.length === 0) return "";
                let html = `<div class="font-bold text-slate-800 mb-2">${params[0].name}</div>`;
                params.forEach((p) => {
                    html += `
                        <div class="flex items-center justify-between gap-8 mb-1">
                            <div class="flex items-center gap-2">
                                <span class="w-2h-2 rounded-full" style="background-color: ${p.color}; width: 8px; height: 8px;"></span>
                                <span class="text-xs text-slate-500 font-medium">${p.seriesName}:</span>
                            </div>
                            <span class="text-xs font-bold text-slate-700">${p.value}%</span>
                        </div>
                    `;
                });
                return html;
            }
        },
        legend: {
            data: ['Planned', 'Actual'],
            bottom: 0,
            icon: 'circle',
            textStyle: { color: '#64748B', fontWeight: 'bold' }
        },
        grid: {
            top: '10%',
            left: '3%',
            right: '4%',
            bottom: '15%',
            containLabel: true
        },
        xAxis: {
            type: 'category' as const,
            data: labels,
            axisLine: { show: false },
            axisTick: { show: false },
            axisLabel: { color: '#475569', fontWeight: 'bold', fontSize: 11 }
        },
        yAxis: {
            type: 'value' as const,
            max: 100,
            splitLine: { lineStyle: { type: 'dashed', color: '#F1F5F9' } },
            axisLabel: { color: '#94A3B8', fontSize: 10, formatter: '{value}%' }
        },
        series: [
            {
                name: 'Planned',
                type: 'bar',
                data: planned,
                barWidth: '30%',
                itemStyle: { color: '#E2E8F0', borderRadius: [4, 4, 0, 0] },
                emphasis: { itemStyle: { color: '#CBD5E1' } }
            },
            {
                name: 'Actual',
                type: 'bar',
                data: actual,
                barWidth: '30%',
                itemStyle: { color: '#6366F1', borderRadius: [4, 4, 0, 0] },
                emphasis: { itemStyle: { color: '#4F46E5' } }
            }
        ]
    } as unknown as EChartsOption;

    // Calculate Variance Insight
    const maxVarianceIdx = actual.reduce((max, curr, idx) =>
        Math.abs(curr - planned[idx]) > Math.abs(actual[max] - planned[max]) ? idx : max, 0
    );
    const variance = actual[maxVarianceIdx] - planned[maxVarianceIdx];
    const isDrifting = Math.abs(variance) > 10;

    return (
        <div className="w-full bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-full">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-outfit font-black uppercase tracking-tight text-[#1A1A1A]">Planned vs Actual Difficulty</h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Curriculum Compliance Audit</p>
                </div>
                <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                    <Target size={24} />
                </div>
            </div>

            <div className="flex-grow min-h-[300px]">
                <BaseChart option={option} loading={loading} height="100%" />
            </div>

            <div className="mt-8 pt-8 border-t border-slate-50">
                <div className={`p-4 rounded-2xl flex items-start gap-3 ${isDrifting ? 'bg-amber-50' : 'bg-emerald-50'}`}>
                    <Info size={18} className={isDrifting ? 'text-amber-500' : 'text-emerald-500'} />
                    <div>
                        <p className="text-xs font-bold text-slate-700">
                            {isDrifting
                                ? `Significant Drift Detected: ${data?.labels[maxVarianceIdx]} level is ${Math.abs(variance)}% off target.`
                                : "High Compliance: Actual distribution matches blueprint targets."
                            }
                        </p>
                        <p className="text-[10px] text-slate-500 mt-1 font-medium">
                            {isDrifting
                                ? "Consider adjusting blueprint weights or auditing topic depth."
                                : "The exam engine is maintaining ideal curricular balance."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
