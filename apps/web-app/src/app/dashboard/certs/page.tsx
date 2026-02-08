'use client';

import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Award, Clock } from "lucide-react";

export default function CertificationsPage() {
    return (
        <AuthGuard>
            <div className="flex min-h-[calc(100vh-64px)]">
                <Sidebar />
                <main className="flex-1 p-6 md:p-10 space-y-10">
                    <div className="flex flex-col gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-secondary/10 flex items-center justify-center text-secondary">
                            <Award size={32} />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight">Certifications</h1>
                        <p className="text-muted-foreground max-w-2xl">
                            Validate your expertise with industry-recognized certifications.
                            Complete your learning paths to unlock certification exams.
                        </p>
                    </div>

                    <div className="p-8 border-2 border-dashed rounded-[2.5rem] bg-muted/5 flex flex-col items-center justify-center text-center gap-4 py-20">
                        <div className="animate-pulse flex flex-col items-center gap-2">
                            <Clock size={40} className="text-muted-foreground" />
                            <h3 className="text-xl font-bold text-muted-foreground">Coming Soon</h3>
                        </div>
                        <p className="text-sm text-muted-foreground max-w-xs">
                            The Certification Engine is being calibrated for maximum precision.
                        </p>
                    </div>
                </main>
                <MobileNav />
            </div>
        </AuthGuard>
    );
}
