import { QuizSelection } from "@/components/quiz/QuizSelection";
import { AuthGuard } from "@/components/auth/AuthGuard";

export default function NewQuizPage() {
    return (
        <AuthGuard>
            <div className="min-h-screen bg-muted/5 py-16 px-8 md:px-16 overflow-x-hidden">
                <div className="w-full mb-20 text-center">
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-6 uppercase italic text-[#1A1A1A]">
                        Start New Assessment_
                    </h1>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto font-medium uppercase tracking-wide opacity-70">
                        Configure your enterprise environment. Select a domain and subjects to generate your adaptive exam.
                    </p>
                </div>
                <QuizSelection />
            </div>
        </AuthGuard>
    );
}
