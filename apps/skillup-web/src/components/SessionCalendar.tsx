'use client';

import { useEffect, useRef, useState } from 'react';

import { formatDateTime } from '@/lib/skillup-format';
import type { SkillupSession } from '@/lib/skillup-types';

interface SessionCalendarProps {
  sessions: SkillupSession[];
}

export function SessionCalendar({ sessions }: SessionCalendarProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const activeTab = tabRefs.current[activeIndex];
    activeTab?.focus();
  }, [activeIndex]);

  return (
    <div className="grid gap-4 xl:grid-cols-[0.48fr_0.52fr]">
      <div role="tablist" aria-label="Session calendar" className="grid gap-3">
        {sessions.map((session, index) => {
          const selected = index === activeIndex;

          return (
            <button
              key={session.id}
              id={`session-tab-${session.id}`}
              ref={(element) => {
                tabRefs.current[index] = element;
              }}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`session-panel-${session.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => setActiveIndex(index)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowDown' || event.key === 'ArrowRight') {
                  event.preventDefault();
                  setActiveIndex((current) => (current + 1) % sessions.length);
                }
                if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') {
                  event.preventDefault();
                  setActiveIndex((current) => (current - 1 + sessions.length) % sessions.length);
                }
                if (event.key === 'Home') {
                  event.preventDefault();
                  setActiveIndex(0);
                }
                if (event.key === 'End') {
                  event.preventDefault();
                  setActiveIndex(sessions.length - 1);
                }
              }}
              className={`rounded-[1.5rem] border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 ${
                selected ? 'border-cyan-300 bg-cyan-50 shadow-sm' : 'border-slate-200 bg-white hover:border-cyan-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-800">{session.title}</p>
                <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-700">
                  {session.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-600">
                {formatDateTime(session.date)} - {session.mode}
              </p>
            </button>
          );
        })}
      </div>

      <article
        id={`session-panel-${sessions[activeIndex]?.id ?? 'session'}`}
        role="tabpanel"
        aria-labelledby={`session-tab-${sessions[activeIndex]?.id ?? 'session'}`}
        className="rounded-[1.75rem] border border-slate-200 bg-slate-50 p-6"
      >
        {sessions[activeIndex] ? (
          <>
            <p className="section-kicker text-slate-500">Selected session</p>
            <h4 className="mt-3 text-2xl font-black tracking-tight text-slate-950 font-outfit">{sessions[activeIndex].title}</h4>
            <p className="mt-3 text-sm leading-7 text-slate-600">
              Use the arrow keys to move between sessions. The current choice is announced through the tab selection state.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Date</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">{formatDateTime(sessions[activeIndex].date)}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Mode</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">{sessions[activeIndex].mode}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-white p-4 sm:col-span-2">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Recording</p>
                <p className="mt-2 text-sm font-semibold text-slate-800">{sessions[activeIndex].recording ?? 'Available after the session is completed'}</p>
              </div>
            </div>
          </>
        ) : null}
      </article>
    </div>
  );
}
