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

export default function PrintReportPage(props: {
    params: Promise<{ attemptId: string }>,
    searchParams: Promise<{ internalKey?: string }>
}) {
    const params = use(props.params);
    const searchParams = use(props.searchParams);
    const { attemptId } = params;
    const { internalKey } = searchParams;

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

    // Appendix Chunking (8 rows per page for portrait stability)
    const appendixChunks = chunkRows(data.questions || [], 8);
    const totalPages = 6 + appendixChunks.length;

    return (
        <div className="pdf-container bg-slate-950">
            {/* Page 1: Executive Summary */}
            <PdfPage orientation="landscape">
                <ExecutiveSummaryPage data={data} page={1} total={totalPages} />
            </PdfPage>

            {/* Page 2: Subtopic Accuracy */}
            <PdfPage orientation="landscape">
                <SubtopicAccuracyPage data={data} page={2} total={totalPages} />
            </PdfPage>

            {/* Page 3: Temporal Patterns */}
            <PdfPage orientation="landscape">
                <SubjectBreakdownPage data={data} page={3} total={totalPages} />
            </PdfPage>

            {/* Page 4: Neural Heatmap */}
            <PdfPage orientation="landscape">
                <NeuralHeatmapPage data={data} page={4} total={totalPages} />
            </PdfPage>

            {/* Page 5: Complexity Ladder */}
            <PdfPage orientation="landscape">
                <ComplexityLadderPage data={data} page={5} total={totalPages} />
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
                        page={7 + i}
                        total={totalPages}
                        offset={i * 8}
                    />
                </PdfPage>
            ))}

            {/* Final Render Signal */}
            <PdfReadySignal />
        </div>
    );
}
