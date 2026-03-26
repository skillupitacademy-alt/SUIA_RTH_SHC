'use client';

import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function BatchCreateForm() {
  const router = useRouter();
  const [status, setStatus] = useState('Fill the form to create a batch.');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setStatus('Creating batch...');

    const formData = new FormData(event.currentTarget);

    try {
      const response = await fetch('/api/admin/batches', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          name: String(formData.get('name') ?? ''),
          facultyName: String(formData.get('facultyName') ?? ''),
          program: String(formData.get('program') ?? ''),
          capacity: Number(formData.get('capacity') ?? 0),
          startDate: String(formData.get('startDate') ?? ''),
          sessionTopic: String(formData.get('sessionTopic') ?? ''),
        }),
      });

      if (!response.ok) {
        setStatus('Unable to create batch. Check the form and try again.');
        return;
      }

      setStatus('Batch created successfully.');
      event.currentTarget.reset();
      router.refresh();
    } catch {
      setStatus('Unable to create batch. Check the form and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Batch name</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
            name="name"
            placeholder="React Full Stack - April 2026"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Faculty</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
            name="facultyName"
            placeholder="Neha Kapoor"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Program</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
            name="program"
            placeholder="Web Development"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Capacity</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
            name="capacity"
            placeholder="32"
          />
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Start date</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
            name="startDate"
            placeholder="2026-04-01"
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-semibold text-slate-700">Session topic</span>
          <input
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
            name="sessionTopic"
            placeholder="Hooks and state"
          />
        </label>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Creating...' : 'Create batch'}
        </button>
        <p className="text-sm text-slate-600">{status}</p>
      </div>
    </form>
  );
}
