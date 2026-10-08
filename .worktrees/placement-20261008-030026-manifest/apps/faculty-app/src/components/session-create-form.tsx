'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';

import type { FacultyBatchSummary } from '@/lib/faculty-live-data';

interface SessionCreateFormProps {
  batches: FacultyBatchSummary[];
}

export function SessionCreateForm({ batches }: SessionCreateFormProps) {
  const [status, setStatus] = useState('Ready to schedule.');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setStatus('Scheduling session...');
    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch('/api/faculty/sessions', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          batchId: String(formData.get('batchId') ?? ''),
          scheduledAt: String(formData.get('scheduledAt') ?? ''),
          durationMinutes: Number(formData.get('durationMinutes') ?? 60),
          sessionNotes: String(formData.get('sessionNotes') ?? ''),
        }),
      });

      if (!response.ok) {
        setStatus('Unable to create the session. Try again.');
        return;
      }

      setStatus('Session scheduled.');
      event.currentTarget.reset();
    } catch {
      setStatus('Unable to create the session. Try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-600">Create session</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
          Batch
          <select
            name="batchId"
            defaultValue={batches[0]?.id ?? ''}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          >
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Scheduled at
          <input
            name="scheduledAt"
            type="datetime-local"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Duration minutes
          <input
            name="durationMinutes"
            type="number"
            min={30}
            max={480}
            defaultValue={60}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
          Session notes
          <textarea
            name="sessionNotes"
            rows={3}
            placeholder="React hooks and form state"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
      </div>
      <div className="mt-5 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving || batches.length === 0}
          className="rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Scheduling...' : 'Schedule session'}
        </button>
        <p className="text-sm text-slate-600">{status}</p>
      </div>
    </form>
  );
}
