'use client';

import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { SubtopicNotesViewData } from '../../../subtopicNotesData';

type InterviewData = NonNullable<SubtopicNotesViewData['mainContent']['interview']>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function text(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function records(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function strings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function InterviewPrepContent({ data, title }: { data?: InterviewData; title: string }) {
  const brand = useBrand();
  if (!data) return null;

  const intro = isRecord(data.interviewIntroCard) ? data.interviewIntroCard : {};
  const questionBank = isRecord(data.questionBankPanel) ? data.questionBankPanel : {};
  const answerFramework = isRecord(data.answerFrameworkCard) ? data.answerFrameworkCard : {};
  const mockFlow = isRecord(data.mockInterviewFlow) ? data.mockInterviewFlow : {};
  const questions = records(questionBank.questions);
  const framework = strings(answerFramework.framework);
  const rounds = records(mockFlow.rounds);

  return (
    <div className="min-w-0 space-y-8 pb-20">
      <section className="rounded-[32px] border border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-50 p-5 shadow-xl sm:p-10">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
            style={{ backgroundColor: brand.primaryColor }}
          >
            <Icons.MessagesSquare size={24} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-violet-800">Interview Prep</p>
            <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {text(data.title, `${title} Interview Prep`)}
            </h1>
            <p className="mt-3 break-words text-sm font-medium leading-6 text-slate-800">
              {text(data.description, `Practice how to explain ${title} clearly in technical interviews.`)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] bg-white p-5 shadow-xl sm:p-8">
        <div className="mb-4 flex items-center gap-3">
          <Icons.BadgeCheck size={22} className="text-violet-700" aria-hidden="true" />
          <h2 className="text-xl font-bold text-slate-950">{text(intro.headline, `How ${title} Appears in Interviews`)}</h2>
        </div>
        <p className="break-words text-[15px] font-medium leading-7 text-slate-800">
          {text(intro.overview, 'Interviewers usually check conceptual clarity, practical judgment, and awareness of tradeoffs.')}
        </p>
        {strings(intro.evaluationFocus).length > 0 ? (
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {strings(intro.evaluationFocus).map((focus, index) => (
              <div key={index} className="rounded-2xl border border-violet-100 bg-violet-50 p-4">
                <p className="text-sm font-bold text-violet-950">{focus}</p>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      {questions.length > 0 ? (
        <section className="rounded-[32px] bg-white p-5 shadow-xl sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <Icons.HelpCircle size={22} className="text-blue-700" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-950">{text(questionBank.title, 'Common Interview Questions')}</h2>
          </div>
          <div className="space-y-5">
            {questions.map((question, index) => (
              <article key={text(question.id, `question-${index}`)} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <span className="rounded-lg bg-slate-900 px-3 py-1 text-xs font-bold uppercase text-white">Q{index + 1}</span>
                  <span className="rounded-lg bg-white px-3 py-1 text-xs font-bold uppercase text-slate-700">{text(question.difficulty, 'medium')}</span>
                </div>
                <h3 className="break-words text-base font-bold text-slate-950">{text(question.question)}</h3>
                <p className="mt-3 break-words text-sm font-medium leading-6 text-slate-800">{text(question.idealAnswer)}</p>
                {strings(question.followUps).length > 0 ? (
                  <div className="mt-4">
                    <p className="mb-2 text-xs font-black uppercase tracking-wider text-blue-800">Follow-ups</p>
                    <ul className="space-y-2">
                      {strings(question.followUps).map((item, followUpIndex) => (
                        <li key={followUpIndex} className="flex items-start gap-2 text-sm font-medium text-slate-700">
                          <Icons.ChevronRight size={15} className="mt-0.5 shrink-0 text-blue-700" aria-hidden="true" />
                          <span className="break-words">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-[32px] bg-white p-5 shadow-xl sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <Icons.Route size={22} className="text-emerald-700" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-950">{text(answerFramework.title, 'Answer Framework')}</h2>
          </div>
          {framework.length > 0 ? (
            <ol className="space-y-3">
              {framework.map((step, index) => (
                <li key={index} className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-950">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs text-white">{index + 1}</span>
                  <span className="break-words">{step}</span>
                </li>
              ))}
            </ol>
          ) : null}
          {text(answerFramework.sampleStructure) ? (
            <p className="mt-5 break-words rounded-2xl border border-emerald-100 bg-white p-4 text-sm font-medium leading-6 text-slate-800">
              {text(answerFramework.sampleStructure)}
            </p>
          ) : null}
        </div>

        <div className="rounded-[32px] bg-white p-5 shadow-xl sm:p-8">
          <div className="mb-4 flex items-center gap-3">
            <Icons.UserRoundCheck size={22} className="text-amber-800" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-950">{text(mockFlow.title, 'Mock Interview Flow')}</h2>
          </div>
          <div className="space-y-3">
            {rounds.map((round, index) => (
              <div key={text(round.id, `round-${index}`)} className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
                <p className="text-sm font-bold text-amber-950">{text(round.focus, `Round ${index + 1}`)}</p>
                <p className="mt-2 break-words text-sm font-medium text-slate-800">{text(round.prompt)}</p>
                <p className="mt-2 break-words text-xs font-bold uppercase tracking-wider text-amber-900">{text(round.expectedSignal)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
