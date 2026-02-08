import { QuizSelectionConsole } from "@/components/quiz/new/QuizSelectionConsole";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

// [REFACTOR]: Desktop-first Layout (No scrollbar)
export default function NewQuizPage() {
    return (
        <AuthGuard>
            <div className="h-[calc(100dvh-56px)] bg-[#F9FAFB] pt-1 pb-0 px-0 overflow-hidden flex flex-col items-stretch relative">
                <Suspense fallback={<div className="flex-1 flex items-center justify-center h-full"><Loader2 className="animate-spin text-primary" size={32} /></div>}>
                    <QuizSelectionConsole />
                </Suspense>
            </div>
        </AuthGuard>
    );
}
