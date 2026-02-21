'use client';

import ScoreHistoryChart from "@/components/charts/ScoreHistoryChart";
import MasteryTrendChart from "@/components/charts/MasteryTrendChart";
import TopicPerformanceHeatmap from "@/components/charts/TopicPerformanceHeatmap";
import WeaknessTreeChart from "@/components/charts/WeaknessTreeChart";
import PersonalTimeBoxplot from "@/components/charts/PersonalTimeBoxplot";
import PersonalDifficultySplit from "@/components/charts/PersonalDifficultySplit";
import { useDashboardStore } from "@/store/dashboard-store";
import { useEffect } from "react";
import { ZLoader } from "@quiz/ui";
import { Telescope } from "lucide-react";
import { InsightGuideCard } from "@/components/insights/InsightGuideCard";
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

    useEffect(() => {
        fetchDashboard('7d', 1, 3);
    }, [fetchDashboard]);

    if (!data && loading) {
        return (
            <div className="flex h-[calc(100vh-64px)] items-center justify-center bg-muted/5">
                <ZLoader size="xl" text="Synthesizing Insights..." />
            </div>
        );
    }

    return (
        <div className="space-y-12">
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
                    <ScoreHistoryChart />
                    <InsightGuideCard {...scoreHistoryGuide} />
                </div>

                {/* 2. Mastery Trend */}
                <div className="space-y-4">
                    <MasteryTrendChart />
                    <InsightGuideCard {...masteryTrendGuide} />
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
