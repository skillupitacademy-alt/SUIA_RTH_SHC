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

async function getReportData(attemptId: string): Promise<ExamReport> {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
    const cookieStore = await cookies();
    const allCookies = cookieStore.getAll().map(c => `${c.name}=${c.value}`).join("; ");

    const res = await fetch(`${apiUrl}/api/reports?id=${attemptId}&type=premium`, {
        headers: {
            Cookie: allCookies,
        },
        next: { revalidate: 0 },
    });

    if (!res.ok) {
        if (res.status === 404) notFound();
        throw new Error(`Failed to fetch report data: ${res.statusText}`);
    }

    return res.json();
}

export default async function PrintReportPage({ params }: { params: { attemptId: string } }) {
    const { attemptId } = params;

    try {
        const data = await getReportData(attemptId);

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
