import { QuizSelection } from "@/components/quiz/QuizSelection";

export default function NewQuizPage() {
    return (
        <div className="min-h-[calc(100vh-64px)] bg-muted/5 py-12 md:py-24 px-4 overflow-x-hidden">
            <div className="max-w-6xl mx-auto mb-16 text-center">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">Start New Assessment</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Configure your enterprise environment. Select a domain and subjects to generate your adaptive exam.
                </p>
            </div>
            <QuizSelection />
        </div>
    );
}
