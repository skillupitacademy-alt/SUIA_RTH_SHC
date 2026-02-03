'use client';

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiClient } from "@quiz/api-client";
import { ResultSummary } from "@/components/reports/ResultSummary";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

export default function DynamicReportPage() {
    const { id } = useParams();
    const [report, setReport] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const data = await apiClient.reports.getExamReport(id as string);
                setReport(data);
            } catch (err) {
                console.error("Failed to fetch report", err);
            } finally {
                setLoading(false);
            }
        };
        if (id) fetchReport();
    }, [id]);

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={48} />
            </div>
        );
    }

    if (!report) {
        return <div>Report not found</div>;
    }

    return (
        <div className="min-h-[calc(100vh-64px)] bg-muted/5 py-12 px-4 md:px-8 lg:px-12">
            <div className="max-w-6xl mx-auto space-y-12">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                    <Link
                        href="/dashboard"
                        className="group flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        Back to Dashboard
                    </Link>
                </div>

                <ResultSummary
                    score={report.score}
                    total={report.total}
                    status={report.status}
                    percentile={85} // Hardcoded for now
                    timeTaken="N/A"
                />

                {/* Simplified breakdown for now */}
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="p-8 rounded-3xl bg-background border">
                        <h3 className="text-xl font-bold mb-6">Question Results</h3>
                        <div className="space-y-4">
                            {report.questions?.map((q: any, i: number) => ( // eslint-disable-line @typescript-eslint/no-explicit-any
                                <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-muted/20">
                                    <p className="text-sm font-medium truncate max-w-[70%]">{q.text}</p>
                                    <span className={q.isCorrect ? "text-green-500 font-bold" : "text-red-500 font-bold"}>
                                        {q.isCorrect ? "Correct" : "Incorrect"}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
