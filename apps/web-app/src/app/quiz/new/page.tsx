import { QuizSelectionConsole } from "@/components/quiz/new/QuizSelectionConsole";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

// [REFACTOR]: Desktop-first Layout (No scrollbar)
export default function NewQuizPage() {
    return (
        <AuthGuard>
            <div className="h-screen bg-[#F9FAFB] pt-6 pb-0 px-8 md:px-12 overflow-hidden flex flex-col">
                <Suspense fallback={<div className="flex-1 flex items-center justify-center h-full"><Loader2 className="animate-spin text-primary" size={32} /></div>}>
                    <QuizSelectionConsole />
                </Suspense>
            </div>
        </AuthGuard>
    );
}
