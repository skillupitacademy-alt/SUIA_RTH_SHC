import { FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { fetchServerDashboard } from "@/lib/server-data";

type CompletedReport = {
    id: string;
    status?: string | null;
    relativeTime?: string | null;
    title?: string | null;
    score?: number | null;
};

export default async function ReportsPage() {
    const data = await fetchServerDashboard('all', 1, 50); // Fetch more for the full list

    const completedReports = data?.recentActivity?.filter((a: CompletedReport) => a.status === 'completed') || [];

    return (
        <div className="space-y-12">
            <div className="flex flex-col gap-3">
                <div className="h-14 w-14 rounded-2xl bg-pink-100/50 flex items-center justify-center text-pink-600">
                    <FileText size={32} />
                </div>
                <h2 className="text-[10px] font-black uppercase text-pink-600 tracking-[0.4em]">Evaluation Repository</h2>
                <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Assessment Reports</h1>
                <p className="text-slate-500 font-bold uppercase text-[11px] tracking-widest mt-1 max-w-2xl leading-relaxed">
                    Review your detailed performance analysis for all completed assessments.
                </p>
            </div>

            <div className="grid gap-6">
                {completedReports.length === 0 ? (
                    <div className="p-20 text-center border-2 border-dashed border-slate-200 rounded-[2.5rem] bg-slate-50/10 text-slate-400">
                        <p className="font-black uppercase tracking-widest text-sm">No completed assessment reports found.</p>
                        <p className="text-[10px] uppercase font-bold tracking-widest mt-2">Complete a quiz to see your detailed breakdown.</p>
                    </div>
                ) : (
                    completedReports.map((report: CompletedReport) => (
                        <div key={report.id} className="p-8 rounded-[2.5rem] border border-slate-200 bg-white hover:border-pink-500/20 transition-all group flex items-center justify-between shadow-sm">
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-3">
                                    <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">COMPLETED</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{report.relativeTime}</span>
                                </div>
                                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">{report.title}</h3>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Final Mastery Score: <span className="text-pink-600 font-black">{report.score}%</span></p>
                            </div>
                            <Link
                                href={`/reports/active-report?examId=${report.id}`}
                                className="h-14 w-14 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary/20 group-hover:border-none transition-all duration-300"
                            >
                                <ArrowRight size={24} />
                            </Link>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
