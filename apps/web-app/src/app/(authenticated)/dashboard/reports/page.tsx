'use client';

import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useDashboardStore } from "@/store/dashboard-store";
import { useEffect } from "react";

export default function ReportsPage() {
    const { data, fetchDashboard } = useDashboardStore();

    useEffect(() => {
        fetchDashboard();
    }, [fetchDashboard]);

    return (
        <AuthGuard>
            <div className="flex min-h-[calc(100vh-64px)]">
                <Sidebar />
                <main className="flex-1 p-6 md:p-10 space-y-10">
                    <div className="flex flex-col gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <FileText size={32} />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight">Assessment Reports</h1>
                        <p className="text-muted-foreground max-w-2xl">
                            Review your detailed performance analysis for all completed assessments.
                        </p>
                    </div>

                    <div className="grid gap-6">
                        {data?.recentActivity?.filter(a => a.status === 'completed').length === 0 ? (
                            <div className="p-20 text-center border-2 border-dashed rounded-[2.5rem] bg-muted/5 text-muted-foreground">
                                <p className="font-bold">No completed assessment reports found.</p>
                                <p className="text-sm">Complete a quiz to see your detailed breakdown.</p>
                            </div>
                        ) : (
                            data?.recentActivity?.filter(a => a.status === 'completed').map((report) => (
                                <div key={report.id} className="p-6 rounded-[2rem] border bg-muted/10 hover:bg-muted/30 transition-all group flex items-center justify-between">
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-green-100 text-green-700">COMPLETED</span>
                                            <span className="text-[10px] font-bold text-muted-foreground uppercase">{report.relativeTime}</span>
                                        </div>
                                        <h3 className="text-lg font-bold">{report.title}</h3>
                                        <p className="text-sm text-muted-foreground font-medium">Final Score: {report.score}%</p>
                                    </div>
                                    <Link
                                        href={`/reports/active-report?examId=${report.id}`}
                                        className="h-12 w-12 rounded-full bg-background border flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all shadow-sm"
                                    >
                                        <ArrowRight size={20} />
                                    </Link>
                                </div>
                            ))
                        )}
                    </div>
                </main>
                <MobileNav />
            </div>
        </AuthGuard>
    );
}
