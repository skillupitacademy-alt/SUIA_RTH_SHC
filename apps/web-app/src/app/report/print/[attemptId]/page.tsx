"use client";

import { useEffect, useState, use } from "react";
import { ExamReport } from "@/components/reports/ExamReportLayout";
import {
    ExecutiveSummaryPage,
    SubtopicAccuracyPage,
    SubjectBreakdownPage,
    NeuralHeatmapPage,
    ComplexityLadderPage,
    AppendixCoverPage,
    QuestionAuditPage
} from "@/components/reports/print/PrintPages";
import { PdfReadySignal } from "@/components/reports/print/PdfReadySignal";
import { PdfPage, chunkRows } from "@/components/reports/print/PrintToolkit";
import type { QuestionItem, ReportJSON, TopicDataset } from "@quiz/types";

async function fetchReportData(attemptId: string, internalKey?: string): Promise<ExamReport> {
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002/api";
    const apiUrl = rawApiUrl.replace(/\/api$/, "").replace(/\/$/, "");

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (internalKey) {
        headers["x-internal-key"] = internalKey;
    }

    const res = await fetch(`${apiUrl}/api/reports?id=${attemptId}&type=premium`, {
        headers,
    });

    if (!res.ok) {
        const body = await res.text();
        throw new Error(`Fetch failed (${res.status}): ${body.slice(0, 100)}`);
    }

    return res.json();
}

type Params = { attemptId: string };
type SearchParams = {
    internalKey?: string;
    nodeId?: string;
    nodeType?: "domain" | "subject" | "topic";
};

export default function PrintReportPage(props: {
    params: Promise<Params>,
    searchParams: Promise<SearchParams>
}) {
    const params = use<Params>(props.params as unknown as Promise<Params>);
    const searchParams = use<SearchParams>(props.searchParams as unknown as Promise<SearchParams>);
    const { attemptId } = params;
    const { internalKey, nodeId, nodeType } = searchParams;

    const [data, setData] = useState<ExamReport | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchReportData(attemptId, internalKey)
            .then(setData)
            .catch(err => setError(err instanceof Error ? err.message : "Report loading failed"));
    }, [attemptId, internalKey]);

    if (error) {
        return (
            <div className="p-20 text-center bg-[#0B1220] min-h-screen text-white">
                <h1 className="text-2xl font-bold text-rose-500">Render Process Terminated</h1>
                <p className="text-slate-500 mt-4 font-mono text-xs max-w-2xl mx-auto">
                    ID: {attemptId}<br />
                    ERR: {error}
                </p>
                <div id="pdf-error-signal" data-pdf-ready="false" className="hidden" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-20 text-center bg-[#0B1220] min-h-screen flex items-center justify-center">
                <p className="text-indigo-500 font-black uppercase tracking-[.5em] animate-pulse">Initializing Neural Export...</p>
            </div>
        );
    }

    // 1. Determine the dataset to render
    // If no nodeId/nodeType provided, we assume the root (single level) or we wrap the first topic
    // For Phase 3, the orchestrator will explicitly hit this with nodeId/nodeType

    let activeTopic: TopicUnitData | TopicDataset | ExamReport = data;

    // If we have hierarchical data in the response, use it
    const materialized = (data as { reportMaterialized?: ReportJSON }).reportMaterialized;

    if (materialized && nodeId && nodeType === "topic") {
        const topicDs = materialized.datasets.topics[nodeId];
        if (topicDs) {
            const questionBank = materialized.appendix?.questionBank ?? [];
            const topicQuestions: QuestionItem[] = questionBank.filter((q) => {
                const meta = q as QuestionItem & { subtopicName?: string; topicId?: string };
                const matchesTopic = meta.topicId === nodeId;
                const matchesHeatmap = topicDs.heatmap.some((h) => h.subtopic === (meta.subtopicName ?? ""));
                return matchesTopic || matchesHeatmap;
            }) as QuestionItem[];

            activeTopic = {
                ...topicDs,
                examId: data.examId,
                completedAt: data.completedAt,
                candidateName: data.candidateName,
                questions: topicQuestions
            };
        }
    }

    // Normalize data shape for print components (TopicUnitData compatible)
    const topicData = {
        ...activeTopic,
        id: activeTopic.id || activeTopic.topicId || data.examId || attemptId,
        name: activeTopic.name || data.lineage?.topic || data.lineage?.subject || "Report"
    };

    const normalizedQuestions: QuestionItem[] = ((topicData as { questions?: QuestionItem[] }).questions || []).map((q) => ({
        ...q,
        correctAnswer: q.correctAnswer ?? null,
        userAnswer: q.userAnswer ?? null,
        explanation: q.explanation ?? null,
        timeSpent: q.timeSpent ?? 0,
        difficulty: q.difficulty ?? "STD"
    }));

    // Appendix Chunking (5 rows per page for portrait stability)
    const appendixChunks = chunkRows<QuestionItem>(normalizedQuestions, 5);
    const totalPages = 6 + appendixChunks.length;

    return (
        <div className="pdf-container bg-slate-950">
            {/* Page 1: Executive Summary */}
            <PdfPage orientation="landscape">
                <ExecutiveSummaryPage data={topicData} page={1} total={totalPages} />
            </PdfPage>

            {/* Page 2: Subtopic Accuracy */}
            <PdfPage orientation="landscape">
                <SubtopicAccuracyPage data={topicData} page={2} total={totalPages} />
            </PdfPage>

            {/* Page 3: Temporal Patterns */}
            <PdfPage orientation="landscape">
                <SubjectBreakdownPage data={topicData} page={3} total={totalPages} />
            </PdfPage>

            {/* Page 4: Neural Heatmap */}
            <PdfPage orientation="landscape">
                <NeuralHeatmapPage data={topicData} page={4} total={totalPages} />
            </PdfPage>

            {/* Page 5: Complexity Ladder */}
            <PdfPage orientation="landscape">
                <ComplexityLadderPage data={topicData} page={5} total={totalPages} />
            </PdfPage>

            {/* Page 6: Appendix Cover */}
            <PdfPage orientation="landscape">
                <AppendixCoverPage page={6} total={totalPages} />
            </PdfPage>

            {/* Page 7+: Chunked Appendix Registry (Landscape) */}
            {appendixChunks.map((chunk, i) => (
                <PdfPage key={i} orientation="landscape">
                    <QuestionAuditPage
                        questions={chunk}
                        data={topicData}
                        page={7 + i}
                        total={totalPages}
                        offset={i * 5}
                    />
                </PdfPage>
            ))}

            {/* Final Render Signal */}
            <PdfReadySignal />
        </div>
    );
}
