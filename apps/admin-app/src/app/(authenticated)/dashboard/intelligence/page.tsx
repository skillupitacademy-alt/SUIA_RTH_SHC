'use client';

import { apiClient } from "@quiz/api-client";
import { ZLoader, ZSkeleton } from "@quiz/ui";
import type { EChartsOption } from "echarts";
import { BarChart3, BrainCircuit, Layers, LayoutDashboard, Microscope, PieChart as PieChartIcon, ShieldCheck, TrendingDown } from "lucide-react";
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const AdminDiscriminationScatter = dynamic(() => import("@/components/charts/AdminDiscriminationScatter"), { loading: () => <ZSkeleton className="h-64 w-full rounded-2xl" /> });
const AdminItemDifficultyChart = dynamic(() => import("@/components/charts/AdminItemDifficultyChart"), { loading: () => <ZSkeleton className="h-64 w-full rounded-2xl" /> });
const AdminPlannedVsActualDifficulty = dynamic(() => import("@/components/charts/AdminPlannedVsActualDifficulty"), { loading: () => <ZSkeleton className="h-64 w-full rounded-2xl" /> });
const AdminPoolSufficiency = dynamic(() => import("@/components/charts/AdminPoolSufficiency"), { loading: () => <ZSkeleton className="h-64 w-full rounded-2xl" /> });
const AdminScoreHistogram = dynamic(() => import("@/components/charts/AdminScoreHistogram"), { loading: () => <ZSkeleton className="h-64 w-full rounded-2xl" /> });
const AdminTopicSkillHeatmap = dynamic(() => import("@/components/charts/AdminTopicSkillHeatmap"), { loading: () => <ZSkeleton className="h-64 w-full rounded-2xl" /> });
const BaseChart = dynamic(() => import("@/components/charts/BaseChart"), { loading: () => <ZSkeleton className="h-24 w-full rounded-2xl" /> });
const BrokenQuestionsRepairStation = dynamic(() => import("@/components/intelligence/BrokenQuestionsRepairStation").then(mod => ({ default: mod.BrokenQuestionsRepairStation })), { loading: () => <ZSkeleton className="h-64 w-full rounded-2xl" /> });
const HelpRequestManager = dynamic(() => import("@/components/tutor/HelpRequestManager").then(mod => ({ default: mod.HelpRequestManager })), { loading: () => <ZSkeleton className="h-64 w-full rounded-2xl" /> });

import { PageTitle } from "@quiz/ui";

import { notesSecurityGuide } from "@/components/intelligence/guides";
import { InsightGuideCard } from "@/components/intelligence/InsightGuideCard";
import { clientLogger } from "@/utils/clientLogger";

type TutorMetrics = {
    notesDemand: { name: string; count: number }[];
    emailHealth: { status: string; count: number }[];
    weakTopics: { name: string; student_count: number }[];
    helpRequests: { status: string; count: number }[];
};

