'use client';

import React from 'react';
import type { TutorialContentJSON } from '@quiz/types';

import { QuizHero } from './QuizHero';
import { QuestionCard } from './QuestionCard';
import { ScoreBoard } from './ScoreBoard';
import { ExplanationPanel } from './ExplanationPanel';
import { NextStepsCard } from './NextStepsCard';
import { QuizBadge } from './QuizBadge';
import { TimerPanel } from './TimerPanel';
import { PerformanceAnalytics } from './PerformanceAnalytics';

interface QuizModularRendererProps {
  data: any;
  themeColor: string;
}

export function QuizModularRenderer({ data, themeColor }: QuizModularRendererProps) {
  if (!data || typeof data !== 'object') return null;

    // Dynamic Layout Support
  const layoutStyle = data.layout || {};
  const spacing = data.spacing || "2rem";

return (
    <div className="flex flex-col" style={{ gap: spacing, padding: layoutStyle.padding, margin: layoutStyle.margin, ...layoutStyle.customStyles }}>
      {data.quizHero && <QuizHero data={data.quizHero} themeColor={themeColor} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 flex flex-col gap-6">
          {data.questionCard && <QuestionCard data={data.questionCard} themeColor={themeColor} />}
          {data.explanationPanel && <ExplanationPanel data={data.explanationPanel} themeColor={themeColor} />}
        </div>
        <div className="flex flex-col gap-6">
          {data.scoreBoard && <ScoreBoard data={data.scoreBoard} themeColor={themeColor} />}
          {data.timerPanel && <TimerPanel data={data.timerPanel} themeColor={themeColor} />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {data.performanceAnalytics && <PerformanceAnalytics data={data.performanceAnalytics} themeColor={themeColor} />}
        <div className="flex flex-col gap-6">
          {data.quizBadge && <QuizBadge data={data.quizBadge} themeColor={themeColor} />}
          {data.nextStepsCard && <NextStepsCard data={data.nextStepsCard} themeColor={themeColor} />}
        </div>
      </div>
    </div>
  );
}
