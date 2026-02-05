import { QuizSelectionConsole } from "@/components/quiz/new/QuizSelectionConsole";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function NewQuizPage() {
    return (
        <AuthGuard>
            <div className="min-h-screen bg-[#F9FAFB] pt-10 pb-16 px-8 md:px-16 overflow-x-hidden">
                <div className="max-w-[1400px] mx-auto mb-6">
                    <h1 className="text-5xl md:text-6xl font-black tracking-tighter mb-4 font-outfit text-[#1A1A1A]">
                        Launch Evaluation
                    </h1>
                    <p className="text-lg text-muted-foreground font-inter font-medium opacity-60">
                        Strategic ecosystem configuration. Finalize your domain and subjects to initialize the assessment.
                    </p>
                </div>
                <QuizSelectionConsole />
            </div>
        </AuthGuard>
    );
}
