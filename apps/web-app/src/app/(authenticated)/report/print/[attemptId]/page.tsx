"use client";

import { useEffect, useState } from "react";
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
import { use } from "react";

async function fetchReportData(attemptId: string, internalKey?: string): Promise<ExamReport> {
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.realtutorialhub.com/api";
    const apiUrl = rawApiUrl.replace(/\/api$/, "").replace(/\/$/, "");

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (internalKey) {
        headers["x-internal-key"] = internalKey;
    }

    // This fetch WILL be intercepted by Puppeteer because it's running in the browser!
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
            <div className="p-20 text-center">
                <h1 className="text-2xl font-bold text-red-600">Failed to render report for print</h1>
                <p className="text-slate-500 mt-4 font-mono text-sm max-w-2xl mx-auto">
                    ID: {attemptId}<br />
                    Error: {error}
                </p>
                <div id="pdf-error-signal" data-pdf-ready="false" className="hidden" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="p-20 text-center">
                <p className="text-slate-400 animate-pulse">Loading report data for PDF generation...</p>
            </div>
        );
    }

    return (
        <div className="pdf-container">
            {/* Page 1: Executive Summary (Landscape) */}
            <section className="pdf-page landscape">
                <ExecutiveSummaryPage data={data} />
            </section>

            {/* Page 2: Subtopic Accuracy (Landscape) */}
            <section className="pdf-page landscape">
                <SubtopicAccuracyPage data={data} />
            </section>

            {/* Page 3: Subject Breakdown (Landscape) */}
            <section className="pdf-page landscape">
                <SubjectBreakdownPage data={data} />
            </section>

            {/* Page 4: Neural Heatmap (Landscape) */}
            <section className="pdf-page landscape">
                <NeuralHeatmapPage data={data} />
            </section>

            {/* Page 5: Complexity Ladder (Landscape) */}
            <section className="pdf-page landscape">
                <ComplexityLadderPage data={data} />
            </section>

            {/* Page 6: Appendix Cover (Landscape) */}
            <section className="pdf-page landscape">
                <AppendixCoverPage data={data} />
            </section>

            {/* Page 7+: Question Audit (Portrait) */}
            <QuestionAuditPage data={data} />

            {/* Signal for Puppeteer (Client side delayed) */}
            <PdfReadySignal />
        </div>
    );
}
