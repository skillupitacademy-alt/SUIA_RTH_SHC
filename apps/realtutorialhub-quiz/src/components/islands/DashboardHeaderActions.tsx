'use client';

import { Activity, Loader2, Play } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { apiClient } from "@quiz/api-client";
import { recordCounter, recordTimer } from "@quiz/observability";
import { clientLogger } from "@/utils/clientLogger";

export function DashboardHeaderActions() {
    const router = useRouter();
    const [isStarting, setIsStarting] = useState(false);

    const handleStartAdaptive = async () => {
        if (isStarting) return;
        const start = Date.now();
        try {
            setIsStarting(true);
            recordCounter('web.ui.dashboard.start_exam_click', 1);
            const res = await apiClient.quiz.startAdaptiveExam();
            const duration = Date.now() - start;
            recordTimer('web.ui.dashboard.start_exam_time', duration);
            recordCounter('web.ui.dashboard.start_exam_success', 1);
            router.push(`/exam/${res.examId}`);
        } catch (err) {
            clientLogger.error('Failed to start adaptive exam', { error: err instanceof Error ? err.message : 'unknown' });
            recordCounter('web.ui.dashboard.start_exam_error', 1);
            alert('Failed to start adaptive exam. Please try again.');
        } finally {
            setIsStarting(false);
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-4">
            <button
                onClick={handleStartAdaptive}
                disabled={isStarting}
                className="inline-flex items-center justify-center rounded-2xl bg-black px-6 py-3 text-sm font-bold text-white shadow-lg shadow-black/10 hover:bg-gray-800 transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
            >
                {isStarting ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin text-pink-500" />
                        Recruiting...
                    </>
                ) : (
                    <>
                        <Activity size={18} className="mr-2 text-pink-500 animate-pulse" />
                        Start Adaptive Mission
                    </>
                )}
            </button>
            <Link
                href="/quiz/new"
                className="inline-flex items-center justify-center rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all hover:scale-105"
            >
                <Play size={18} className="mr-2" />
                Start New Exam
            </Link>
        </div>
    );
}
