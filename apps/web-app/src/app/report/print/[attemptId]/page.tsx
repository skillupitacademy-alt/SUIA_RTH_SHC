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
import { initPdfReadyRegistry } from "@/components/reports/print/pdfReadyRegistry";
import { PdfPage } from "@/components/reports/print/PrintToolkit";
import type { QuestionItem, ReportJSON, SubjectDataset, TopicDataset } from "@quiz/types";

async function fetchReportData(attemptId: string, internalKey?: string): Promise<ExamReport> {
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!rawApiUrl) {
        throw new Error("NEXT_PUBLIC_API_URL is required for report rendering");
    }
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
    pageOffset?: string;
    totalPages?: string;
};

export default function PrintReportPage(props: {
    params: Promise<Params>,
    searchParams: Promise<SearchParams>
}) {
    const params = use<Params>(props.params as unknown as Promise<Params>);
    const searchParams = use<SearchParams>(props.searchParams as unknown as Promise<SearchParams>);
    const { attemptId } = params;
    const { internalKey, nodeId, nodeType } = searchParams;

    // --- Global Page Context (Phase 5) ---
    const startPage = Number(searchParams.pageOffset) || 0;
    const globalTotal = Number(searchParams.totalPages) || 0;

    const [data, setData] = useState<ExamReport | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [scale, setScale] = useState(1);
    const [theme, setTheme] = useState<"dark" | "light">("dark");

    useEffect(() => {
        const injectedTheme = (window as unknown as { __REPORT_THEME__?: string }).__REPORT_THEME__;
        if (injectedTheme === "light" || injectedTheme === "dark") {
            setTheme(injectedTheme);
        }
    }, []);

    useEffect(() => {
        // Data Injection Pattern: Check if data was injected by the PDF service
        const injectedData = (window as unknown as { __REPORT_DATA__?: ExamReport }).__REPORT_DATA__;
        if (injectedData) {
            setData(injectedData);
            return;
        }

        fetchReportData(attemptId, internalKey)
            .then(setData)
            .catch(err => setError(err instanceof Error ? err.message : "Report loading failed"));
    }, [attemptId, internalKey]);

    useEffect(() => {
        // Deterministic "ready" handshake for PDF capture.
        // Keep this list in sync with usePdfMarkReady() calls across the print surface.
        initPdfReadyRegistry();
        window.__PDF_READY_SET_EXPECTED__?.(6); // radial-kpi, subtopic-bar, skill-donut, time-donut, heatmap, complexity
    }, []);

    useEffect(() => {
        const calculateScale = () => {
            const targetWidth = 1920;
            const screenWidth = window.innerWidth;
            if (screenWidth < targetWidth) {
                // Scale to fit width with some breathing room
                setScale((screenWidth - 48) / targetWidth);
            } else {
                setScale(1);
            }
        };

        calculateScale();
        window.addEventListener("resize", calculateScale);
        return () => window.removeEventListener("resize", calculateScale);
    }, []);

    if (error) {
        return (
            <div className="pdf-root" data-report-theme={theme}>
                <div className="p-20 text-center bg-[#0B1220] min-h-screen text-white">
                    <h1 className="text-2xl font-bold text-rose-500">Render Process Terminated</h1>
                    <p className="text-slate-500 mt-4 font-mono text-xs max-w-2xl mx-auto">
                        ID: {attemptId}<br />
                        ERR: {error}
                    </p>
                    <div id="pdf-error-signal" data-pdf-ready="false" className="hidden" />
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="pdf-root" data-report-theme={theme}>
                <div className="p-20 text-center bg-[#0B1220] min-h-screen flex items-center justify-center">
                    <p className="text-indigo-500 font-black uppercase tracking-[.5em] animate-pulse">Initializing Neural Export...</p>
                </div>
            </div>
        );
    }

    // --- High-Level Node Bypass (Phase 4) ---
    const materialized = (data as { reportMaterialized?: ReportJSON }).reportMaterialized;
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
                <div className="pdf-root" data-report-theme={theme}>
                    <div className="pdf-container bg-slate-950">
                        <PdfPage orientation="landscape">
                            <DomainOverviewPage data={domainData} page={startPage + 1} total={globalTotal} />
                        </PdfPage>
                        <PdfReadySignal />
                    </div>
                </div>
            );
        }

        if (nodeType === "subject") {
            const subjectList = Object.values(materialized.datasets.subjects ?? {}) as SubjectDataset[];
            const subjectDs = subjectList.find((s) => s.subjectId === nodeId);
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
                    <div className="pdf-root" data-report-theme={theme}>
                        <div className="pdf-container bg-slate-950">
                            <PdfPage orientation="landscape">
                                <SubjectSummaryPage data={subjectData} page={startPage + 1} total={globalTotal} />
                            </PdfPage>
                            <PdfReadySignal />
                        </div>
                    </div>
                );
            }
        }
    }

    // Helper to coerce any source into TopicUnitData shape
    const normalizeQuestions = (qs: unknown): QuestionItem[] => {
        const arr = Array.isArray(qs) ? qs : [];
        return arr.map((q) => {
            const item = q as Partial<QuestionItem> & { is_correct?: number };
            return {
                id: item.id ?? "",
                text: item.text ?? "",
                userAnswer: item.userAnswer ?? null,
                correctAnswer: item.correctAnswer ?? "",
                explanation: item.explanation ?? "",
                isCorrect: item.isCorrect ?? (item.is_correct === 1),
                timeSpent: item.timeSpent ?? 0,
                difficulty: item.difficulty ?? "STD",
            };
        });
    };

    const toTopicUnitData = (src: unknown): TopicUnitData => {
        const source = src as Record<string, unknown>;

        // Map subtopics strictly to {name, accuracy, attempts}
        const rawSubtopics = (source.subtopics ??
            (data.subtopics as unknown) ??
            []) as Array<{
                name?: string;
                subtopic?: string;
                accuracy?: number;
                attempts?: number;
                attempted?: number;
            }>;

        const subtopics = rawSubtopics.map((s) => ({
            name: s.name ?? s.subtopic ?? "Subtopic",
            accuracy: s.accuracy ?? 0,
            attempts: s.attempts ?? s.attempted ?? 0
        }));

        const questions: QuestionItem[] = normalizeQuestions(source.questions ?? data.questions);

        return {
            id: (source.id as string | undefined) ?? data.examId ?? attemptId,
            name: (source.name as string | undefined) ?? data.lineage?.topic ?? data.lineage?.subject ?? "Topic Analysis",
            score: (source.score as number | undefined) ?? (source.accuracy as number | undefined) ?? data.score ?? 0,
            mastery: (source.mastery as number | undefined) ?? (source.accuracy as number | undefined) ?? data.mastery ?? 0,
            readiness: (source.readiness as number | undefined) ?? data.readiness ?? (source.accuracy as number | undefined) ?? 0,
            percentile: (source.percentile as number | undefined) ?? data.percentile ?? 0,
            totalTimeSpentSeconds: (source.totalTimeSpentSeconds as number | undefined) ?? data.totalTimeSpentSeconds ?? 0,
            timeEfficiency: (source.timeEfficiency as TopicUnitData["timeEfficiency"] | undefined) ?? data.timeEfficiency ?? "OPTIMAL",
            timeBuckets: (source.timeBuckets as TopicUnitData["timeBuckets"] | undefined) ?? data.timeBuckets,
            subtopics,
            skills: (source.skills as TopicUnitData["skills"] | undefined) ?? data.skills ?? [],
            difficulty: (source.difficulty as TopicUnitData["difficulty"] | undefined) ?? data.difficulty ?? [],
            heatmap: (source.heatmap as TopicUnitData["heatmap"] | undefined) ?? data.heatmap ?? [],
            ai: (source.ai as TopicUnitData["ai"] | undefined) ?? data.ai ?? {
                status: "DATA_INSUFFICIENT",
                actions: [],
                weakest_subtopic: "",
            },
            lineage: (source.lineage as TopicUnitData["lineage"] | undefined) ?? data.lineage,
            questions,
            completedAt: (source.completedAt as string | undefined) ?? data.completedAt,
            candidateName: (source.candidateName as string | undefined) ?? data.candidateName,
            timePattern: (source.timePattern as string | undefined) ?? data.timePattern,
            isInconsistent: (source.isInconsistent as boolean | undefined) ?? data.isInconsistent,
        };
    };

    // 2. Determine the dataset to render
    const topicList = materialized ? Object.values(materialized.datasets.topics ?? {}) as TopicDataset[] : [];
    const topicDs = topicList.find((t) => t.topicId === nodeId);
    const topicData = toTopicUnitData(topicDs || data);


    // Final Page Context Calculation (5 analysis + 1 appendix cover + 1 audit stats)
    const localPages = 7;
    const finalGlobalTotal = globalTotal || localPages;
    const getPageNum = (localIdx: number) => startPage + localIdx;
    const topicLayout: "pillar" | "bar" | "grid" | "heatmap" =
        topicData.subtopics.length <= 3 ? "pillar"
            : topicData.subtopics.length <= 8 ? "bar"
                : topicData.subtopics.length <= 20 ? "grid"
                    : "heatmap";

    return (
        <div className="pdf-root" data-report-theme={theme} style={{ height: 'auto' }}>
            <div
                className="pdf-container bg-slate-950 flex flex-col items-center"
                style={{
                    transform: `scale(${scale})`,
                    transformOrigin: "top left",
                    width: scale < 1 ? '1920px' : '100%',
                    marginBottom: scale < 1 ? `-${(1 - scale) * 100}%` : 0 // Counteract scale pull for layout
                }}
            >
                {/* Page 1: Executive Summary */}
                <PdfPage orientation="landscape" autoScale={scale < 1}>
                    <ExecutiveSummaryPage data={topicData} page={getPageNum(1)} total={finalGlobalTotal} />
                </PdfPage>

                {/* Page 2: Subtopic Accuracy */}
                <PdfPage orientation="landscape" autoScale={scale < 1}>
                    <SubtopicAccuracyPage
                        data={topicData}
                        page={getPageNum(2)}
                        total={finalGlobalTotal}
                        layout={topicLayout}
                    />
                </PdfPage>

                {/* Page 3: Temporal Patterns */}
                <PdfPage orientation="landscape" autoScale={scale < 1}>
                    <SubjectBreakdownPage data={topicData} page={getPageNum(3)} total={finalGlobalTotal} />
                </PdfPage>

                {/* Page 4: Neural Heatmap */}
                <PdfPage orientation="landscape" autoScale={scale < 1}>
                    <NeuralHeatmapPage data={topicData} page={getPageNum(4)} total={finalGlobalTotal} />
                </PdfPage>

                {/* Page 5: Complexity Ladder */}
                <PdfPage orientation="landscape" autoScale={scale < 1}>
                    <ComplexityLadderPage data={topicData} page={getPageNum(5)} total={finalGlobalTotal} />
                </PdfPage>

                {/* Page 6: Appendix Cover */}
                <PdfPage orientation="landscape" autoScale={scale < 1}>
                    <AppendixCoverPage page={getPageNum(6)} total={finalGlobalTotal} />
                </PdfPage>

                {/* Page 7: Audit Statistical Summary (stats only, no Q&A cards) */}
                <PdfPage orientation="landscape" autoScale={scale < 1}>
                    <QuestionAuditPage
                        data={topicData}
                        page={getPageNum(7)}
                        total={finalGlobalTotal}
                    />
                </PdfPage>

                <PdfReadySignal />
            </div>
            {/* Added spacing to prevent clipping after scale */}
            {scale < 1 && (
                <div style={{ height: (1080 * 7 * (1 - scale)) + 200 }} />
            )}
        </div>
    );
}
