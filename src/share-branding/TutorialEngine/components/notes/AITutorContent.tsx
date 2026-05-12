'use client';

import React from 'react';
import * as Icons from 'lucide-react';
import { useBrand } from '../../../PostLandingPage/app/context/BrandContext';
import { SubtopicNotesViewData } from '../../../subtopicNotesData';

type TutorData = NonNullable<SubtopicNotesViewData['mainContent']['aiTutorContent']>;
type SidebarTutor = SubtopicNotesViewData['rightSidebar']['aiTutor'];

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

export function AITutorContent({
  data,
  sidebar,
  title,
}: {
  data?: TutorData;
  sidebar: SidebarTutor;
  title: string;
}) {
  const brand = useBrand();
  const tutorPrompt = isRecord(data?.tutorPromptCard) ? data.tutorPromptCard : {};
  const misconceptionDetector = isRecord(data?.misconceptionDetector) ? data.misconceptionDetector : {};
  const adaptiveHintPanel = isRecord(data?.adaptiveHintPanel) ? data.adaptiveHintPanel : {};
  const qaPairs = records(data?.qaPairs);
  const misconceptions = records(misconceptionDetector.misconceptions);
  const hints = records(adaptiveHintPanel.hints);
  const starterQuestions = strings(tutorPrompt.starterQuestions);

  return (
    <div className="min-w-0 space-y-8 pb-20">
      <section className="rounded-[32px] border border-sky-100 bg-gradient-to-br from-sky-50 to-indigo-50 p-5 shadow-xl sm:p-10">
        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
          <div
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
            style={{ backgroundColor: brand.primaryColor }}
          >
            <Icons.Bot size={24} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-sky-800">{brand.tutorLabel || 'AI Tutor'}</p>
            <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {sidebar.title}
            </h1>
            <p className="mt-3 break-words text-sm font-medium leading-6 text-slate-800">
              {text(data?.greeting, `Ask focused questions about ${title}, examples, mistakes, or interview answers.`)}
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[32px] bg-white p-5 shadow-xl sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <Icons.MessageCircleQuestion size={22} className="text-sky-700" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-950">Tutor Q&A</h2>
          </div>
          <div className="space-y-4">
            {(qaPairs.length > 0 ? qaPairs : sidebar.messages.map((message, index) => ({
              question: message.sender === 'user' ? message.text : `Tutor note ${index + 1}`,
              answer: message.sender === 'bot' ? message.text : '',
            }))).map((pair, index) => (
              <article key={index} className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="break-words text-sm font-bold text-slate-950">{text(pair.question, `Question ${index + 1}`)}</p>
                <p className="mt-3 break-words text-sm font-medium leading-6 text-slate-800">{text(pair.answer, 'Use the tutor input below to ask this question live.')}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="rounded-[32px] bg-white p-5 shadow-xl sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <Icons.Sparkles size={22} className="text-indigo-700" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-950">{text(tutorPrompt.title, 'Starter Questions')}</h2>
          </div>
          <div className="space-y-3">
            {(starterQuestions.length > 0 ? starterQuestions : [
              `Explain ${title} in simple words`,
              `Show me a practical example of ${title}`,
              `What mistakes should I avoid in ${title}?`,
            ]).map((question, index) => (
              <div key={index} className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-sm font-bold text-indigo-950">
                {question}
              </div>
            ))}
          </div>
          {text(tutorPrompt.systemPrompt) ? (
            <p className="mt-5 break-words rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs font-medium leading-5 text-slate-700">
              {text(tutorPrompt.systemPrompt)}
            </p>
          ) : null}
        </div>
      </section>

      {misconceptions.length > 0 ? (
        <section className="rounded-[32px] bg-white p-5 shadow-xl sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <Icons.AlertTriangle size={22} className="text-amber-800" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-950">{text(misconceptionDetector.title, 'Common Misconceptions')}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {misconceptions.map((item, index) => (
              <article key={text(item.id, `misconception-${index}`)} className="rounded-2xl border border-amber-100 bg-amber-50 p-5">
                <p className="break-words text-sm font-bold text-amber-950">{text(item.wrongBelief, `Misconception ${index + 1}`)}</p>
                <p className="mt-2 break-words text-sm font-medium leading-6 text-slate-800">{text(item.correction)}</p>
                {text(item.example) ? (
                  <p className="mt-3 break-words text-xs font-bold uppercase tracking-wider text-amber-900">{text(item.example)}</p>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {hints.length > 0 ? (
        <section className="rounded-[32px] bg-white p-5 shadow-xl sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <Icons.Lightbulb size={22} className="text-emerald-700" aria-hidden="true" />
            <h2 className="text-xl font-bold text-slate-950">{text(adaptiveHintPanel.title, 'Adaptive Hints')}</h2>
          </div>
          <div className="space-y-3">
            {hints.map((hint, index) => (
              <div key={index} className="flex items-start gap-3 rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-xs font-bold text-white">
                  {text(hint.level, String(index + 1))}
                </span>
                <p className="break-words text-sm font-bold text-emerald-950">{text(hint.hint)}</p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-[32px] border-t border-white/60 bg-white/80 p-5 shadow-2xl backdrop-blur-xl sm:p-8">
        <div className="space-y-4">
          {sidebar.messages.map((message, index) => (
            <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-full rounded-2xl px-4 py-3 text-sm font-medium leading-relaxed text-slate-950 shadow-sm sm:max-w-[80%]"
                style={{ backgroundColor: message.sender === 'user' ? `${brand.primaryColor}15` : '#f8fafc' }}
              >
                <p className="break-words">{message.text}</p>
                <p className="mt-2 text-[10px] font-bold text-slate-600">{message.time}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="relative mt-5">
          <input
            type="text"
            aria-label={`Ask ${brand.tutorLabel || 'AI Tutor'}`}
            placeholder={sidebar.inputPlaceholder}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-12 text-sm font-medium text-slate-950 placeholder:text-slate-700 focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': brand.primaryColor } as React.CSSProperties}
          />
          <button className="absolute right-3 top-2.5 rounded-xl p-1.5 text-white" style={{ backgroundColor: brand.primaryColor }} aria-label="Send message">
            <Icons.Send size={16} aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  );
}
