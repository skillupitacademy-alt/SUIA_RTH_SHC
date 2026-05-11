'use client';

import { type TutorialContentJSON } from '@quiz/types';
import React from 'react';

import { QuizHero } from './QuizHero';
import { QuestionCard } from './QuestionCard';
import { ScoreBoard } from './ScoreBoard';
import { ExplanationPanel } from './ExplanationPanel';
import { NextStepsCard } from './NextStepsCard';
import { QuizBadge } from './QuizBadge';
import { TimerPanel } from './TimerPanel';
import { PerformanceAnalytics } from './PerformanceAnalytics';
import { getLayoutStyle, pickSection, pickString, toRecord } from '../utils';

interface QuizModularRendererProps {
  data: NonNullable<TutorialContentJSON['quiz']>;
  themeColor: string;
}

export function QuizModularRenderer({ data, themeColor }: QuizModularRendererProps) {
  if (!data || typeof data !== 'object') return null;

  const m = toRecord(data);

  // Dynamic Layout Support
  const layoutStyle = getLayoutStyle(m);
  const spacing = pickString(m, 'spacing', '2rem');

  // Map schema keys
  const hero = pickSection(m, ['quizHero', 'quiz_intro_card', 'quizOverview']);
  const question = pickSection(m, ['questionCard', 'question_block', 'questions']);
  const explanation = pickSection(m, ['explanationPanel', 'instant_feedback_card']);
  const scoreboard = pickSection(m, ['scoreBoard', 'performance_snapshot_panel', 'quizResults']);
  const timer = pickSection(m, ['timerPanel', 'timed_challenge_panel']);
  const analytics = pickSection(m, ['performanceAnalytics', 'weakness_detection_block']);
  const badge = pickSection(m, ['quizBadge', 'performance_snapshot_panel']);
  const nextSteps = pickSection(m, ['nextStepsCard', 'next_step_recommendation_card']);

  return (
    <div className="flex flex-col" style={{ gap: spacing, ...layoutStyle }}>
      {hero && <QuizHero data={hero} />}
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3 flex flex-col gap-6">
          {question && <QuestionCard data={question} themeColor={themeColor} />}
          {explanation && <ExplanationPanel data={explanation} />}
        </div>
        <div className="flex flex-col gap-6">
          {scoreboard && <ScoreBoard data={scoreboard} />}
          {timer && <TimerPanel data={timer} />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {analytics && <PerformanceAnalytics data={analytics} />}
        <div className="flex flex-col gap-6">
          {badge && <QuizBadge data={badge} />}
          {nextSteps && <NextStepsCard data={nextSteps} />}
        </div>
      </div>
    </div>
  );
}
