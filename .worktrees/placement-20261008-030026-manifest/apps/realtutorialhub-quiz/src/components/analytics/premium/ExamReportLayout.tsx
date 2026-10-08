'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { motion, Variants } from 'framer-motion';
import { PremiumExamReport } from '@/types/premium-report';
import { ZLoader } from '@quiz/ui';

// Dynamic Imports for Performance
const RadialKPI = dynamic(() => import('./RadialKPI').then(mod => mod.RadialKPI), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full bg-slate-900/40 rounded-[2.5rem] animate-pulse" />
});
const SubtopicBarChart = dynamic(() => import('./SubtopicBarChart').then(mod => mod.SubtopicBarChart), {
    ssr: false,
    loading: () => <div className="h-[350px] w-full bg-slate-900/60 rounded-3xl animate-pulse" />
});
const SkillDonutChart = dynamic(() => import('./SkillDonutChart').then(mod => mod.SkillDonutChart), {
    ssr: false,
    loading: () => <div className="h-[350px] w-full bg-slate-900/60 rounded-3xl animate-pulse" />
});
const HeatmapGrid = dynamic(() => import('./HeatmapGrid').then(mod => mod.HeatmapGrid), {
    ssr: false,
    loading: () => <div className="h-[450px] w-full bg-slate-900/60 rounded-3xl animate-pulse" />
});
const DifficultyBarChart = dynamic(() => import('./DifficultyBarChart').then(mod => mod.DifficultyBarChart), {
    ssr: false,
    loading: () => <div className="h-[350px] w-full bg-slate-900/60 rounded-3xl animate-pulse" />
});
const AIRecommendationPanel = dynamic(() => import('./AIRecommendationPanel').then(mod => mod.AIRecommendationPanel), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-indigo-950/20 rounded-[2.5rem] animate-pulse" />
});

export interface ExamReportLayoutProps {
    report: PremiumExamReport;
    loading?: boolean;
}

const MemoizedRadialKPI = React.memo(RadialKPI);
const MemoizedSubtopicBarChart = React.memo(SubtopicBarChart);
const MemoizedSkillDonutChart = React.memo(SkillDonutChart);
const MemoizedHeatmapGrid = React.memo(HeatmapGrid);
const MemoizedDifficultyBarChart = React.memo(DifficultyBarChart);
const MemoizedAIRecommendationPanel = React.memo(AIRecommendationPanel);

export function ExamReportLayout({ report, loading }: ExamReportLayoutProps) {
    // Precompute data transforms
    const containerVariants: Variants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1,
                delayChildren: 0.3
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, y: 30 },
        show: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 100, damping: 15 } as const
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-8 text-center space-y-6">
                <ZLoader size="xl" text="Synthesizing Personal Neural Matrix..." />
                <div className="space-y-2">
                    <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.4em] animate-pulse">
                        Calibrating cognitive performance vectors…
                    </p>
                    <p className="text-slate-600 font-medium text-[8px] uppercase tracking-widest opacity-50">
                        Processing sub-topic difficulty cross-referencing
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 lg:p-12 font-sans selection:bg-indigo-500/30">
            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="max-w-7xl mx-auto space-y-12"
            >
                {/* HERO SECTION */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
                    <motion.div variants={itemVariants} className="lg:col-span-8">
                        <MemoizedRadialKPI
                            score={report.score}
                            mastery={report.mastery}
                            readiness={report.readiness}
                            status={report.ai.status}
                        />
                    </motion.div>

                    <motion.div variants={itemVariants} className="lg:col-span-4 h-full">
                        <MemoizedAIRecommendationPanel data={report.ai} />
                    </motion.div>
                </section>

                {/* DIAGNOSTIC ROW */}
                <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
                    <motion.div variants={itemVariants} className="lg:col-span-3">
                        <MemoizedSubtopicBarChart data={report.subtopics} />
                    </motion.div>
                    <motion.div variants={itemVariants} className="lg:col-span-2">
                        <MemoizedSkillDonutChart data={report.skills} />
                    </motion.div>
                </section>

                {/* DATA MATRIX ROW */}
                <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <motion.div variants={itemVariants} className="lg:col-span-8">
                        <MemoizedHeatmapGrid data={report.heatmap} />
                    </motion.div>
                    <motion.div variants={itemVariants} className="lg:col-span-4">
                        <MemoizedDifficultyBarChart data={report.difficulty} />
                    </motion.div>
                </section>

                {/* FOOTER METRICS */}
                <motion.footer
                    variants={itemVariants}
                    className="pt-12 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-6"
                >
                    <div className="flex items-center gap-6">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Exam Reference</span>
                            <span className="text-sm font-bold text-slate-400">{report.examId}</span>
                        </div>
                        <div className="h-8 w-[1px] bg-slate-900" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Neural Calibration</span>
                            <span className="text-sm font-bold text-slate-400">V.2.4.0_Stable</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Operational Status: Optimal</span>
                    </div>
                </motion.footer>
            </motion.div>
        </div>
    );
}
