"use client";

import type { EChartsOption } from "echarts";
import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { clientLogger } from "@/utils/clientLogger";
import BaseChart from "@/components/charts/BaseChart";

interface HistoryItem {
    level: string;
    date: string;
}

interface TopicProgressChartProps {
    topicId: string;
}

export function TopicProgressChart({ topicId }: TopicProgressChartProps) {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        async function fetchHistory() {
            try {
                const res = await fetch(`/api/recommendations/history?topicId=${topicId}`, {
                    credentials: "include",
                });
                if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error ?? `Failed to fetch history (${res.status})`);
                }
                const data = await res.json();
                setHistory(data);
                setError(null);
            } catch (err) {
                clientLogger.error("Failed to fetch history", { error: err instanceof Error ? err.message : "unknown" });
                setError(err instanceof Error ? err.message : "Unable to load history");
            } finally {
                setLoading(false);
            }
        }
        fetchHistory();
    }, [topicId]);

    const levelMap: Record<string, number> = {
        revise: 1,
        practice: 2,
        advance: 3,
    };

    const option: EChartsOption = {
        grid: {
            top: 20,
            bottom: 40,
            left: 55,
            right: 20,
        },
        xAxis: {
            type: "category" as const,
            data: history.map(h => new Date(h.date).toLocaleDateString()),
            axisLabel: {
                fontSize: 8,
                color: "#94a3b8",
                rotate: 20
            }
        },
        yAxis: {
            type: "value" as const,
            min: 0,
            max: 4,
            interval: 1,
            axisLabel: {
                fontSize: 8,
                color: "#94a3b8",
                formatter: (val: number) => {
                    if (val === 1) return "REVISE";
                    if (val === 2) return "PRACTICE";
                    if (val === 3) return "ADVANCE";
                    return "";
                }
            },
            splitLine: {
                lineStyle: {
                    type: 'dashed',
                    color: '#f1f5f9'
                }
            }
        },
        series: [
            {
                data: history.map(h => levelMap[h.level] || 0),
                type: "line",
                smooth: true,
                symbol: "circle",
                symbolSize: 8,
                lineStyle: {
                    color: "#f97316",
                    width: 3
                },
                itemStyle: {
                    color: "#f97316",
                    borderWidth: 2,
                    borderColor: "#fff"
                },
                areaStyle: {
                    color: {
                        type: "linear",
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: "rgba(249, 115, 22, 0.15)" },
                            { offset: 1, color: "rgba(249, 115, 22, 0)" }
                        ]
                    }
                }
            }
        ],
        tooltip: {
            trigger: "axis",
            backgroundColor: "#fff",
            borderColor: "#f1f5f9",
            textStyle: {
                color: "#1e293b",
                fontSize: 10,
                fontWeight: 'bold'
            },
            formatter: (params: unknown) => {
                const list = Array.isArray(params) ? params : [];
                const p = list[0] as { value: number; name: string } | undefined;
                if (!p) return "";
                const level = p.value === 1 ? "REVISE" : p.value === 2 ? "PRACTICE" : "ADVANCE";
                return `<div class="p-1">${p.name}<br/><span class="text-orange-500">${level}</span></div>`;
            }
        }
    } as unknown as EChartsOption;

    if (loading) return <div className="h-40 bg-slate-50 animate-pulse rounded-xl mt-4" />;
    if (error) {
        return (
            <div className="h-32 flex flex-col items-center justify-center text-center p-4 rounded-xl bg-rose-50 border border-rose-100 mt-4 text-rose-600 text-sm font-semibold">
                {error}
            </div>
        );
    }
    if (history.length < 2) return (
        <div className="h-32 flex flex-col items-center justify-center text-center p-4 rounded-xl bg-slate-50 border border-slate-100 mt-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Growth Data Pending</p>
            <p className="text-[11px] font-medium text-slate-500 mt-1">Complete more missions to see your mastery progress chart.</p>
        </div>
    );

    return (
        <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-4">
                <Sparkles size={12} className="text-orange-500" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">Mastery Progress Journey</p>
            </div>
            <BaseChart option={option} height={180} />
        </div>
    );
}
