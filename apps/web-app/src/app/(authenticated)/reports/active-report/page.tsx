'use client';

import { useEffect, useState, Suspense } from "react";
import { ResultSummary } from "@/components/reports/ResultSummary";
import { PerformanceBreakdown } from "@/components/reports/PerformanceBreakdown";
import { SkillHeatmap } from "@/components/reports/SkillHeatmap";
import { MappingTrinity } from "@/components/reports/MappingTrinity";
import { BehavioralRadar } from "@/components/reports/BehavioralRadar";
import { EfficiencyQuadrant } from "@/components/reports/EfficiencyQuadrant";
import { RemediationZone } from "@/components/reports/RemediationZone";
import ActionPlanPanel from "@/components/reports/ActionPlanPanel";
import {
    RetentionFunnel,
    MasterySunburst,
    LearningVelocity,
    CompetencyRadar,
    DifficultyBars,
    SnapshotDonut,
    FluencyScatter
} from "@/components/reports/recharts/RechartsSuite";
import { ArrowLeft, Download, Share2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { ActionPlanItem, apiClient } from "@quiz/api-client";
import { cn } from "@/lib/utils";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuthStore } from "@/store/auth-store";
import { clientLogger } from '@/utils/clientLogger';

type PerformanceEntry = { id?: string; name?: string; score?: number; accuracy?: number };
type ReportQuestion = {
    id: string;
    questionText: string;
    text: string;
    userAnswer: string | null;
    correctAnswer?: string;
    isCorrect: boolean;
    timeSpent: number;
};

type ReportViewModel = {
    score: number;
    total: number;
    totalPercent: number;
    timeTaken: string;
    percentile: number;
    status: 'passed' | 'failed';
    topics: Array<{ name: string; score: number; total: number }>;
    difficulty: Array<{ level: string; accuracy: number }>;
    growthZones: Array<{ topic: string; suggestion: string }>;
    skillMatrix: Array<{ id: string; name: string; score: number; accuracy: number }>;
    behaviorRadar: Array<{ name: string; accuracy: number }>;
    knowledgeTrinity: Array<{ id: string; name: string; score: number; accuracy: number }>;
    subtopics: Array<{ id: string; name: string; score: number; accuracy: number }>;
    actionPlan: ActionPlanItem[];
    questions: ReportQuestion[];
};

function ReportContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const examId = searchParams.get('examId');
    const [reportData, setReportData] = useState<ReportViewModel | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;
        const delays = [1000, 2000, 4000, 8000, 10000];
        let retryCount = 0;

        const fetchReport = async () => {
            if (!isAuthenticated || !examId) {
                if (!examId && isMounted) router.push('/dashboard');
                return;
            }

            try {
                const data = await apiClient.quiz.getResult(examId);

                if (data.status === 'processing') {
                    if (isMounted) setIsProcessing(true);

                    if (retryCount < 20) { // Max ~2 mins
                        const delay = delays[Math.min(retryCount, delays.length - 1)];
                        retryCount++;
                        setTimeout(fetchReport, delay);
                        return;
                    } else {
                        if (isMounted) {
                            setErrorMsg("Scoring is taking longer than expected. Please check back in a few minutes.");
                            setIsLoading(false);
                            setIsProcessing(false);
                        }
                        return;
                    }
                }

                if (data.status === 'failed' || data.status === 'abandoned') {
                    if (isMounted) {
                        setErrorMsg(`The assessment session was ${data.status}.`);
                        setIsLoading(false);
                        setIsProcessing(false);
                    }
                    return;
                }

                // Narrow data to the report object (status: 'completed' etc)
                const report = data;

                // Map API data to UI format
                const mapPerformance = (
                    list: PerformanceEntry[] | undefined,
                    fallbackPrefix: string
                ) => (list || []).map((entry: PerformanceEntry, idx: number) => ({
                    id: entry.id ?? `${fallbackPrefix}-${idx}`,
                    name: entry.name ?? 'Unknown',
                    score: entry.score ?? Math.round(entry.accuracy ?? 0),
                    accuracy: Math.round(entry.accuracy ?? 0),
                }));

                const mappedData: ReportViewModel = {
                    score: report.score,
                    total: report.total,
                    totalPercent: Math.round(report.percentage),
                    timeTaken: report.timeTaken || "00:00",
                    percentile: report.percentile || 0,
                    status: (report.statusLabel || (report.percentage >= 70 ? 'passed' : 'failed')) as 'passed' | 'failed',
                    topics: (report.performance?.topic || []).map((t: PerformanceEntry) => ({
                        name: t.name || 'Unknown',
                        score: Math.round(t.accuracy ?? 0),
                        total: 100
                    })),
                    difficulty: (report.performance?.difficulty || []).map((d: PerformanceEntry) => ({
                        level: d.name ?? d.id ?? 'unknown',
                        accuracy: Math.round(d.accuracy ?? 0)
                    })),
                    growthZones: (report as { growthZones?: Array<{ topic: string; suggestion: string }> }).growthZones || [],

                    // Multi-Dimensional Mapping
                    skillMatrix: mapPerformance(report.performance?.skill, 'skill'),
                    behaviorRadar: (report.performance?.category || []).map((c: PerformanceEntry, idx: number) => ({
                        name: c.name ?? c.id ?? `category-${idx}`,
                        accuracy: Math.round(c.accuracy ?? 0),
                    })), // API uses 'category' for Technical/Cognitive/Process
                    knowledgeTrinity: mapPerformance(report.performance?.mapping_type, 'mapping'),
                    subtopics: mapPerformance(report.performance?.subtopic, 'subtopic'),
                    actionPlan: ((report as { actionPlan?: ActionPlanItem[] }).actionPlan || []).map((item, idx) => ({
                        id: item.id ?? `action-${idx}`,
                        priority: item.priority ?? 'growth',
                        label: item.label ?? 'Recommendation',
                        recommendation: item.recommendation ?? 'Focus on practice tasks to improve this area.',
                        skills: item.skills ?? ['Skill'],
                        accuracy: item.accuracy ?? 0,
                    })),

                    questions: ((report.questions as ReportQuestion[] | undefined) ?? []).map((q: ReportQuestion, idx: number) => ({
                        id: q.id || `q-${idx}`,
                        questionText: q.text ?? 'Question',
                        text: q.text ?? 'Question',
                        userAnswer: q.userAnswer,
                        correctAnswer: q.correctAnswer, // Sanitized by backend
                        isCorrect: q.isCorrect,
                        timeSpent: q.timeSpent || 0
                    }))
                };

                if (isMounted) {
                    setReportData(mappedData);
                    setIsProcessing(false);
                    setIsLoading(false);
                }
            } catch (err: unknown) {
                clientLogger.error('Failed to load report', { error: err instanceof Error ? err.message : 'unknown' });
                if (isMounted) {
                    setErrorMsg("Unable to retrieve report. Please ensure your assessment was submitted.");
                    setIsLoading(false);
                }
            }
        };

        fetchReport();
        return () => { isMounted = false; };
    }, [examId, router, isAuthenticated]);

    if (isLoading || isProcessing) {
        return (
            <div className="flex flex-col min-h-[calc(100vh-64px)] items-center justify-center bg-muted/5">
                <Loader2 className="animate-spin text-primary mb-4" size={48} />
                <p className="text-xl font-bold text-muted-foreground animate-pulse">
                    {isProcessing ? "\"Calculating your masteries... one second.\"" : "\"Mining your results...\""}
                </p>
                {isProcessing && (
                    <p className="text-sm text-muted-foreground mt-4">Scoring engine is currently processing your submission.</p>
                )}
            </div>
        );
    }

    if (errorMsg) {
        return (
            <div className="flex flex-col min-h-[calc(100vh-64px)] items-center justify-center bg-muted/5 p-6 text-center">
                <div className="bg-background p-12 rounded-[3rem] border-2 border-primary/20 shadow-2xl space-y-6 max-w-md">
                    <h2 className="text-2xl font-black uppercase">Assessment Update</h2>
                    <p className="text-muted-foreground font-medium leading-relaxed">{errorMsg}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full py-4 rounded-2xl bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 hover:scale-105 transition-transform"
                    >
                        RETRY STATUS CHECK
                    </button>
                    <Link href="/dashboard" className="block text-sm font-bold text-muted-foreground hover:text-primary underline">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    if (!reportData) return null;

    return (
        <AuthGuard>
            <div className="min-h-[calc(100vh-64px)] bg-muted/5 py-12 px-4 md:px-8 lg:px-12">
                <div className="w-full max-w-[95%] mx-auto space-y-12">
                    {/* Actions Header */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <Link
                            href="/dashboard"
                            className="group flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
                        >
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Back to Dashboard
                        </Link>
                        <div className="flex items-center gap-3">
                            <button className="flex items-center gap-2 px-6 py-2 rounded-xl border-2 font-bold hover:bg-background transition-colors text-sm">
                                <Share2 size={16} /> Share
                            </button>
                            <button className="flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20 hover:scale-105 transition-transform text-sm">
                                <Download size={16} /> Download PDF
                            </button>
                        </div>
                    </div>

                    {/* 1. Result Summary */}
                    <ResultSummary
                        score={reportData.score}
                        total={reportData.total}
                        timeTaken={reportData.timeTaken}
                        percentile={reportData.percentile}
                        status={reportData.status}
                    />

                    {/* 2. Performance Breakdown (Main Gauges) */}
                    <PerformanceBreakdown
                        topics={reportData.topics}
                        difficulty={reportData.difficulty}
                        growthZones={reportData.growthZones}
                    />

                    {/* Visualization Suite (single column) */}
                    <div className="space-y-8 mt-12">
                        <MasterySunburst
                            items={reportData.topics.slice(0, 12).map((t) => ({
                                name: t.name,
                                value: t.score,
                                fill: t.score >= 90 ? '#10b981' : t.score >= 50 ? '#fbbf24' : '#ef4444'
                            }))}
                        />

                        <CompetencyRadar
                            skills={reportData.skillMatrix.slice(0, 8).map((s) => ({
                                name: s.name,
                                value: s.accuracy ?? s.score ?? 0
                            }))}
                        />

                        <LearningVelocity
                            points={reportData.topics.slice(0, 10).map((t) => ({
                                label: t.name,
                                value: t.score || 0
                            }))}
                        />

                        <DifficultyBars
                            bars={reportData.topics.slice(0, 6).map((t) => ({
                                label: t.name,
                                simple: reportData.difficulty.find((d) => d.level?.toLowerCase().startsWith('simple'))?.accuracy ?? t.score ?? 0,
                                intermediate: reportData.difficulty.find((d) => d.level?.toLowerCase().startsWith('inter'))?.accuracy ?? t.score ?? 0,
                                expert: reportData.difficulty.find((d) => d.level?.toLowerCase().startsWith('expert'))?.accuracy ?? t.score ?? 0,
                            }))}
                        />

                        <SnapshotDonut
                            correct={reportData.questions.filter((q) => q.isCorrect).length}
                            incorrect={reportData.questions.filter((q) => !q.isCorrect).length}
                            skipped={reportData.questions.filter((q) => q.userAnswer == null || q.userAnswer === '').length}
                        />

                        <FluencyScatter
                            points={reportData.questions.slice(0, 40).map((q, idx) => ({
                                x: q.timeSpent || 0,
                                y: q.isCorrect ? 100 : 0,
                                label: `Q${idx + 1}`,
                                correct: q.isCorrect
                            }))}
                        />

                        <RetentionFunnel
                            stages={[
                                { label: 'Total', value: reportData.questions.length },
                                { label: 'Attempted', value: reportData.questions.filter((q) => q.userAnswer != null && q.userAnswer !== '').length },
                                { label: 'Correct', value: reportData.questions.filter((q) => q.isCorrect).length },
                            ]}
                        />
                    </div>

                    {/* 3. Skill Matrix Matrix */}
                    {reportData.skillMatrix.length > 0 && (
                        <SkillHeatmap data={reportData.skillMatrix} className="mt-12" />
                    )}

                    {/* 4. Behavioral & Knowledge Grids */}
                    <div className="grid gap-8 lg:grid-cols-2 mt-12">
                        {reportData.knowledgeTrinity.length > 0 && (
                            <MappingTrinity data={reportData.knowledgeTrinity} />
                        )}
                        {reportData.behaviorRadar.length > 0 && (
                            <BehavioralRadar data={reportData.behaviorRadar} />
                        )}
                    </div>

                    {/* 5. Efficiency Analysis */}
                    {reportData.questions?.some((q) => q.timeSpent > 0) && (
                        <div className="mt-12">
                            <EfficiencyQuadrant questions={reportData.questions} />
                        </div>
                    )}

                    {/* 6. Remediation Engine */}
                    {reportData.subtopics.length > 0 && (
                        <div className="mt-12">
                            <RemediationZone subtopicPerformance={reportData.subtopics} />
                        </div>
                    )}

                    {/* 7. Action Plan (Execution Plane) */}
                    {reportData.actionPlan.length > 0 && (
                        <div className="mt-12">
                            <ActionPlanPanel items={reportData.actionPlan} />
                        </div>
                    )}

                    {/* Question Audit Section */}
                    <section className="space-y-8 pt-12 mt-12 border-t border-slate-200">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <h3 className="text-3xl font-black tracking-tight text-slate-900 uppercase">Question Audit</h3>
                            <div className="flex gap-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 bg-slate-50 px-5 py-2 rounded-full border border-slate-200">
                                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm" /> Correct</div>
                                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-primary shadow-sm" /> Incorrect</div>
                            </div>
                        </div>

                        <div className="grid gap-6">
                            {reportData.questions?.map((q, idx: number) => (
                                <div key={q.id} className="p-8 rounded-[2.5rem] border bg-background shadow-sm space-y-6">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex gap-4">
                                            <div className={cn(
                                                "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 font-black",
                                                q.isCorrect ? "bg-green-100 text-green-700" : "bg-primary/10 text-primary"
                                            )}>
                                                {idx + 1}
                                            </div>
                                            <h4 className="text-lg font-bold leading-tight pt-1">{q.questionText}</h4>
                                        </div>
                                        <div className={cn(
                                            "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter shrink-0",
                                            q.isCorrect ? "bg-green-100 text-green-700" : "bg-primary/20 text-primary"
                                        )}>
                                            {q.isCorrect ? "Precision Hit" : "Critical Miss"}
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-muted/30 border border-muted/50">
                                            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mb-2">Your Answer</p>
                                            <p className={cn("font-bold text-sm", q.isCorrect ? "text-green-700" : "text-primary")}>
                                                {q.userAnswer || "No Answer"}
                                            </p>
                                        </div>
                                        {q.correctAnswer && !q.isCorrect && (
                                            <div className="p-4 rounded-2xl bg-green-50 border border-green-100">
                                                <p className="text-[10px] font-black uppercase text-green-600 tracking-widest mb-2">Recommended Correct</p>
                                                <p className="font-bold text-sm text-green-800">{q.correctAnswer}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Footer Advice */}
                    <div className="text-center pt-12 pb-24">
                        <p className="text-muted-foreground font-bold mb-6">
                            &quot;Your path to mastery is a marathon, not a sprint. Every identified weakness is a target for tomorrow&apos;s success.&quot;
                        </p>
                        <div className="flex justify-center gap-4">
                            <Link
                                href="/quiz/new"
                                className="px-8 py-4 rounded-3xl bg-secondary text-primary-foreground font-black shadow-xl shadow-secondary/20 hover:scale-[1.02] transition-transform"
                            >
                                Start Next Assessment
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
}

export default function ReportPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col min-h-[calc(100vh-64px)] items-center justify-center bg-muted/5">
                <Loader2 className="animate-spin text-primary mb-4" size={48} />
                <p className="text-xl font-bold text-muted-foreground animate-pulse">
                    &quot;Loading report...&quot;
                </p>
            </div>
        }>
            <ReportContent />
        </Suspense>
    );
}
