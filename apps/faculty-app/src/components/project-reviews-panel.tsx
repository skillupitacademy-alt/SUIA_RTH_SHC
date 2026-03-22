'use client';

import { useState } from 'react';

import type { ProjectReviewItem } from '@/lib/faculty-demo-data';

interface ProjectReviewsPanelProps {
  submissions: ProjectReviewItem[];
}

export function ProjectReviewsPanel({ submissions }: ProjectReviewsPanelProps) {
  const [items, setItems] = useState(submissions);

  const submitDecision = async (id: string, action: 'approve' | 'request-revision') => {
    setItems((current) => current.filter((item) => item.id !== id));
    await fetch(`/api/faculty/project-reviews/${id}/${action === 'approve' ? 'approve' : 'request-revision'}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(action === 'approve' ? { notes: 'Reviewed by faculty' } : { notes: 'Please revise the checklist gaps.' }),
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((submission) => (
        <article key={submission.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">{submission.studentName}</p>
              <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">{submission.projectName}</h3>
            </div>
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black uppercase tracking-[0.25em] text-amber-700">
              {submission.status}
            </span>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">{submission.aiFeedback}</p>
          <ul className="mt-4 space-y-2 text-sm text-slate-600">
            {submission.checklist.map((item) => (
              <li key={item.label} className="flex items-center justify-between rounded-2xl bg-slate-50 px-3 py-2">
                <span>{item.label}</span>
                <span className={item.passed ? 'font-semibold text-emerald-700' : 'font-semibold text-rose-700'}>
                  {item.passed ? 'Pass' : 'Review'}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void submitDecision(submission.id, 'approve')}
              className="rounded-full border border-slate-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
            >
              Approve
            </button>
            <button
              type="button"
              onClick={() => void submitDecision(submission.id, 'request-revision')}
              className="rounded-full border border-slate-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700 transition hover:border-amber-300 hover:bg-amber-100"
            >
              Request revision
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
