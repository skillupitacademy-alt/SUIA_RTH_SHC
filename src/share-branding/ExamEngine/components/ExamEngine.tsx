'use client';

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
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTracker, setShowTracker] = useState(true);
  const [showOverview, setShowOverview] = useState(true);
  const [themeMode, setThemeMode] = useState<CardThemeMode>('high-clarity');
  if (!session || session.questions.length === 0) {
    return null;
  }

  const currentScenario = session.questions[currentIndex] ?? session.questions[0];
  const cardTheme = EXAM_CARD_THEMES[themeMode];
  const desktopStats = [
    { label: 'Answered', value: String(session.progress.answeredCount).padStart(2, '0') },
    { label: 'Marked', value: String(session.progress.markedCount).padStart(2, '0') },
    { label: 'Remaining', value: String(session.progress.remainingCount).padStart(2, '0') },
    { label: 'Time Left', value: session.progress.timeRemainingLabel },
  ];

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % session.questions.length);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? session.questions.length - 1 : prev - 1));
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
              questions={session.questions}
              cardTheme={cardTheme}
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
              progress={session.progress}
              cardTheme={cardTheme}
            />
          </div>
        )}
      </main>

      <ActionBar
        primaryAccent={brand.primaryColorDark}
        secondaryAccent={brand.secondaryColor}
        onNext={handleNext}
        onPrevious={handlePrev}
        showTracker={showTracker}
        onToggleTracker={() => setShowTracker(!showTracker)}
        showOverview={showOverview}
        onToggleOverview={() => setShowOverview(!showOverview)}
        themeMode={themeMode}
        onThemeChange={setThemeMode}
      />
    </div>
  );
}
