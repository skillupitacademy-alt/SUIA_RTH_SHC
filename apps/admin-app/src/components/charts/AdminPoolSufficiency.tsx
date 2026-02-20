"use client";

import { apiClient, type PoolSufficiencyResponse } from "@quiz/api-client";
import { AlertTriangle, CheckCircle2, Database, Inbox, Info } from "lucide-react";
import React, { useEffect, useState } from "react";

import BaseChart from "./BaseChart";

export default function AdminPoolSufficiency() {
    const [data, setData] = useState<PoolSufficiencyResponse | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await apiClient.analytics.getAdminPoolSufficiency();
                setData(res);
            } catch (err: unknown) {
                console.error("Failed to fetch pool sufficiency", err);
            } finally {
                setLoading(false);
            }
        }

        void fetchData();
    }, []);

    const isEmpty = !loading && data === null;

    if (isEmpty) {
        return (
            <div className="flex flex-col items-center justify-center h-[350px] text-sm text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                <Inbox className="w-8 h-8 mb-2 opacity-20" />
                No question pool data available
            </div>
        );
    }

    const percent = data?.percent ?? 0;
    const available = data?.available ?? 0;
    const required = data?.required ?? 500;

    const getStatus = (p: number) => {
        if (p >= 80) return { label: "EXCELLENT", color: "text-emerald-500", bg: "bg-emerald-50" };
        if (p >= 50) return { label: "HEALTHY", color: "text-indigo-500", bg: "bg-indigo-50" };
        if (p >= 30) return { label: "LOW DEPTH", color: "text-amber-500", bg: "bg-amber-50" };
        return { label: "CRITICAL", color: "text-rose-500", bg: "bg-rose-50" };
    };

    const status = getStatus(percent);

    const option = {
        tooltip: {
            trigger: 'item',
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            textStyle: { color: '#fff', fontSize: 12 },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter: (params: any) => {
                return `<div class="p-2">
                    <div class="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Pool Status</div>
                    <div class="text-lg font-black">${params.value}% Optimized</div>
                    <div class="text-[10px] text-slate-500 mt-1">${available} / ${required} Items Cached</div>
                </div>`;
            }
        },
        series: [
            {
                type: 'gauge',
                startAngle: 180,
                endAngle: 0,
                center: ['50%', '85%'],
                radius: '140%',
                min: 0,
                max: 100,
                splitNumber: 10,
                axisLine: {
                    lineStyle: {
                        width: 16,
                        color: [
                            [0.3, '#F43F5E'], // Critical
                            [0.5, '#F59E0B'], // Low
                            [0.8, '#6366F1'], // Healthy
                            [1, '#10B981']    // Excellent
                        ]
                    }
                },
                pointer: {
                    icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
                    length: '12%',
                    width: 24,
                    offsetCenter: [0, '-60%'],
                    itemStyle: { color: 'auto' }
                },
                axisTick: { length: 12, lineStyle: { color: 'auto', width: 2 } },
                splitLine: { length: 20, lineStyle: { color: 'auto', width: 5 } },
                axisLabel: { color: '#94A3B8', fontSize: 12, distance: -75, rotate: 'tangential' },
                title: { offsetCenter: [0, '-20%'], fontSize: 20, fontWeight: 'bold' },
                detail: {
                    fontSize: 48,
                    fontWeight: 'black',
                    offsetCenter: [0, '-5%'],
                    valueAnimation: true,
                    formatter: (value: number) => `${Math.round(value)}%`,
                    color: 'inherit'
                },
                data: [{ value: percent, name: '' }]
            }
        ]
    };

    return (
        <div className="w-full bg-white p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/20 border border-slate-200 flex flex-col h-[600px] group hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 text-indigo-600 mb-1">
                        <Database size={18} />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Resources Protocol</p>
                    </div>
                    <h3 className="text-3xl font-outfit font-black uppercase tracking-tight text-slate-900">Pool Sufficiency</h3>
                </div>
                <div className="p-4 bg-slate-100 rounded-2xl text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
                    <Database size={24} />
                </div>
            </div>

            <div className="flex-grow min-h-[400px] relative">
                <BaseChart option={option} loading={loading} height="100%" />

                {/* Secondary Stats Overlay */}
                <div className="absolute top-0 right-0 p-6 border border-slate-100 rounded-[2rem] bg-slate-50/80 backdrop-blur-sm flex flex-col gap-2 shadow-sm">
                    <div className="flex items-center gap-2">
                        <Info size={12} className="text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Inventory Status</span>
                    </div>
                    <div>
                        <span className="text-3xl font-black text-slate-900">{available.toLocaleString()}</span>
                        <span className="text-sm font-bold text-slate-400 ml-1">/ {required}</span>
                    </div>
                </div>
            </div>

            <div className="mt-4 pt-8 border-t border-slate-100">
                <div className={`p-8 rounded-[2rem] flex items-center justify-between ${status.bg} border border-white shadow-inner`}>
                    <div className="flex items-center gap-6">
                        <div className={`p-4 rounded-2xl bg-white shadow-lg ${status.color}`}>
                            {percent < 30 ? <AlertTriangle size={32} /> : <CheckCircle2 size={32} />}
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">System Condition</p>
                            <h4 className={`text-2xl font-outfit font-black ${status.color}`}>
                                {status.label}
                            </h4>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-xs text-slate-500 font-bold leading-relaxed max-w-[280px] uppercase tracking-wide">
                            {percent < 30
                                ? "Critical scarcity detected. Blueprint generation inhibited."
                                : percent < 80
                                    ? "Operational depth achieved. Monitoring niche topic variance."
                                    : "Optimal volume reached. System redundancy fully established."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
