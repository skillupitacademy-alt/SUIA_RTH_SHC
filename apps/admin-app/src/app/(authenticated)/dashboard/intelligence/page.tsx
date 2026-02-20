'use client';

import { ZLoader } from "@quiz/ui";
import {
    Activity,
    BarChart3,
    BrainCircuit,
    Layers,
    LayoutDashboard,
    Microscope,
    PieChart as PieChartIcon,
    ShieldCheck,
    TrendingDown,
    Wrench
} from "lucide-react";
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

    const tabs: { key: typeof activeTab; label: string, icon: React.ReactNode }[] = [
        { key: "command", label: "Command", icon: <Wrench size={14} /> },
        { key: "audit", label: "Audit", icon: <Microscope size={14} /> },
        { key: "cohort", label: "Cohort", icon: <Layers size={14} /> },
        { key: "telemetry", label: "Telemetry", icon: <Activity size={14} /> },
    ];
    const hasError = typeof error === "string" && error.length > 0;
    const hasTutorData = tutorData !== null;
    const errorMessage = hasError ? (error as string) : null;

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

            {/* Tabs Container */}
            <div className="flex justify-center md:justify-start">
                <div className="inline-flex items-center p-1.5 bg-slate-100/50 border border-slate-200 rounded-3xl shadow-sm backdrop-blur-sm">
                    {tabs.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`flex items-center gap-2 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeTab === tab.key
                                ? "bg-slate-900 text-white shadow-lg shadow-slate-900/20"
                                : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
                                }`}
                        >
                            {tab.icon}
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="mt-12">
                {activeTab === "command" ? (
                    <div className="space-y-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Repair Station */}
                        <div className="space-y-8">
                            <BrokenQuestionsRepairStation />
                        </div>

                        {/* Pool Sufficiency */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
                                    <PieChartIcon size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em]">Resources Protocol</p>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Pool Sufficiency Gauge</h3>
                                </div>
                            </div>
                            <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 max-w-[1400px] mx-auto overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                                <AdminPoolSufficiency />
                            </div>
                            <InsightGuideCard {...poolGaugeGuide} />
                        </div>
                    </div>
                ) : null}

                {activeTab === "audit" ? (
                    <div className="space-y-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Item Difficulty */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/20">
                                    <BarChart3 size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Quality Protocol</p>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Item Difficulty Distribution</h3>
                                </div>
                            </div>
                            <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 max-w-[1400px] mx-auto overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                                <AdminItemDifficultyChart />
                            </div>
                            <InsightGuideCard {...itemDifficultyGuide} />
                        </div>

                        {/* Discrimination */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
                                    <TrendingDown size={20} className="rotate-180" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Separation Protocol</p>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Discrimination Analysis</h3>
                                </div>
                            </div>
                            <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 max-w-[1400px] mx-auto overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                                <AdminDiscriminationScatter />
                            </div>
                            <InsightGuideCard {...discriminationGuide} />
                        </div>

                        {/* Planned vs Actual */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/20">
                                    <LayoutDashboard size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-violet-600 uppercase tracking-[0.3em]">Calibration Protocol</p>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Planned vs Actual Variance</h3>
                                </div>
                            </div>
                            <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 max-w-[1400px] mx-auto overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                                <AdminPlannedVsActualDifficulty />
                            </div>
                            <InsightGuideCard {...plannedVsActualGuide} />
                        </div>
                    </div>
                ) : null}

                {activeTab === "cohort" ? (
                    <div className="space-y-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Score Distribution */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 rounded-2xl bg-orange-600 text-white shadow-lg shadow-orange-600/20">
                                    <TrendingDown size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-orange-600 uppercase tracking-[0.3em]">Cohort Protocol</p>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Examination Score Distribution</h3>
                                </div>
                            </div>
                            <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 max-w-[1400px] mx-auto overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                                <AdminScoreHistogram />
                            </div>
                            <InsightGuideCard {...scoreHistogramGuide} />
                        </div>

                        {/* Heatmap */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 rounded-2xl bg-blue-500 text-white shadow-lg shadow-blue-500/20">
                                    <Layers size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-[0.3em]">Competency Protocol</p>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Topic-Skill Mastery Heatmap</h3>
                                </div>
                            </div>
                            <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 max-w-[1400px] mx-auto overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                                <AdminTopicSkillHeatmap />
                            </div>
                            <InsightGuideCard {...topicSkillHeatmapGuide} />
                        </div>
                    </div>
                ) : null}

                {activeTab === "telemetry" ? (
                    <div className="space-y-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Help Queue */}
                        <div className="space-y-8">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 rounded-2xl bg-emerald-500 text-white shadow-lg shadow-emerald-500/20">
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Support Protocol</p>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Live Help Queue Manager</h3>
                                </div>
                            </div>
                            <div className="bg-white p-12 rounded-[2.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 max-w-[1400px] mx-auto overflow-hidden group hover:-translate-y-1 transition-all duration-300">
                                <HelpRequestManager />
                            </div>
                            <InsightGuideCard {...helpQueueGuide} />
                        </div>

                        {/* Notes Security & Delivery */}
                        <div className="max-w-[1400px] mx-auto space-y-8">
                            <div className="flex items-center gap-4 mb-2">
                                <div className="p-3 rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/20 border border-white/10">
                                    <ShieldCheck size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Systems Protocol</p>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Encryption & Delivery Node</h3>
                                </div>
                            </div>
                            <div className="p-12 rounded-[2.5rem] bg-slate-900 text-white space-y-10 shadow-2xl border border-white/5 relative overflow-hidden">
                                {loading ? (
                                    <div className="absolute inset-0 z-10 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center">
                                        <ZLoader size="md" text="Synchronizing Telemetry..." />
                                    </div>
                                ) : null}

                                {errorMessage !== null && !hasTutorData ? (
                                    <div className="p-4 rounded-2xl bg-rose-500/10 text-rose-400 border border-rose-500/20 text-sm font-bold">
                                        Metrics offline: {errorMessage}. <button onClick={() => { setLoading(true); void fetchTutorMetrics(); }} className="underline">Retry</button>
                                    </div>
                                ) : (
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
                                            <div className="h-full flex flex-col justify-center gap-4 text-center p-8 bg-white/5 rounded-3xl border border-white/10">
                                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Protocol Status</p>
                                                <div className="flex items-center justify-center gap-3">
                                                    <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                                                    <span className="text-2xl lg:text-3xl font-black tracking-tighter uppercase whitespace-nowrap">Node_Synchronized</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <InsightGuideCard {...notesSecurityGuide} />
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    );
}
