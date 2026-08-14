'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { BrandConfig } from '../../brandConfig';
import { ActionBar } from './ActionBar';
import { AnswerPane } from './AnswerPane';
import { Header } from './Header';
import { LegendCard } from './LegendCard';
import { ProgressOverviewCard } from './ProgressOverviewCard';
import { QuestionPane } from './QuestionPane';
import { CardThemeMode, EXAM_CARD_THEMES } from './cardThemes';
import { ExamSessionData } from './examSession';

interface ExamEngineProps {
  brand: BrandConfig;
  session?: ExamSessionData;
}

export function ExamEngine({ brand, session }: ExamEngineProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTracker, setShowTracker] = useState(true);
  const [showOverview, setShowOverview] = useState(true);
  const [themeMode, setThemeMode] = useState<CardThemeMode>('high-clarity');
  const [answersByQuestionId, setAnswersByQuestionId] = useState<Record<string, string[]>>({});
  const [completedQuestionIds, setCompletedQuestionIds] = useState<Set<string>>(
    () => new Set(session?.questions.filter((question) => question.status === 'completed').map((question) => question.id) ?? [])
  );
  const [markedQuestionIds, setMarkedQuestionIds] = useState<Set<string>>(
    () => new Set(session?.questions.filter((question) => question.status === 'marked').map((question) => question.id) ?? [])
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  
  // 🔴 NEW: Real-time countdown timer
  const [timeRemaining, setTimeRemaining] = useState<string>(session?.progress.timeRemainingLabel ?? '00m 00s');
  const [examStartTime] = useState<number>(() => Date.now());
  
  // Calculate initial remaining seconds from the label
  const parseTimeLabel = (label: string): number => {
    const match = label.match(/(\d+)m(?:\s*(\d+)s)?/);
    if (!match) return 0;
    const minutes = parseInt(match[1], 10);
    const seconds = parseInt(match[2] || '0', 10);
    return minutes * 60 + seconds;
  };
  
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => 
    parseTimeLabel(session?.progress.timeRemainingLabel ?? '00m 00s')
  );
  
  // 🔴 NEW: Countdown timer effect
  useEffect(() => {
    if (remainingSeconds <= 0) return;
    
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Auto-submit when time runs out
          if (session?.examId && session.examId !== 'demo') {
            handleSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(interval);
  }, [remainingSeconds, session?.examId]);
  
  // 🔴 NEW: Format remaining seconds as "Xm Ys"
  useEffect(() => {
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    setTimeRemaining(`${minutes}m ${seconds.toString().padStart(2, '0')}s`);
  }, [remainingSeconds]);
  if (!session || session.questions.length === 0) {
    return null;
  }

  const currentScenario = session.questions[currentIndex] ?? session.questions[0];
  const cardTheme = EXAM_CARD_THEMES[themeMode];
  const questionsWithLocalStatus = session.questions.map((question) => ({
    ...question,
    status: markedQuestionIds.has(question.id)
      ? 'marked' as const
      : completedQuestionIds.has(question.id) || (answersByQuestionId[question.id]?.length ?? 0) > 0
        ? 'completed' as const
        : question.status,
  }));
  const answeredCount = questionsWithLocalStatus.filter((question) => question.status === 'completed' || (answersByQuestionId[question.id]?.length ?? 0) > 0).length;
  const markedCount = markedQuestionIds.size;
  const remainingCount = Math.max(0, session.questions.length - answeredCount);
  const desktopStats = [
    { label: 'Answered', value: String(answeredCount).padStart(2, '0') },
    { label: 'Marked', value: String(markedCount).padStart(2, '0') },
    { label: 'Remaining', value: String(remainingCount).padStart(2, '0') },
    { label: 'Time Left', value: timeRemaining }, // Use dynamic time instead of static label
  ];

  const saveCurrentAnswer = async () => {
    if (session.examId === undefined || session.examId === 'demo') {
      return;
    }

    const selected = answersByQuestionId[currentScenario.id] ?? [];
    if (selected.length === 0) {
      return;
    }

    setIsSaving(true);
    setActionError(null);

    try {
      const response = await fetch('/api/quiz/answer', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({
          examId: session.examId,
          questionId: currentScenario.id,
          answer: currentScenario.multiSelect ? JSON.stringify(selected) : selected[0],
        }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
        throw new Error(payload?.error ?? payload?.message ?? 'Unable to save answer.');
      }

      setCompletedQuestionIds((current) => new Set(current).add(currentScenario.id));
    } finally {
      setIsSaving(false);
    }
  };

  const handleNext = async () => {
    try {
      await saveCurrentAnswer();
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to save answer.');
      return;
    }

    setCurrentIndex((prev) => (prev + 1) % session.questions.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? session.questions.length - 1 : prev - 1));
  };

  const handleSubmit = async () => {
    if (session.examId === undefined || session.examId === 'demo') {
      return;
    }

    setIsSubmitting(true);
    setActionError(null);

    try {
      await saveCurrentAnswer();

      const response = await fetch('/api/quiz/submit', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': crypto.randomUUID(),
        },
        body: JSON.stringify({ examId: session.examId }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
        throw new Error(payload?.error ?? payload?.message ?? 'Unable to submit exam.');
      }

      router.push(`/result?examId=${encodeURIComponent(session.examId)}`);
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Unable to submit exam.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const desktopMainClassName = showTracker
    ? 'xl:h-[calc(100vh-139px)] xl:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] xl:grid-rows-[minmax(0,0.5fr)_minmax(0,0.5fr)]'
    : 'xl:h-[calc(100vh-139px)] xl:grid-cols-[minmax(0,0.42fr)_minmax(0,0.58fr)] xl:grid-rows-[minmax(0,1fr)]';

  return (
    <div className="min-h-screen overflow-x-hidden bg-slate-100 xl:overflow-hidden">
      <Header
        brand={brand}
        breadcrumb={session.breadcrumb}
        desktopStats={desktopStats}
        showOverview={showOverview}
        themeMode={themeMode}
        student={session.student}
      />

      <main className={`grid gap-4 px-3 py-3 pb-24 sm:px-4 sm:py-4 sm:pb-24 xl:gap-4 xl:px-4 xl:py-4 xl:pb-[4vh] ${desktopMainClassName}`}>
        {actionError !== null && (
          <div className="order-first rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 xl:col-span-2">
            {actionError}
          </div>
        )}
        <div
          className={`order-1 min-h-[320px] overflow-hidden rounded-2xl border shadow-2xl xl:col-start-1 xl:row-start-1 xl:h-full xl:min-h-0 ${
            !showTracker ? 'xl:row-span-2' : ''
          }`}
          style={{ backgroundColor: cardTheme.shellSurface, borderColor: cardTheme.shellBorder }}
        >
          <QuestionPane
            questionNumber={currentScenario.question.number}
            questionText={currentScenario.question.text}
            code={currentScenario.question.code}
            primaryAccent={brand.primaryColor}
            secondaryAccent={brand.secondaryColor}
            cardTheme={cardTheme}
          />
        </div>

        <div
          className="order-2 min-h-[420px] overflow-hidden rounded-2xl border shadow-2xl xl:col-start-2 xl:row-start-1 xl:row-span-full xl:h-full xl:min-h-0"
          style={{ backgroundColor: cardTheme.shellSurface, borderColor: cardTheme.shellBorder }}
        >
          <AnswerPane
            options={currentScenario.answers}
            primaryAccent={brand.primaryColorDark}
            primaryTint={`rgba(${brand.primaryRgb}, 0.05)`}
            multiSelect={currentScenario.multiSelect}
            cardTheme={cardTheme}
            selectedIds={answersByQuestionId[currentScenario.id] ?? []}
            onSelectionChange={(selectedIds) => {
              setAnswersByQuestionId((current) => ({
                ...current,
                [currentScenario.id]: selectedIds,
              }));
            }}
          />
        </div>

        {showTracker && (
          <div
            className="order-3 min-h-[240px] overflow-hidden rounded-2xl border shadow-2xl xl:col-start-1 xl:row-start-2 xl:h-full xl:min-h-0"
            style={{ backgroundColor: cardTheme.shellSurface, borderColor: cardTheme.shellBorder }}
          >
            <LegendCard
              primaryAccent={brand.primaryColor}
              currentQuestionNumber={currentScenario.question.number}
              questions={questionsWithLocalStatus}
              cardTheme={cardTheme}
              onQuestionSelect={setCurrentIndex}
            />
          </div>
        )}

        {showOverview && (
          <div
            className="order-4 overflow-hidden rounded-2xl border shadow-2xl xl:hidden"
            style={{ backgroundColor: cardTheme.shellSurface, borderColor: cardTheme.shellBorder }}
          >
            <ProgressOverviewCard
              primaryAccent={brand.primaryColor}
              totalQuestions={session.questions.length}
              progress={{
                ...session.progress,
                answeredCount,
                markedCount,
                remainingCount,
              }}
              cardTheme={cardTheme}
            />
          </div>
        )}
      </main>

      <ActionBar
        primaryAccent={brand.primaryColorDark}
        secondaryAccent={brand.secondaryColor}
        onNext={() => void handleNext()}
        onPrevious={handlePrev}
        showTracker={showTracker}
        onToggleTracker={() => setShowTracker(!showTracker)}
        showOverview={showOverview}
        onToggleOverview={() => setShowOverview(!showOverview)}
        themeMode={themeMode}
        onThemeChange={setThemeMode}
        onSubmit={() => void handleSubmit()}
        onToggleMark={() => {
          setMarkedQuestionIds((current) => {
            const next = new Set(current);
            if (next.has(currentScenario.id)) {
              next.delete(currentScenario.id);
            } else {
              next.add(currentScenario.id);
            }
            return next;
          });
        }}
        isMarked={markedQuestionIds.has(currentScenario.id)}
        isSaving={isSaving}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
