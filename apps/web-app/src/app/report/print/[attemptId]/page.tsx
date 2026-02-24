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
    QuestionAuditPage,
    TopicUnitData,
    SubjectSummaryPage,
    DomainOverviewPage,
    SubjectUnitData,
    DomainUnitData
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

    // Build topic-scoped questions if materialized data is present
    const materialized = (data as { reportMaterialized?: ReportJSON }).reportMaterialized;

    // --- High-Level Node Bypass (Phase 4) ---
    if (materialized && nodeId) {
        if (nodeType === "domain" && (materialized.datasets.domain.domainId === nodeId || nodeId === "root")) {
            const domainDs = materialized.datasets.domain;
            const domainData: DomainUnitData = {
                id: domainDs.domainId,
                name: domainDs.name,
                subjectAccuracies: domainDs.subjectAccuracies,
                overallAccuracy: domainDs.overallAccuracy,
                completedAt: data.completedAt,
                candidateName: data.candidateName
            };

            return (
                <div className="pdf-container bg-slate-950">
                    <PdfPage orientation="landscape">
                        <DomainOverviewPage data={domainData} page={1} total={1} />
                    </PdfPage>
                    <PdfReadySignal />
                </div>
            );
        }

        if (nodeType === "subject") {
            const subjectDs = materialized.datasets.subjects[nodeId];
            if (subjectDs) {
                const subjectData: SubjectUnitData = {
                    id: subjectDs.subjectId,
                    name: subjectDs.name,
                    topicAccuracies: subjectDs.topicAccuracies,
                    strengths: subjectDs.strengths,
                    weaknesses: subjectDs.weaknesses,
                    lineage: { domain: materialized.datasets.domain.name },
                    completedAt: data.completedAt,
                    candidateName: data.candidateName
                };

                return (
                    <div className="pdf-container bg-slate-950">
                        <PdfPage orientation="landscape">
                            <SubjectSummaryPage data={subjectData} page={1} total={1} />
                        </PdfPage>
                        <PdfReadySignal />
                    </div>
                );
            }
        }
    }

    const normalizeQuestions = (qs: unknown): QuestionItem[] => {
        const arr = Array.isArray(qs) ? qs : [];
        return arr.map((q) => {
            const item = q as Partial<QuestionItem>;
            return {
                id: item.id ?? "",
                text: item.text ?? "",
                userAnswer: item.userAnswer ?? null,
                correctAnswer: item.correctAnswer ?? "",
                explanation: item.explanation ?? "",
                isCorrect: !!item.isCorrect,
                timeSpent: item.timeSpent ?? 0,
                difficulty: item.difficulty ?? "STD",
            };
        });
    };

    let topicQuestions: QuestionItem[] = normalizeQuestions(data.questions);

    if (materialized && nodeId && nodeType === "topic") {
        const topicDs = materialized.datasets.topics[nodeId];
        if (topicDs) {
            const questionBank = materialized.appendix?.questionBank ?? [];
            topicQuestions = normalizeQuestions(questionBank.filter((q: any) => {
                const matchesTopic = q.topicId === nodeId;
                const matchesHeatmap = topicDs.heatmap.some((h) => h.subtopic === (q.subtopicName ?? ""));
                return matchesTopic || matchesHeatmap;
            }));
        }
    }

    // Helper to coerce any source into TopicUnitData shape
    const toTopicUnitData = (src: any): TopicUnitData => {
        // Map subtopics strictly to {name, accuracy, attempts}
        const subtopics = (src.subtopics ?? data.subtopics ?? []).map((s: any) => ({
            name: s.name ?? s.subtopic ?? "Subtopic",
            accuracy: s.accuracy ?? 0,
            attempts: s.attempts ?? s.attempted ?? 0
        }));

        const difficulty =
            src.difficulty ??
                src.difficultySplit
                ? [
                    { level: "Simple", accuracy: src.difficultySplit?.easy ?? 0, attempts: 0 },
                    { level: "Intermediate", accuracy: src.difficultySplit?.medium ?? 0, attempts: 0 },
                    { level: "Expert", accuracy: src.difficultySplit?.hard ?? 0, attempts: 0 },
                ]
                : data.difficulty ?? [];

        return {
            id: src.id ?? src.topicId ?? data.examId ?? attemptId,
            examId: src.examId ?? data.examId,
            name: src.name ?? data.lineage?.topic ?? data.lineage?.subject ?? "Report",
            score: src.score ?? src.accuracy ?? data.score ?? 0,
            mastery: src.mastery ?? src.accuracy ?? data.mastery ?? 0,
            readiness: src.readiness ?? data.readiness ?? src.accuracy ?? 0,
            percentile: src.percentile ?? data.percentile ?? 0,
            totalTimeSpentSeconds: src.totalTimeSpentSeconds ?? data.totalTimeSpentSeconds ?? 0,
            timeEfficiency: src.timeEfficiency ?? data.timeEfficiency ?? "OPTIMAL",
            timeBuckets: src.timeBuckets ?? data.timeBuckets,
            subtopics,
            skills: src.skills ?? data.skills ?? [],
            difficulty,
            heatmap: src.heatmap ?? data.heatmap ?? [],
            ai: src.ai ?? data.ai ?? { status: "READY", actions: [], weakest_subtopic: "", weakest_skill: "" },
            lineage: src.lineage ?? {
                domain: data.lineage?.domain ?? "Domain",
                subject: data.lineage?.subject ?? "Subject",
                topic: src.name ?? data.lineage?.topic ?? "Topic"
            },
            questions: normalizeQuestions(src.questions),
            completedAt: data.completedAt,
            candidateName: data.candidateName
        };
    };

    let topicData: TopicUnitData = toTopicUnitData({ ...data, questions: data.questions });
    if (materialized && nodeId && nodeType === "topic") {
        const topicDs = materialized.datasets.topics[nodeId];
        if (topicDs) {
            topicData = toTopicUnitData({ ...topicDs, questions: topicQuestions });
        }
    }

    const normalizedQuestions: QuestionItem[] = topicData.questions || [];

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
