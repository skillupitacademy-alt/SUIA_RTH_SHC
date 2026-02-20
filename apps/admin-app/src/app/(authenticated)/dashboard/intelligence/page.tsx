'use client';

import { ZLoader } from "@quiz/ui";
import { BarChart3, BrainCircuit, PieChart as PieChartIcon, ShieldCheck, TrendingDown } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import AdminDiscriminationScatter from "@/components/charts/AdminDiscriminationScatter";
import AdminItemDifficultyChart from "@/components/charts/AdminItemDifficultyChart";
import AdminPlannedVsActualDifficulty from "@/components/charts/AdminPlannedVsActualDifficulty";
import AdminPoolSufficiency from "@/components/charts/AdminPoolSufficiency";
import AdminScoreHistogram from "@/components/charts/AdminScoreHistogram";
import AdminTopicSkillHeatmap from "@/components/charts/AdminTopicSkillHeatmap";
import BaseChart from "@/components/charts/BaseChart";
import { BrokenQuestionsRepairStation } from "@/components/intelligence/BrokenQuestionsRepairStation";
import {
    discriminationGuide,
    helpQueueGuide,
    itemDifficultyGuide,
    notesSecurityGuide,
    plannedVsActualGuide,
    poolGaugeGuide,
    scoreHistogramGuide,
    topicSkillHeatmapGuide
} from "@/components/intelligence/guides";
import { InsightGuideCard } from "@/components/intelligence/InsightGuideCard";
import { PageTitle } from "@/components/layout/PageTitle";
import { HelpRequestManager } from "@/components/tutor/HelpRequestManager";

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

    const fetchTutorMetrics = useCallback(async () => {
        try {
            setError(null);
            const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "";
            const res = await fetch(`${apiBase}/api/admin/metrics/tutor`, { credentials: "include" });
            if (!res.ok) {
                const msg = `Status: ${res.status}`;
                if (res.status === 401 || res.status === 403) {
                    toast.error("Session expired or unauthorized. Please re-login.");
                } else {
                    toast.error(`Metrics fetch failed (${msg})`);
                }
                throw new Error(msg);
            }
            const json: TutorMetrics = await res.json();
            setTutorData(json);
        } catch (err) {
            console.error("Failed to fetch tutor analytics", err);
            setError(err instanceof Error ? err.message : "Unknown error");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void fetchTutorMetrics(); }, [fetchTutorMetrics]);

    const notesDemandOption = tutorData ? {
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '15%', containLabel: true },
        xAxis: {
            type: 'category',
            data: tutorData.notesDemand.map((d) => d.name),
            axisLabel: { rotate: 30, fontSize: 10, color: '#94a3b8', fontWeight: 'bold' }
        },
        yAxis: { type: 'value', splitLine: { lineStyle: { type: 'dashed' } } },
        series: [{
            data: tutorData.notesDemand.map((d) => d.count),
            type: 'bar',
            barWidth: '35%',
            itemStyle: {
                color: '#3b82f6',
                borderRadius: [8, 8, 0, 0]
            }
        }]
    } : null;

    const emailHealthOption = tutorData ? {
        tooltip: { trigger: 'item' },
        legend: { bottom: '0%', left: 'center' },
        series: [{
            name: 'Status',
            type: 'pie',
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

    const weakTopicsOption = tutorData ? {
        tooltip: { trigger: 'axis' },
        grid: { left: '3%', right: '4%', bottom: '10%', containLabel: true },
        xAxis: {
            type: 'value',
            splitLine: { lineStyle: { type: 'dashed' } }
        },
        yAxis: {
            type: 'category',
            data: tutorData.weakTopics.map((d) => d.name),
            axisLabel: { fontSize: 10, color: '#94a3b8', fontWeight: 'bold' }
        },
        series: [{
            data: tutorData.weakTopics.map((d) => d.student_count),
            type: 'bar',
            itemStyle: {
                color: '#ef4444',
                borderRadius: [0, 8, 8, 0]
            }
        }]
    } : null;

    const tabs: { key: typeof activeTab; label: string }[] = [
        { key: "command", label: "Command & Repair" },
        { key: "audit", label: "Psychometric Audit" },
        { key: "cohort", label: "Cohort Mastery" },
        { key: "telemetry", label: "Operational Telemetry" },
    ];
    const hasError = typeof error === "string" && error.length > 0;
    const hasTutorData = tutorData !== null;
    const errorMessage = hasError ? error as string : null;

    return (
        <div className="space-y-12 pb-24">
            {/* Header */}
            <div className="flex flex-col gap-2 border-b-2 border-slate-100 pb-10">
                <div className="flex items-center gap-3 text-blue-600">
                    <div className="p-2 rounded-xl bg-blue-100/50 shadow-sm border border-blue-200/50">
                        <BrainCircuit size={24} strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Intelligence Matrix</span>
                </div>
                <PageTitle text="Global Strategic Hub" />
                <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest leading-relaxed max-w-3xl">
                    Unified psychometric analysis and operational telemetry. Decode cohort behaviors to drive content engineering and intervention priority.
                </p>
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-2">
                {tabs.map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest border transition-all ${
                            activeTab === tab.key ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-600 border-slate-200 hover:border-blue-200 hover:text-blue-600"
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            {activeTab === "command" && (
                <div className="space-y-24">
                    {/* Repair Station */}
                    <div className="space-y-8">
                        <div className="text-center space-y-2">
                            <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Diagnostic Summary</h2>
                            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Operational Readiness & Content Reliability</p>
                        </div>
                        <BrokenQuestionsRepairStation />
                    </div>

                    {/* Pool Sufficiency */}
                    <div className="space-y-8">
                        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 max-w-[1400px] mx-auto overflow-hidden">
                            <AdminPoolSufficiency />
                        </div>
                        <InsightGuideCard {...poolGaugeGuide} />
                    </div>
                </div>
            )}

            {activeTab === "audit" && (
                <div className="space-y-24">
                    {/* Item Difficulty */}
                    <div className="space-y-8">
                        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 max-w-[1400px] mx-auto overflow-hidden">
                            <AdminItemDifficultyChart />
                        </div>
                        <InsightGuideCard {...itemDifficultyGuide} />
                    </div>

                    {/* Discrimination */}
                    <div className="space-y-8">
                        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 max-w-[1400px] mx-auto overflow-hidden">
                            <AdminDiscriminationScatter />
                        </div>
                        <InsightGuideCard {...discriminationGuide} />
                    </div>

                    {/* Planned vs Actual */}
                    <div className="space-y-8">
                        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 max-w-[1400px] mx-auto overflow-hidden">
                            <AdminPlannedVsActualDifficulty />
                        </div>
                        <InsightGuideCard {...plannedVsActualGuide} />
                    </div>
                </div>
            )}

            {activeTab === "cohort" && (
                <div className="space-y-24">
                    {/* Score Distribution */}
                    <div className="space-y-8">
                        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 max-w-[1400px] mx-auto overflow-hidden">
                            <AdminScoreHistogram />
                        </div>
                        <InsightGuideCard {...scoreHistogramGuide} />
                    </div>

                    {/* Heatmap */}
                    <div className="space-y-8">
                        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 max-w-[1400px] mx-auto overflow-hidden">
                            <AdminTopicSkillHeatmap />
                        </div>
                        <InsightGuideCard {...topicSkillHeatmapGuide} />
                    </div>
                </div>
            )}

            {activeTab === "telemetry" && (
                <div className="space-y-24">
                    {/* Help Queue */}
                    <div className="space-y-8">
                        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 max-w-[1400px] mx-auto overflow-hidden">
                            <HelpRequestManager />
                        </div>
                        <InsightGuideCard {...helpQueueGuide} />
                    </div>

                    {/* Notes Security & Delivery */}
                    <div className="max-w-[1400px] mx-auto space-y-8">
                        <div className="p-12 rounded-[3.5rem] bg-slate-900 text-white space-y-10 shadow-2xl border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                    <ShieldCheck size={28} />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight">Encryption & Delivery Node</h3>
                                    <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mt-1">Real-time Delivery Intelligence</p>
                                </div>
                            </div>

                            {loading ? (
                                <div className="flex justify-center py-6">
                                    <ZLoader size="md" text="Loading delivery telemetry..." />
                                </div>
                            ) : null}
                            {errorMessage !== null && !hasTutorData ? (
                                <div className="p-4 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100 text-sm font-bold">
                                    Metrics offline: {errorMessage}. <button onClick={() => { setLoading(true); void fetchTutorMetrics(); }} className="underline">Retry</button>
                                </div>
                            ) : null}
                            {!loading && !hasError && hasTutorData ? (
                                <div className="space-y-8">
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-6 bg-white/5 p-8 rounded-3xl border border-white/10">
                                            <div className="flex items-center gap-3 text-orange-400">
                                                <BarChart3 size={20} />
                                                <h4 className="text-sm font-black uppercase tracking-widest">Material Demand</h4>
                                            </div>
                                            {notesDemandOption ? (
                                                <BaseChart option={notesDemandOption} height={300} />
                                            ) : (
                                                <p className="text-[11px] font-bold text-slate-300">Data unavailable.</p>
                                            )}
                                        </div>
                                        <div className="space-y-6 bg-white/5 p-8 rounded-3xl border border-white/10">
                                            <div className="flex items-center gap-3 text-blue-400">
                                                <PieChartIcon size={20} />
                                                <h4 className="text-sm font-black uppercase tracking-widest">System Health</h4>
                                            </div>
                                            {emailHealthOption ? (
                                                <BaseChart option={emailHealthOption} height={300} />
                                            ) : (
                                                <p className="text-[11px] font-bold text-slate-300">Data unavailable.</p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div className="space-y-6 bg-white/5 p-8 rounded-3xl border border-white/10">
                                            <div className="flex items-center gap-3 text-rose-400">
                                                <TrendingDown size={20} />
                                                <h4 className="text-sm font-black uppercase tracking-widest">Mastery Gaps</h4>
                                            </div>
                                            {weakTopicsOption ? (
                                                <BaseChart option={weakTopicsOption} height={300} />
                                            ) : (
                                                <p className="text-[11px] font-bold text-slate-300">Data unavailable.</p>
                                            )}
                                        </div>
                                        <div className="h-full flex flex-col justify-center gap-4 text-center p-8">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Protocol Status</p>
                                            <div className="flex items-center justify-center gap-3">
                                                <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                                                <span className="text-3xl font-black tracking-tighter uppercase whitespace-nowrap">Node_Synchronized</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        <InsightGuideCard {...notesSecurityGuide} />
                    </div>
                </div>
            )}
        </div>
    );
}
