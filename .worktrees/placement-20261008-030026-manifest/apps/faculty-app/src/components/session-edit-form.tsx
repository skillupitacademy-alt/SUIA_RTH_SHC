'use client';

import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { FacultyUpcomingSessionItem } from '@/lib/faculty-live-data';

interface SessionEditFormProps {
  session: FacultyUpcomingSessionItem;
}

function toInputValue(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toISOString().slice(0, 16);
}

export function SessionEditForm({ session }: SessionEditFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState('Review the session details below.');
  const [saving, setSaving] = useState(false);
  const [scheduledAt, setScheduledAt] = useState(toInputValue(session.scheduledAt));
  const [durationMinutes, setDurationMinutes] = useState(String(session.durationMinutes));
  const [sessionNotes, setSessionNotes] = useState(session.sessionNotes);
  const [sessionStatus, setSessionStatus] = useState(session.status);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setStatus('Saving session...');

    try {
      const response = await fetch(`/api/faculty/sessions/${session.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          scheduledAt: scheduledAt.length > 0 ? new Date(scheduledAt).toISOString() : undefined,
          durationMinutes: Number(durationMinutes),
          sessionNotes,
          status: sessionStatus,
        }),
      });

      if (!response.ok) {
        setStatus('Unable to update the session. Try again.');
        return;
      }

      setStatus('Session updated.');
      router.refresh();
    } catch {
      setStatus('Unable to update the session. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-600">Edit session</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          Scheduled at
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(event) => setScheduledAt(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Duration minutes
          <input
            type="number"
            min={30}
            max={480}
            value={durationMinutes}
            onChange={(event) => setDurationMinutes(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
          Session notes
          <textarea
            value={sessionNotes}
            onChange={(event) => setSessionNotes(event.target.value)}
            rows={4}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
          Status
          <select
            value={sessionStatus}
            onChange={(event) => setSessionStatus(event.target.value as FacultyUpcomingSessionItem['status'])}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          >
            <option value="scheduled">scheduled</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
          </select>
        </label>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save session'}
        </button>
        <p className="text-sm text-slate-600">{status}</p>
      </div>
    </form>
  );
}
