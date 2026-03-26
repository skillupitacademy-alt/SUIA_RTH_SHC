'use client';

import Link from 'next/link';
import { useState } from 'react';

import type { FacultySessionRequestItem as SessionRequestItem } from '@/lib/faculty-live-data';

interface SessionRequestsPanelProps {
  requests: SessionRequestItem[];
}

export function SessionRequestsPanel({ requests }: SessionRequestsPanelProps) {
  const [items, setItems] = useState(requests);
  const [meetingLinks, setMeetingLinks] = useState<Record<string, string>>({});
  const [statuses, setStatuses] = useState<Record<string, SessionRequestItem['status']>>({});

  const acceptRequest = async (id: string) => {
    const meetingLink = meetingLinks[id]?.trim();
    if (!meetingLink) return;

    setItems((current) => current.filter((item) => item.id !== id));
    await fetch(`/api/faculty/session-requests/${id}/accept`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ meetingLink }),
    });
  };

  const updateRequest = async (id: string) => {
    const status = statuses[id] ?? 'pending';
    const meetingLink = meetingLinks[id]?.trim();
    const response = await fetch(`/api/faculty/session-requests/${id}`, {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        status,
        meetingLink: meetingLink.length > 0 ? meetingLink : null,
      }),
    });

    if (response.ok && status === 'cancelled') {
      setItems((current) => current.filter((item) => item.id !== id));
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {items.map((request) => (
        <article key={request.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-slate-500">{request.studentName}</p>
              <h3 className="mt-1 text-xl font-black tracking-tight text-slate-950">
                <Link href={`/sessions/requests/${request.id}`} className="transition hover:text-cyan-700">
                  {request.subtopic}
                </Link>
              </h3>
            </div>
            <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-black uppercase tracking-[0.25em] text-cyan-700">
              {request.status}
            </span>
          </div>
          <p className="mt-4 text-sm leading-7 text-slate-600">{request.doubtText}</p>
          <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-500">{request.batchName}</p>
          <label className="mt-4 block text-sm font-semibold text-slate-700">
            Meeting link
            <input
              value={meetingLinks[request.id] ?? ''}
              onChange={(event) => setMeetingLinks((current) => ({ ...current, [request.id]: event.target.value }))}
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
              placeholder="https://meet.google.com/..."
            />
          </label>
          <label className="mt-4 block text-sm font-semibold text-slate-700">
            Status
            <select
              value={statuses[request.id] ?? request.status}
              onChange={(event) =>
                setStatuses((current) => ({
                  ...current,
                  [request.id]: event.target.value as SessionRequestItem['status'],
                }))
              }
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
            >
              <option value="pending">pending</option>
              <option value="accepted">accepted</option>
              <option value="scheduled">scheduled</option>
              <option value="completed">completed</option>
              <option value="cancelled">cancelled</option>
            </select>
          </label>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void acceptRequest(request.id)}
              className="rounded-full bg-cyan-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-cyan-700"
            >
              Accept request
            </button>
            <button
              type="button"
              onClick={() => void updateRequest(request.id)}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50"
            >
              Save status
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
