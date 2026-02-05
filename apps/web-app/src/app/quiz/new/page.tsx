import { QuizSelectionConsole } from "@/components/quiz/new/QuizSelectionConsole";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function NewQuizPage() {
    return (
        <AuthGuard>
            <div className="min-h-screen bg-[#F9FAFB] pt-10 pb-16 px-8 md:px-16 overflow-x-hidden">
                <QuizSelectionConsole />
            </div>
        </AuthGuard>
    );
}
