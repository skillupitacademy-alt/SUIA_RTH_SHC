'use client';

import React from 'react';
import dynamic from "next/dynamic";
import { motion, Variants } from "framer-motion";
import { Card } from "../ui/card";
import { ZLoader } from "@quiz/ui";

// Multi-ring radial KPI
const RadialKPI = dynamic(() => import("./RadialKPI").then(mod => mod.RadialKPI), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-slate-950/20 animate-pulse rounded-[2.5rem]" />
});

// Subtopic accuracy horizontal bar
const SubtopicBarChart = dynamic(() => import("./SubtopicBarChart").then(mod => mod.SubtopicBarChart), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-slate-950/20 animate-pulse rounded-3xl" />
});

// Skill distribution doughnut
const SkillDonutChart = dynamic(() => import("./SkillDonutChart").then(mod => mod.SkillDonutChart), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-slate-950/20 animate-pulse rounded-3xl" />
});

// Subtopic x Difficulty heatmap
const HeatmapGrid = dynamic(() => import("./HeatmapGrid").then(mod => mod.HeatmapGrid), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-slate-950/20 animate-pulse rounded-3xl" />
});

// Difficulty ladder vertical bar
const DifficultyBarChart = dynamic(() => import("./DifficultyBarChart").then(mod => mod.DifficultyBarChart), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-slate-950/20 animate-pulse rounded-3xl" />
});

// AI recommendation side panel
const AIRecommendationPanel = dynamic(() => import("./AIRecommendationPanel").then(mod => mod.AIRecommendationPanel), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-indigo-950/20 animate-pulse rounded-[2.5rem]" />
});

export interface ExamReport {
    score: number;
    mastery: number;
    readiness: number;
    subtopics: { name: string; accuracy: number }[];
    skills: { name: string; accuracy: number }[];
    difficulty: { level: string; accuracy: number }[];
    heatmap: { subtopic: string; difficulty: string; accuracy: number }[];
    ai: {
        status: "READY" | "BORDERLINE" | "NOT_READY";
        actions: string[];
        weakest_subtopic: string;
        weakest_skill: string;
    };
}

export interface ExamReportLayoutProps {
    data: ExamReport;
    loading?: boolean;
}

const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.2
        }
    }
};

const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: {
        opacity: 1,
        y: 0,
        transition: {
            type: 'spring',
            stiffness: 100,
            damping: 20
        }
    }
};

export function ExamReportLayout({ data, loading }: ExamReportLayoutProps) {
    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
                <ZLoader />
                <motion.p
                    className="mt-8 text-[11px] font-black text-slate-500 tracking-[0.4em] uppercase"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0, 1, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    Synthesizing Personal Neural Matrix...
                </motion.p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 p-4 md:p-8 lg:p-12 selection:bg-indigo-500/30">
            <motion.div
                className="max-w-[1600px] mx-auto grid grid-cols-12 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="show"
            >
                {/* KPI Rings */}
                <motion.div className="col-span-12 lg:col-span-4" variants={itemVariants}>
                    <Card className="h-full rounded-[2.5rem] overflow-hidden shadow-2xl border-white/5">
                        <RadialKPI data={data} />
                    </Card>
                </motion.div>

                {/* Subtopic Diagnostic */}
                <motion.div className="col-span-12 lg:col-span-4" variants={itemVariants}>
                    <Card className="h-full rounded-3xl overflow-hidden shadow-2xl border-white/5">
                        <SubtopicBarChart data={data.subtopics} weakest={data.ai.weakest_subtopic} />
                    </Card>
                </motion.div>

                {/* Skill Matrix */}
                <motion.div className="col-span-12 lg:col-span-4" variants={itemVariants}>
                    <Card className="h-full rounded-3xl overflow-hidden shadow-2xl border-white/5">
                        <SkillDonutChart data={data.skills} />
                    </Card>
                </motion.div>

                {/* Heatmap Matrix */}
                <motion.div className="col-span-12" variants={itemVariants}>
                    <Card className="w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-white/5">
                        <HeatmapGrid data={data.heatmap} />
                    </Card>
                </motion.div>

                {/* Difficulty Ladder */}
                <motion.div className="col-span-12 lg:col-span-8" variants={itemVariants}>
                    <Card className="h-full rounded-3xl overflow-hidden shadow-2xl border-white/5">
                        <DifficultyBarChart data={data.difficulty} />
                    </Card>
                </motion.div>

                {/* AI Recommendations */}
                <motion.div className="col-span-12 lg:col-span-4" variants={itemVariants}>
                    <AIRecommendationPanel ai={data.ai} />
                </motion.div>
            </motion.div>
        </div>
    );
}
