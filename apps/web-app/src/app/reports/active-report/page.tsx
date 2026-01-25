'use client';

import { useEffect, useState } from "react";
import { ResultSummary } from "@/components/reports/ResultSummary";
import { PerformanceBreakdown } from "@/components/reports/PerformanceBreakdown";
import { ArrowLeft, Download, Share2, Loader2 } from "lucide-react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { apiClient } from "@quiz/api-client";
import { cn } from "@/lib/utils";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuthStore } from "@/store/auth-store";

export default function ReportPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const examId = searchParams.get('examId');
    const [reportData, setReportData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            if (!isAuthenticated) return;

            if (!examId) {
                router.push('/dashboard');
                return;
            }

            try {
                const data = await apiClient.quiz.getResult(examId);

                // Map API data to UI format
                const mappedData = {
                    score: Math.round((data.totalScore / 100) * (data.examQuestions?.length || 10)),
                    total: data.examQuestions?.length || 10,
                    totalPercent: data.totalScore,
                    timeTaken: data.timeTaken || "00:00",
                    percentile: 85,
                    status: (data.totalScore >= 70 ? 'passed' : 'failed') as 'passed' | 'failed',
                    topics: data.dimensions
                        .filter((d: any) => d.dimensionType === 'topic')
                        .map((d: any) => ({ name: d.name || 'Unknown', score: d.score, total: 100 })),
                    difficulty: data.dimensions
                        .filter((d: any) => d.dimensionType === 'difficulty')
                        .map((d: any) => ({ level: d.dimensionId, accuracy: d.accuracy })),
                    growthZones: data.growthZones || [],
                    questions: data.examQuestions?.map((eq: any) => ({
                        id: eq.id,
                        questionText: eq.question?.questionText,
                        userAnswer: eq.userAnswer,
                        correctAnswer: eq.question?.correctAnswer,
                        isCorrect: eq.isCorrect
                    }))
                };

                setReportData(mappedData);
            } catch (err) {
                console.error("Failed to load report", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [examId, router, isAuthenticated]);

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-[calc(100vh-64px)] items-center justify-center bg-muted/5">
                <Loader2 className="animate-spin text-primary mb-4" size={48} />
                <p className="text-xl font-bold text-muted-foreground italic animate-pulse">
                    "Mining your masteries... one second."
                </p>
            </div>
        );
    }

    if (!reportData) return null;

    return (
        <AuthGuard>
            <div className="min-h-[calc(100vh-64px)] bg-muted/5 py-12 px-4 md:px-8 lg:px-12">
                <div className="max-w-6xl mx-auto space-y-12">
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

                    {/* Real Data Components */}
                    <ResultSummary
                        score={reportData.totalPercent}
                        total={100}
                        timeTaken={reportData.timeTaken}
                        percentile={reportData.percentile}
                        status={reportData.status}
                    />

                    <PerformanceBreakdown
                        topics={reportData.topics}
                        difficulty={reportData.difficulty}
                        growthZones={reportData.growthZones}
                    />

                    {/* Question Audit Section */}
                    <section className="space-y-8">
                        <div className="flex items-center justify-between">
                            <h3 className="text-2xl font-black tracking-tight">Question Audit</h3>
                            <div className="flex gap-4 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500" /> Correct</div>
                                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-primary" /> Incorrect</div>
                            </div>
                        </div>

                        <div className="grid gap-6">
                            {reportData.questions?.map((q: any, idx: number) => (
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
                                        {!q.isCorrect && (
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
                        <p className="text-muted-foreground font-bold italic mb-6">
                            "Your path to mastery is a marathon, not a sprint. Every identified weakness is a target for tomorrow's success."
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
