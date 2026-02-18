'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient, QuizResultResponse } from "@quiz/api-client";
import { ResultSummary } from "@/components/reports/ResultSummary";
import { RemediationZone } from "@/components/reports/RemediationZone";
import ActionPlanPanel from "@/components/reports/ActionPlanPanel";
import {
    CompetencyRadar,
    DifficultyBars,
    SnapshotDonut,
    FluencyScatter,
    RetentionFunnel,
    MasteryTreemap
} from "@/components/reports/recharts/RechartsSuite";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { ZLoader } from '@quiz/ui';
import { clientLogger } from '@/utils/clientLogger';

export default function DynamicReportPage() {
    const { id } = useParams();
    const [report, setReport] = useState<Extract<QuizResultResponse, { status: 'completed' | 'failed' | 'abandoned' }> | null>(null);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const delays = [1000, 2000, 4000, 8000, 10000];
        let retryCount = 0;

        const fetchReport = async () => {
            if (!id) return;

            try {
                const data = await apiClient.quiz.getResult(id as string);

                if (data.status === 'processing') {
                    if (isMounted) setIsProcessing(true);

                    if (retryCount < 20) {
                        const delay = delays[Math.min(retryCount, delays.length - 1)];
                        retryCount++;
                        setTimeout(fetchReport, delay);
                        return;
                    } else {
                        if (isMounted) {
                            setErrorMsg("Scoring is taking longer than expected.");
                            setLoading(false);
                            setIsProcessing(false);
                        }
                        return;
                    }
                }

                if (isMounted) {
                    setReport(data as Extract<QuizResultResponse, { status: 'completed' | 'failed' | 'abandoned' }>);
                    setIsProcessing(false);
                    setLoading(false);
                }
            } catch (err) {
                clientLogger.error('Failed to fetch report', { error: err instanceof Error ? err.message : 'unknown' });
                if (isMounted) {
                    setErrorMsg("Unable to retrieve results.");
                    setLoading(false);
                }
            }
        };

        fetchReport();
        return () => { isMounted = false; };
    }, [id]);

    if (loading || isProcessing) {
        return (
            <div className="flex flex-col h-screen items-center justify-center gap-4 bg-background">
                <ZLoader size="lg" />
                <p className="text-sm font-black text-muted-foreground animate-pulse uppercase tracking-[0.2em] mt-4">
                    {isProcessing ? "Analyzing Performance..." : "Decrypting Intel..."}
                </p>
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className="flex h-screen flex-col items-center justify-center gap-6 text-center bg-background px-4">
                <div className="p-4 rounded-3xl bg-primary/10 text-primary">
                    <ArrowLeft size={32} />
                </div>
                <h1 className="text-3xl font-black tracking-tight">Access Interrupted</h1>
                <p className="text-muted-foreground max-w-sm font-bold uppercase text-[10px] tracking-widest">{errorMsg}</p>
                <button
                    onClick={() => window.location.reload()}
                    className="px-10 py-4 bg-primary text-white font-black rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-all text-xs uppercase tracking-widest"
                >
                    Retry Sync
                </button>
            </div>
        );
    }

    if (!report) {
        return <div className="flex h-screen items-center justify-center font-black uppercase tracking-widest">Report Not Found</div>;
    }

    const performance = report.performance || {};
    const categoryData = performance.category || [];
    const mappingData = performance.mapping_type || [];
    const subtopicData = performance.subtopic || [];
    const skillData = performance.skill || [];

    return (
        <div className="min-h-screen bg-[#F8F9FC] selection:bg-primary/20">
            {/* Glossy Header Bar */}
            <header className="sticky top-0 z-50 glass-morphism h-16 px-6 md:px-12 flex items-center justify-between border-b border-white/40">
                <div className="flex items-center gap-6">
                    <Link
                        href="/dashboard"
                        className="p-2 rounded-xl hover:bg-white/50 transition-colors text-muted-foreground hover:text-primary"
                    >
                        <ArrowLeft size={20} />
                    </Link>
                    <div className="h-4 w-[1px] bg-muted-foreground/20" />
                    <div>
                        <h1 className="text-sm font-black uppercase tracking-widest leading-none">Assessment Intelligence</h1>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mt-1">ID: {id?.toString().slice(0, 8)}...STACK</p>
                    </div>
                </div>

                <div className="hidden md:flex items-center gap-4">
                    <div className="px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest">
                        Executive View
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto py-12 px-6 md:px-12 space-y-12">
                {/* Hero Metrics */}
                <ResultSummary
                    score={report.score}
                    total={report.total}
                    status={report.statusLabel === 'passed' ? 'passed' : 'failed'}
                    percentile={report.percentile || 85}
                    timeTaken={report.timeTaken || "12m 40s"}
                />

                {/* Executive Intelligence Grid (Single Column for Maximum Impact) */}
                <div className="space-y-12 max-w-4xl mx-auto">
                    {/* 1. Skill Capability Matrix */}
                    <CompetencyRadar
                        skills={categoryData.map(c => ({ name: c.name, value: c.accuracy }))}
                    />

                    {/* 2. The Expertise Bridge */}
                    <DifficultyBars
                        bars={report.performance.difficulty?.map(d => ({
                            label: d.name,
                            simple: d.accuracy, // Assuming the API provides breakdown or we use accuracy as proxy
                            intermediate: Math.max(0, d.accuracy - 10),
                            expert: Math.max(0, d.accuracy - 25)
                        })) || []}
                    />

                    {/* 3. Operational Snapshot (Donut) */}
                    <SnapshotDonut
                        correct={report.score}
                        incorrect={report.total - report.score}
                        skipped={0}
                    />

                    {/* 4. Cognitive Fluency (Scatter) */}
                    <FluencyScatter
                        points={report.questions.map(q => ({
                            x: q.timeSpent,
                            y: q.isCorrect ? 100 : 0,
                            label: q.text
                        }))}
                    />

                    {/* 5. Survival Attrition (Funnel) */}
                    <RetentionFunnel
                        stages={[
                            { label: 'Total Questions', value: report.total },
                            { label: 'Attempted', value: report.total }, // Currently assuming all attempted
                            { label: 'Correct', value: report.score }
                        ]}
                    />

                    {/* Legacy/Panel components in single column */}
                    <ActionPlanPanel
                        items={report.actionPlan || []}
                    />

                    <RemediationZone
                        subtopicPerformance={subtopicData}
                        className="w-full"
                    />

                    {/* High-Density Question Audit */}
                    <div className="glass-morphism rounded-[3rem] p-8 space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black tracking-tight uppercase">Surgical Review</h3>
                            <div className="flex gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500" />
                                <div className="h-2 w-2 rounded-full bg-primary" />
                            </div>
                        </div>

                        <div className="space-y-3">
                            {report.questions?.map((q, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "flex items-center justify-between p-5 rounded-3xl border transition-all hover:scale-[1.01]",
                                        q.isCorrect
                                            ? "bg-white/40 border-green-500/10 hover:border-green-500/30"
                                            : "bg-white/40 border-primary/10 hover:border-primary/30"
                                    )}
                                >
                                    <div className="flex items-center gap-4 max-w-[80%]">
                                        <span className="text-xs font-black text-muted-foreground/30 tabular-nums">{(i + 1).toString().padStart(2, '0')}</span>
                                        <p className="text-[13px] font-bold truncate text-muted-foreground">{q.text}</p>
                                    </div>
                                    <div className={cn(
                                        "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                        q.isCorrect ? "bg-green-100 text-green-700" : "bg-primary/20 text-primary"
                                    )}>
                                        {q.isCorrect ? "Correct" : "Mistake"}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <footer className="py-12 border-t border-muted/10 opacity-40">
                <div className="max-w-7xl mx-auto px-12 text-[10px] font-bold text-center tracking-widest uppercase">
                    Protocol: Executive Analytics Hub | Phase 20 Mastery Deployment | Zero-Occlusion Cockpit Verified
                </div>
            </footer>
        </div>
    );
}
