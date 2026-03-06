'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Loader2, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EXAM_THEMES } from '@/lib/exam-themes';
import { useExitGuard } from '@/hooks/useExitGuard';
import { ExitConfirmationDialog } from '@/components/ui/ExitConfirmationDialog';
import { useSessionManager } from '@/hooks/useSessionManager';
import { useExamHUD } from '@/hooks/useExamHUD';

import { HUDHeader } from '@/components/exam/HUDHeader';
import { TacticalMap } from '@/components/exam/TacticalMap';
import { QuestionView } from '@/components/exam/QuestionView';
import { HUDControls } from '@/components/exam/HUDControls';

export default function ActiveExamPage() {
    useSessionManager();
    const { examId } = useParams<{ examId: string }>();
    const router = useRouter();
    const [confirmSubmit, setConfirmSubmit] = useState(false);

    // Use Executive Minimal theme (finalized choice)
    const theme = EXAM_THEMES.executive;

    const {
        questions,
        currentIndex,
        answers,
        flags,
        timeLeft,
        status,
        isLoading,
        error,
        isSubmitting,
        actions
    } = useExamHUD(examId);

    // Navigation Guardrail (Anti-Oops)
    const isExamActive = status === 'started';
    const { showDialog: showExitDialog, confirmExit, cancelExit } = useExitGuard({
        enabled: isExamActive && !isSubmitting,
        message: 'Your exam session is active. Leaving may result in data loss.'
    });

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const isNearEnd = timeLeft < 300;

    if (isLoading) return (
        <div className={cn("flex h-screen flex-col items-center justify-center gap-4", theme.colors.pageBackground)}>
            <Loader2 className="animate-spin text-pink-500" size={48} />
            <p className="text-pink-500 font-black font-outfit uppercase tracking-tighter">Initializing Mission Control...</p>
        </div>
    );

    if (error) return (
        <div className={cn("flex h-screen flex-col items-center justify-center gap-6 text-center p-6", theme.colors.pageBackground)}>
            <AlertCircle className="text-pink-500" size={64} />
            <div>
                <h1 className="text-3xl font-black text-gray-900 font-outfit uppercase">Connection Severed</h1>
                <p className="text-gray-600 mt-2 max-w-md">{error}</p>
            </div>
            <button
                onClick={() => router.push('/quiz/new')}
                className={cn(
                    "px-8 py-3 font-bold transition-all",
                    theme.colors.primaryButton,
                    theme.colors.primaryButtonText,
                    theme.effects.buttonRadius,
                    theme.effects.primaryButtonShadow
                )}
            >
                Return to Command Center
            </button>
        </div>
    );

    const question = questions[currentIndex];
    if (!question) return null;

    return (
        <div className={cn("h-[calc(100vh-64px)] flex flex-col overflow-hidden text-gray-900 font-inter selection:bg-pink-500/30", theme.colors.pageBackground)}>
            <HUDHeader
                examId={examId}
                timeLeft={timeLeft}
                isNearEnd={isNearEnd}
                formatTime={formatTime}
                onTerminate={() => setConfirmSubmit(true)}
                theme={theme}
            />

            <main className="flex-1 overflow-hidden max-w-[1400px] mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                <TacticalMap
                    questions={questions}
                    currentIndex={currentIndex}
                    answers={answers}
                    flags={flags}
                    onGoToQuestion={actions.goToQuestion}
                    theme={theme}
                />

                <div className="lg:col-span-9 space-y-6 order-1 lg:order-2 h-full overflow-hidden flex flex-col">
                    <QuestionView
                        question={question}
                        currentIndex={currentIndex}
                        answer={answers[question.questionId]}
                        isFlagged={!!flags[question.questionId]}
                        onSelectOption={actions.handleAnswer}
                        onToggleFlag={actions.toggleFlag}
                        theme={theme}
                    />

                    <HUDControls
                        currentIndex={currentIndex}
                        totalQuestions={questions.length}
                        onGoToQuestion={actions.goToQuestion}
                        onSubmit={() => setConfirmSubmit(true)}
                        isSubmitting={isSubmitting}
                        theme={theme}
                    />
                </div>
            </main>

            {/* MODALS */}
            {confirmSubmit && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl p-10 max-w-lg w-full text-center space-y-8 shadow-2xl animate-in zoom-in-95 duration-200 border border-gray-200">
                        <div className="w-20 h-20 rounded-full bg-pink-50 border-2 border-pink-200 flex items-center justify-center mx-auto">
                            <Info size={40} className="text-pink-500" />
                        </div>

                        <div>
                            <h2 className="text-3xl font-black font-outfit uppercase text-gray-900">Commit Evaluation?</h2>
                            <p className="text-gray-600 mt-4 leading-relaxed">
                                You have completed <span className="text-gray-900 font-bold">{Object.keys(answers).length} out of {questions.length}</span> objectives.
                                Terminating the session now will finalize your scores.
                            </p>
                        </div>

                        {Object.keys(answers).length < questions.length && (
                            <div className="bg-pink-50 border-2 border-pink-200 p-4 rounded-xl flex items-start gap-4 text-left">
                                <AlertCircle size={20} className="text-pink-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-pink-600 font-bold uppercase tracking-wide">
                                    Warning: Unanswered questions will be marked as incorrect.
                                </p>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setConfirmSubmit(false)}
                                className="px-8 py-4 rounded-xl border-2 border-gray-300 font-bold hover:bg-gray-50 transition-all text-sm uppercase tracking-widest text-gray-700"
                            >
                                Continue
                            </button>
                            <button
                                onClick={actions.submitExam}
                                disabled={isSubmitting}
                                className="px-8 py-4 rounded-xl bg-pink-500 text-white font-black font-outfit shadow-lg shadow-pink-500/20 hover:scale-105 transition-all text-sm uppercase flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Confirm Terminate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ExitConfirmationDialog
                isOpen={showExitDialog}
                onConfirm={confirmExit}
                onCancel={cancelExit}
                title="Leave Active Exam?"
                message="Your exam session is in progress. Leaving may result in data loss."
            />
        </div>
    );
}
