import { cookies } from "next/headers";
import { notFound } from "next/navigation";
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

async function getReportData(attemptId: string, internalKey?: string): Promise<ExamReport> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    if (internalKey) {
        headers["x-internal-key"] = internalKey;
    } else {
        const cookieStore = await cookies();
        headers["Cookie"] = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ");
    }

    const res = await fetch(`${apiUrl}/api/reports?id=${attemptId}&type=premium`, {
        headers,
        next: { revalidate: 0 },
    });

    if (!res.ok) {
        if (res.status === 404) notFound();
        const body = await res.text();
        throw new Error(`Failed to fetch report data (${res.status}): ${body}`);
    }

    return res.json();
}

/**
 * PRINT REPORT PAGE
 * Optimized for Puppeteer PDF generation
 */
export default async function PrintReportPage({
    params,
    searchParams
}: {
    params: { attemptId: string },
    searchParams: { internalKey?: string }
}) {
    const { attemptId } = params;
    const { internalKey } = searchParams;

    try {
        const data = await getReportData(attemptId, internalKey);

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

                {/* Signal for Puppeteer */}
                <div id="pdf-ready-signal" data-pdf-ready="true" className="hidden" />
            </div>
        );
    } catch (error) {
        console.error("Print report error:", error);
        return (
            <div className="p-20 text-center">
                <h1 className="text-2xl font-bold text-red-600">Failed to render report for print</h1>
                <p className="text-slate-500 mt-4">Correlation ID: {attemptId}</p>
            </div>
        );
    }
}
