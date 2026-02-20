'use client';

import { ZLoader } from "@quiz/ui";
import { BarChart3, BrainCircuit, PieChart as PieChartIcon, ShieldCheck, TrendingDown } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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

    const fetchTutorMetrics = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/metrics/tutor');
            if (res.ok) {
                const json: TutorMetrics = await res.json();
                setTutorData(json);
            }
        } catch (err) {
            console.error('Failed to fetch tutor analytics', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchTutorMetrics();
    }, [fetchTutorMetrics]);

    if (loading || !tutorData) {
        return (
            <div className="flex h-screen items-center justify-center">
                <ZLoader size="xl" text="Orchestrating Global Intelligence..." />
            </div>
        );
    }

    const notesDemandOption = {
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
    };

    const emailHealthOption = {
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
    };

    const weakTopicsOption = {
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
    };

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

            <div className="space-y-40">
                {/* 1. Score Distribution */}
                <div className="space-y-8">
                    <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 max-w-[1400px] mx-auto overflow-hidden">
                        <AdminScoreHistogram />
                    </div>
                    <InsightGuideCard {...scoreHistogramGuide} />
                </div>

                {/* 2. Item Difficulty */}
                <div className="space-y-8">
                    <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 max-w-[1400px] mx-auto overflow-hidden">
                        <AdminItemDifficultyChart />
                    </div>
                    <InsightGuideCard {...itemDifficultyGuide} />
                </div>

                {/* 3. Discrimination */}
                <div className="space-y-8">
                    <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 max-w-[1400px] mx-auto overflow-hidden">
                        <AdminDiscriminationScatter />
                    </div>
                    <InsightGuideCard {...discriminationGuide} />
                </div>

                {/* 4. Planned vs Actual */}
                <div className="space-y-8">
                    <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 max-w-[1400px] mx-auto overflow-hidden">
                        <AdminPlannedVsActualDifficulty />
                    </div>
                    <InsightGuideCard {...plannedVsActualGuide} />
                </div>

                {/* 5. Pool Sufficiency */}
                <div className="space-y-8">
                    <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 max-w-[1400px] mx-auto overflow-hidden">
                        <AdminPoolSufficiency />
                    </div>
                    <InsightGuideCard {...poolGaugeGuide} />
                </div>

                {/* 6. Heatmap */}
                <div className="space-y-8">
                    <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 max-w-[1400px] mx-auto overflow-hidden">
                        <AdminTopicSkillHeatmap />
                    </div>
                    <InsightGuideCard {...topicSkillHeatmapGuide} />
                </div>

                {/* 7. Help Queue */}
                <div className="space-y-8">
                    <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-xl shadow-slate-200/20 max-w-[1400px] mx-auto overflow-hidden">
                        <HelpRequestManager />
                    </div>
                    <InsightGuideCard {...helpQueueGuide} />
                </div>

                {/* Content Repair Console */}
                <div className="space-y-8 py-20 border-t border-slate-100">
                    <div className="text-center space-y-2 mb-12">
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Diagnostic Summary</h2>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.3em]">Operational Readiness & Content Reliability</p>
                    </div>
                    <BrokenQuestionsRepairStation />
                </div>

                {/* 8. Notes Security */}
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

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-6 bg-white/5 p-8 rounded-3xl border border-white/10">
                                <div className="flex items-center gap-3 text-orange-400">
                                    <BarChart3 size={20} />
                                    <h4 className="text-sm font-black uppercase tracking-widest">Material Demand</h4>
                                </div>
                                <BaseChart option={notesDemandOption} height={300} />
                            </div>
                            <div className="space-y-6 bg-white/5 p-8 rounded-3xl border border-white/10">
                                <div className="flex items-center gap-3 text-blue-400">
                                    <PieChartIcon size={20} />
                                    <h4 className="text-sm font-black uppercase tracking-widest">System Health</h4>
                                </div>
                                <BaseChart option={emailHealthOption} height={300} />
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-6 bg-white/5 p-8 rounded-3xl border border-white/10">
                                <div className="flex items-center gap-3 text-rose-400">
                                    <TrendingDown size={20} />
                                    <h4 className="text-sm font-black uppercase tracking-widest">Mastery Gaps</h4>
                                </div>
                                <BaseChart option={weakTopicsOption} height={300} />
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

                    <InsightGuideCard {...notesSecurityGuide} />
                </div>
            </div>
        </div>
    );
}