export default function AdminIntelligencePage() {
    const [tutorData, setTutorData] = useState<TutorMetrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<"command" | "audit" | "cohort" | "telemetry">("command");
    useEffect(() => {
        apiClient.client.setPortalIdentity("admin");
    }, []);

    const fetchTutorMetrics = useCallback(async () => {
        try {
            setError(null);
            apiClient.client.setPortalIdentity("admin");
            const json = await apiClient.client.get<TutorMetrics>("/admin/metrics/tutor");
            setTutorData(json);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Unknown error";
            if (errorMessage.includes("401") || errorMessage.includes("403")) {
                toast.error("Session expired or unauthorized. Please re-login.");
            } else {
                toast.error(`Metrics fetch failed (${errorMessage})`);
            }
            clientLogger.error("Failed to fetch tutor analytics", { error: err instanceof Error ? err.message : "unknown" });
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void fetchTutorMetrics(); }, [fetchTutorMetrics]);

    const notesDemandOption: EChartsOption | null = tutorData ? {
        tooltip: { trigger: 'axis' as const },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: {
            type: 'category' as const,
            data: tutorData.notesDemand.map((d) => d.name),
            axisLabel: { rotate: 30, fontSize: 10, color: '#94a3b8', fontWeight: 'bold' as const }
        },
        yAxis: { type: 'value' as const, splitLine: { lineStyle: { type: 'dashed' as const } } },
        series: [{
            data: tutorData.notesDemand.map((d) => d.count),
            type: 'bar' as const,
            barWidth: '35%',
            itemStyle: {
                color: '#3b82f6',
                borderRadius: [8, 8, 0, 0]
            }
        }]
    } : null;

    const emailHealthOption: EChartsOption | null = tutorData ? {
        tooltip: { trigger: 'item' as const },
        legend: { bottom: '0%', left: 'center' },
        series: [{
            name: 'Status',
            type: 'pie' as const,
            radius: ['45%', '70%'],
            avoidLabelOverlap: false,
            itemStyle: { borderRadius: 15, borderColor: '#fff', borderWidth: 4 },
            label: { show: false },
            color: ['#10b981', '#f59e0b', '#ef4444', '#64748b'],
            data: tutorData.emailHealth.map((d) => ({
                value: d.count,
                name: d.status.toUpperCase()
            }))
        }]
    } : null;

    const weakTopicsOption: EChartsOption | null = tutorData ? {
        tooltip: { trigger: 'axis' as const },
        grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
        xAxis: {
            type: 'value' as const,
            splitLine: { lineStyle: { type: 'dashed' as const } },
        },
        yAxis: {
            type: 'category' as const,
            data: tutorData.weakTopics.map((d) => d.name),
            axisLabel: { color: '#94a3b8', fontSize: 10, fontWeight: 'bold' as const }
        },
        series: [{
            name: 'Students',
            type: 'bar' as const,
            data: tutorData.weakTopics.map((d) => d.student_count),
            barWidth: '45%',
            itemStyle: {
                color: '#f43f5e',
                borderRadius: [0, 6, 6, 0]
            }
        }]
    } : null;

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[70vh]">
                <ZLoader text="Compiling command dashboard..." />
            </div>
        );
    }

    if (error !== null) {
        return (
            <div className="flex flex-col items-center justify-center h-[70vh] gap-4">
                <p className="text-lg font-semibold text-red-500">Failed to load intelligence metrics</p>
                <p className="text-sm text-slate-500">{error}</p>
                <button
                    onClick={() => { setLoading(true); void fetchTutorMetrics(); }}
                    className="px-4 py-2 bg-black text-white rounded-lg"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-24">
            <div className="flex items-center gap-3">
                <LayoutDashboard size={24} className="text-slate-600" />
                <PageTitle text="Intelligence Center" />
            </div>

            {/* Command Deck Tabs */}
            <div className="flex gap-3 bg-white/70 p-2 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
                {[
                    { id: 'command', label: 'Command Deck', icon: BarChart3 },
                    { id: 'audit', label: 'Audit Stack', icon: ShieldCheck },
                    { id: 'cohort', label: 'Cohort Signals', icon: BrainCircuit },
                    { id: 'telemetry', label: 'Telemetry', icon: Layers }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-black text-white shadow-lg' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <tab.icon size={16} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Telemetry Section */}
            {activeTab === 'telemetry' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {[{
                        title: "Notes Demand",
                        subtitle: "Topic requests",
                        icon: Microscope,
                        option: notesDemandOption
                    }, {
                        title: "Email Health",
                        subtitle: "Status distribution",
                        icon: PieChartIcon,
                        option: emailHealthOption
                    }, {
                        title: "Weak Topics",
                        subtitle: "Top pain points",
                        icon: TrendingDown,
                        option: weakTopicsOption
                    }].map((card) => (
                        <div key={card.title} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
                            <div className="flex items-center gap-2">
                                <card.icon size={18} className="text-slate-500" />
                                <div>
                                    <p className="text-sm font-bold text-slate-800">{card.title}</p>
                                    <p className="text-[12px] text-slate-500">{card.subtitle}</p>
                                </div>
                            </div>
                            <BaseChart option={card.option ?? {}} height={340} />
                        </div>
                    ))}
                </div>
            )}

            {/* Command Deck */}
            {activeTab === 'command' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <AdminScoreHistogram />
                    <AdminItemDifficultyChart />
                    <AdminDiscriminationScatter />
                    <AdminPoolSufficiency />
                </div>
            )}

            {/* Audit Stack */}
            {activeTab === 'audit' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <AdminTopicSkillHeatmap />
                    <AdminPlannedVsActualDifficulty />
                    <BrokenQuestionsRepairStation />
                </div>
            )}

            {/* Cohort Signals */}
            {activeTab === 'cohort' && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    <HelpRequestManager />
                    <InsightGuideCard {...notesSecurityGuide} />
                </div>
            )}
        </div>
    );
}
