import { QuizSelectionConsole } from "@/components/quiz/new/QuizSelectionConsole";
import { Suspense } from "react";
import { ZLoader } from "@quiz/ui";

// [REFACTOR]: Desktop-first Layout (No scrollbar)
export default function NewQuizPage() {
    return (
        <div className="h-[calc(100dvh-56px)] bg-[#F9FAFB] pt-1 pb-0 px-0 overflow-hidden flex flex-col items-stretch relative">
            <Suspense fallback={<ZLoader size="xl" text="Loading Exam..." />}>
                <QuizSelectionConsole />
            </Suspense>
        </div>
    );
}
