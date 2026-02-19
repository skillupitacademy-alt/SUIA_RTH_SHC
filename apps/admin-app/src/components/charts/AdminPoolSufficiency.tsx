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
        series: [
            {
                type: 'gauge',
                startAngle: 180,
                endAngle: 0,
                center: ['50%', '75%'],
                radius: '100%',
                min: 0,
                max: 100,
                splitNumber: 10,
                axisLine: {
                    lineStyle: {
                        width: 12,
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
                    width: 20,
                    offsetCenter: [0, '-60%'],
                    itemStyle: { color: 'auto' }
                },
                axisTick: { length: 12, lineStyle: { color: 'auto', width: 2 } },
                splitLine: { length: 20, lineStyle: { color: 'auto', width: 5 } },
                axisLabel: { color: '#94A3B8', fontSize: 12, distance: -60, rotate: 'tangential' },
                title: { offsetCenter: [0, '-20%'], fontSize: 20, fontWeight: 'bold' },
                detail: {
                    fontSize: 40,
                    fontWeight: 'black',
                    offsetCenter: [0, '0%'],
                    valueAnimation: true,
                    formatter: (value: number) => `${Math.round(value)}%`,
                    color: 'inherit'
                },
                data: [{ value: percent, name: '' }]
            }
        ]
    };

    return (
        <div className="w-full bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col h-full border-b-[6px] border-b-slate-100/50">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h3 className="text-xl font-outfit font-black uppercase tracking-tight text-[#1A1A1A]">Question Pool Sufficiency</h3>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Operational Readiness Analytics</p>
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Database size={24} />
                </div>
            </div>

            <div className="flex-grow min-h-[300px] relative">
                <BaseChart option={option} loading={loading} height="100%" />

                {/* Secondary Stats Overlay */}
                <div className="absolute top-0 right-0 p-4 border-2 border-slate-100 rounded-3xl bg-slate-50/50 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                        <Info size={12} className="text-slate-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Inventory Status</span>
                    </div>
                    <div>
                        <span className="text-2xl font-black text-slate-800">{available.toLocaleString()}</span>
                        <span className="text-xs font-bold text-slate-400 ml-1">/{required}</span>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-8 border-t border-slate-50">
                <div className={`p-6 rounded-[2rem] flex items-center justify-between ${status.bg} border-2 border-white shadow-sm`}>
                    <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-2xl bg-white shadow-sm ${status.color}`}>
                            {percent < 30 ? <AlertTriangle size={24} /> : <CheckCircle2 size={24} />}
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">System Condition</p>
                            <h4 className={`text-xl font-outfit font-black ${status.color}`}>
                                {status.label}
                            </h4>
                        </div>
                    </div>

                    <div className="text-right">
                        <p className="text-[11px] text-slate-500 font-medium leading-relaxed max-w-[200px]">
                            {percent < 30
                                ? "Critical scarcity. Blueprint generation will likely fail due to insufficient depth."
                                : percent < 80
                                    ? "Good depth. Sufficient for standard blueprints but monitor niche topics."
                                    : "Optimal volume. Capable of supporting high-frequency adaptive exams."}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
