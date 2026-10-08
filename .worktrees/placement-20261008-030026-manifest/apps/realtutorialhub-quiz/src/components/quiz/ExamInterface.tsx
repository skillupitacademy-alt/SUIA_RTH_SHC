'use client';

import { useExamInterfaceLogic } from '@/hooks/useExamInterfaceLogic';

import { EnterpriseHeader } from './EnterpriseHeader';
import { EnterpriseQuestionView } from './EnterpriseQuestionView';
import { EnterpriseControls } from './EnterpriseControls';

export function ExamInterface() {
    const {
        questions,
        answers,
        markedForReview,
        timeLeft,
        currentQuestionIndex,
        isLoading,
        isSubmitting,
        error,
        actions
    } = useExamInterfaceLogic();

    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${sec.toString().padStart(2, '0')}`;
    };

    if (isLoading) {
        return (
            <div className="flex flex-col min-h-[calc(100vh-64px)] bg-muted/5 items-center justify-center">
                <p className="text-xl font-bold text-primary animate-pulse">Loading Exam...</p>
            </div>
        );
    }

    const question = questions[currentQuestionIndex];
    if (!question) return null;

    return (
        <div className="flex flex-col h-[calc(100vh-64px)] w-full overflow-hidden bg-muted/5">
            <EnterpriseHeader
                error={error}
                setError={actions.setError}
                questions={questions}
                currentQuestionIndex={currentQuestionIndex}
                answers={answers}
                markedForReview={markedForReview}
                timeLeft={timeLeft}
                formatTime={formatTime}
                onSetCurrentIndex={actions.setCurrentIndex}
                onFinish={actions.handleFinish}
                isSubmitting={isSubmitting}
            />

            <main className="flex-1 overflow-hidden w-full max-w-5xl mx-auto p-4 md:p-6 lg:p-8 flex flex-col">
                <div className="bg-background border rounded-[2rem] shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
                    <EnterpriseQuestionView
                        question={question}
                        currentQuestionIndex={currentQuestionIndex}
                        totalQuestions={questions.length}
                        answerIndex={answers[question.id]}
                        onAnswer={actions.setAnswer}
                    />

                    <EnterpriseControls
                        currentQuestionIndex={currentQuestionIndex}
                        totalQuestions={questions.length}
                        questionId={question.id}
                        isMarkedForReview={markedForReview.includes(question.id)}
                        onSetCurrentIndex={actions.setCurrentIndex}
                        onToggleReview={actions.toggleReview}
                        onFinish={actions.handleFinish}
                        isSubmitting={isSubmitting}
                    />
                </div>

                {/* Legend */}
                <div className="mt-4 flex shrink-0 flex-wrap justify-center gap-6 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-primary" /> Active</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-green-500" /> Answered</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-orange-500" /> Review</div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-muted" /> Unvisited</div>
                </div>
            </main>
        </div>
    );
}
