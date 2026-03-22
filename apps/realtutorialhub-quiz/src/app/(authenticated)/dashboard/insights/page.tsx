'use client';

import { useDashboardStore } from "@/store/dashboard-store";
import { useState, useCallback, useEffect } from "react";
import { ZLoader } from "@quiz/ui";
import { Telescope } from "lucide-react";
import dynamic from "next/dynamic";

const ScoreHistoryChart = dynamic(() => import("@/components/charts/ScoreHistoryChart"), { loading: () => <div className="h-64 w-full bg-slate-50 animate-pulse rounded-[2.5rem]" />, ssr: false });
const MasteryTrendChart = dynamic(() => import("@/components/charts/MasteryTrendChart"), { loading: () => <div className="h-64 w-full bg-slate-50 animate-pulse rounded-[2.5rem]" />, ssr: false });
const TopicPerformanceHeatmap = dynamic(() => import("@/components/charts/TopicPerformanceHeatmap"), { loading: () => <div className="h-64 w-full bg-slate-50 animate-pulse rounded-[2.5rem]" />, ssr: false });
const WeaknessTreeChart = dynamic(() => import("@/components/charts/WeaknessTreeChart"), { loading: () => <div className="h-64 w-full bg-slate-50 animate-pulse rounded-[2.5rem]" />, ssr: false });
const PersonalTimeBoxplot = dynamic(() => import("@/components/charts/PersonalTimeBoxplot"), { loading: () => <div className="h-64 w-full bg-slate-50 animate-pulse rounded-[2.5rem]" />, ssr: false });
const PersonalDifficultySplit = dynamic(() => import("@/components/charts/PersonalDifficultySplit"), { loading: () => <div className="h-64 w-full bg-slate-50 animate-pulse rounded-[2.5rem]" />, ssr: false });
import { InsightGuideCard } from "@/components/insights/InsightGuideCard";
import { ScoreHistoryResponse, MasteryTrendResponse, TutorInsight } from "@quiz/api-client";
import {
    scoreHistoryGuide,
    masteryTrendGuide,
    topicHeatmapGuide,
    weaknessTreeGuide,
    timeBoxplotGuide,
    difficultySplitGuide
} from "@/components/insights/guides";

export default function UserInsightsPage() {
    const { data, fetchDashboard, loading } = useDashboardStore();
    const [performanceInsight, setPerformanceInsight] = useState<TutorInsight | null>(null);
    const [masteryInsight, setMasteryInsight] = useState<TutorInsight | null>(null);

    useEffect(() => {
        fetchDashboard('7d', 1, 3);
    }, [fetchDashboard]);

    const handleScoreHistoryFetched = useCallback((res: ScoreHistoryResponse) => {
        if (res.insight) setPerformanceInsight(res.insight);
    }, []);

    const handleMasteryTrendFetched = useCallback((res: MasteryTrendResponse) => {
        if (res.insight) setMasteryInsight(res.insight);
    }, []);

    if (!data && loading) {
        return (
            <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-muted/5">
                <ZLoader size="xl" text="Synthesizing Insights..." />
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-20">
            {/* Header */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3 text-pink-600">
                    <div className="p-2 rounded-xl bg-pink-100/50">
                        <Telescope size={24} strokeWidth={2.5} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-[0.4em]">Intelligence Matrix</span>
                </div>
                <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Learning Insights</h1>
                <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest leading-relaxed max-w-2xl">
                    A deep dive into your neural progress. Interpret the patterns, optimize the study path.
                </p>
            </div>

            <div className="space-y-24">
                {/* 1. Score History */}
                <div className="space-y-4">
                    <ScoreHistoryChart onDataFetched={handleScoreHistoryFetched} />
                    <InsightGuideCard
                        {...scoreHistoryGuide}
                        insight={performanceInsight || undefined}
                    />
                </div>

                {/* 2. Mastery Trend */}
                <div className="space-y-4">
                    <MasteryTrendChart onDataFetched={handleMasteryTrendFetched} />
                    <InsightGuideCard
                        {...masteryTrendGuide}
                        insight={masteryInsight || undefined}
                    />
                </div>

                {/* 3. Topic Performance */}
                <div className="space-y-4">
                    <TopicPerformanceHeatmap />
                    <InsightGuideCard {...topicHeatmapGuide} />
                </div>

                {/* 4. Weakness Tree */}
                <div className="space-y-4">
                    <WeaknessTreeChart />
                    <InsightGuideCard {...weaknessTreeGuide} />
                </div>

                {/* 5. Time per Question */}
                <div className="space-y-4">
                    <PersonalTimeBoxplot />
                    <InsightGuideCard {...timeBoxplotGuide} />
                </div>

                {/* 6. Difficulty Accuracy Split */}
                <div className="space-y-4">
                    <PersonalDifficultySplit />
                    <InsightGuideCard {...difficultySplitGuide} />
                </div>
            </div>
        </div>
    );
}
