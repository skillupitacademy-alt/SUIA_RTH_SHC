import { ResultSummary } from "@/components/reports/ResultSummary"
import { PerformanceBreakdown } from "@/components/reports/PerformanceBreakdown"
import { ArrowLeft, Download, Share2, Printer } from "lucide-react"
import Link from "next/link"

export default function ReportPage() {
    // Mock data for static generation
    const mockData = {
        score: 16,
        total: 20,
        timeTaken: "24:12",
        percentile: 88,
        status: 'passed' as const,
        topics: [
            { name: "Frontend Fundamentals", score: 5, total: 5 },
            { name: "Backend Architecture", score: 4, total: 6 },
            { name: "Security & Auth", score: 3, total: 4 },
            { name: "DevOps Basics", score: 4, total: 5 },
        ],
        difficulty: [
            { level: "Simple", accuracy: 100 },
            { level: "Intermediate", accuracy: 80 },
            { level: "Expert", accuracy: 65 },
        ]
    };

    return (
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

                {/* Components */}
                <ResultSummary {...mockData} />
                <PerformanceBreakdown topics={mockData.topics} difficulty={mockData.difficulty} />

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
    );
}
