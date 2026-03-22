'use client';

import { useState } from 'react';

import type { HelpRequestItem } from '@/lib/faculty-demo-data';

interface HelpRequestsPanelProps {
  requests: HelpRequestItem[];
}

export function HelpRequestsPanel({ requests }: HelpRequestsPanelProps) {
  const [items, setItems] = useState(requests);
  const updateStatus = async (id: string, status: HelpRequestItem['status']) => {
    setItems((current) => current.map((item) => (item.id === id ? { ...item, status } : item)));
    await fetch(`/api/faculty/help-requests/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ status, resolvedAt: status === 'resolved' ? new Date().toISOString() : null }),
    });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((request) => (
        <article key={request.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">{request.studentName}</p>
              <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">{request.subtopic}</h3>
            </div>
            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black uppercase tracking-[0.25em] text-cyan-700">
              {request.status}
            </span>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">{request.question}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void updateStatus(request.id, 'in_progress')}
              className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50"
            >
              In progress
            </button>
            <button
              type="button"
              onClick={() => void updateStatus(request.id, 'resolved')}
              className="rounded-full border border-slate-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100"
            >
              Resolved
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
