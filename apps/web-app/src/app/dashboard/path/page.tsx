'use client';

import { Sidebar } from "@/components/dashboard/Sidebar";
import { MobileNav } from "@/components/dashboard/MobileNav";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { TrendingUp, Clock } from "lucide-react";

export default function LearningPathPage() {
    return (
        <AuthGuard>
            <div className="flex min-h-[calc(100vh-64px)]">
                <Sidebar />
                <main className="flex-1 p-6 md:p-10 space-y-10">
                    <div className="flex flex-col gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                            <TrendingUp size={32} />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight">Learning Path</h1>
                        <p className="text-muted-foreground max-w-2xl">
                            Unlock personalized learning paths based on your assessment performance.
                            Our AI is currently mapping your skills to curate the perfect curriculum for you.
                        </p>
                    </div>

                    <div className="p-8 border-2 border-dashed rounded-[2.5rem] bg-muted/5 flex flex-col items-center justify-center text-center gap-4 py-20">
                        <div className="animate-pulse flex flex-col items-center gap-2">
                            <Clock size={40} className="text-muted-foreground/40" />
                            <h3 className="text-xl font-bold text-muted-foreground">Coming Soon</h3>
                        </div>
                        <p className="text-sm text-muted-foreground max-w-xs">
                            We&apos;re putting the finishing touches on your adaptive learning journey. Stay tuned!
                        </p>
                    </div>
                </main>
                <MobileNav />
            </div>
        </AuthGuard>
    );
}
