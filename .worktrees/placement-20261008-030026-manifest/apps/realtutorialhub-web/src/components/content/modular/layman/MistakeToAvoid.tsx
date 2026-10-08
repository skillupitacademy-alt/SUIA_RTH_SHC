'use client';

import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, HelpCircle } from 'lucide-react';

interface MistakeToAvoidProps {
  data: {
    title: string;
    confusionItems: Array<{
      id: string;
      confusion: string;
      clarification: string;
    }>;
    faqItems: Array<{
      id: string;
      question: string;
      answer: string;
    }>;
    misconceptionAlerts: string[];
  };
  sectionNumber?: number;
}

export function MistakeToAvoid({ data, sectionNumber = 7 }: MistakeToAvoidProps) {
  const [openFaqId, setOpenFaqId] = useState<string>(data.faqItems[0]?.id ?? '');

  if (!data) return null;

  return (
    <section className="rounded-[28px] border border-rose-200 bg-white p-7 shadow-[0_20px_50px_rgba(15,23,42,0.08)] h-full">
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-rose-500 text-lg font-black text-white">
          {sectionNumber}
        </div>
        <h3 className="text-3xl font-black tracking-tight text-slate-950">{data.title}</h3>
      </div>

      <div className="space-y-4">
        {data.confusionItems.map((item) => (
          <article key={item.id} className="rounded-2xl border border-rose-200 bg-rose-50 p-4">
            <div className="flex items-start gap-3">
              <HelpCircle className="mt-0.5 shrink-0 text-rose-600" size={18} />
              <div>
                <h4 className="text-sm font-black text-slate-950">{item.confusion}</h4>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-700">{item.clarification}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      <div className="mt-6 space-y-3">
        {data.faqItems.map((item) => {
          const isOpen = openFaqId === item.id;
          return (
            <div key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <button
                type="button"
                className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left"
                onClick={() => setOpenFaqId(isOpen ? '' : item.id)}
                aria-expanded={isOpen}
              >
                <span className="text-sm font-bold text-slate-900">{item.question}</span>
                <ChevronDown size={18} className={`shrink-0 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>
              {isOpen ? <p className="border-t border-slate-100 px-4 py-4 text-sm font-medium leading-6 text-slate-700">{item.answer}</p> : null}
            </div>
          );
        })}
      </div>

      {data.misconceptionAlerts.length > 0 ? (
        <div className="mt-6 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-rose-700">
            <AlertTriangle size={14} />
            Myth Check
          </div>
          <ul className="space-y-2">
            {data.misconceptionAlerts.map((alert, index) => (
              <li key={index} className="text-sm font-semibold leading-6 text-rose-950">
                {alert}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
