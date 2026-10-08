import { Suspense } from 'react';
import { ExamInterface } from "@/components/quiz/ExamInterface";
import { Loader2 } from "lucide-react";

export default function ActiveExamPage() {
    return (
        <Suspense fallback={
            <div className="flex h-[calc(100vh-64px)] w-full items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm font-medium text-muted-foreground">Initializing Secure Session...</p>
                </div>
            </div>
        }>
            <ExamInterface />
        </Suspense>
    );
}
