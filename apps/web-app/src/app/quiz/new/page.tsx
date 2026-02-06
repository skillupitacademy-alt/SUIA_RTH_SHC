import { QuizSelectionConsole } from "@/components/quiz/new/QuizSelectionConsole";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function NewQuizPage() {
    return (
        <AuthGuard>
            <div className="min-h-screen bg-[#F9FAFB] pt-10 pb-16 px-8 md:px-16 overflow-x-hidden">
                <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>}>
                    <QuizSelectionConsole />
                </Suspense>
            </div>
        </AuthGuard>
    );
}
