'use client';

import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function PlacementJobCreateForm() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('Fill the form to publish a job posting.');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSaving(true);
    setStatus('Publishing job...');

    try {
      const response = await fetch('/api/admin/placement/jobs', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        setStatus('Unable to publish job. Please check the inputs.');
        return;
      }

      setStatus('Job published.');
      event.currentTarget.reset();
      router.refresh();
    } catch {
      setStatus('Unable to publish job. Please check the inputs.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          Company
          <input
            name="company"
            placeholder="InfoEdge"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Title
          <input
            name="title"
            placeholder="Frontend Engineer"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Location
          <input
            name="location"
            placeholder="Remote"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Match score
          <input
            name="matchScore"
            type="number"
            min={0}
            max={100}
            placeholder="92"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
          Active
          <select
            name="isActive"
            defaultValue="true"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          >
            <option value="true">true</option>
            <option value="false">false</option>
          </select>
        </label>
      </div>

      <div className="mt-6 rounded-3xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-slate-700">
        Publish a live job posting into the placement job table. It will appear immediately in the listing after refresh.
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Publishing...' : 'Publish job'}
        </button>
        <p className="text-sm text-slate-600">{status}</p>
      </div>
    </form>
  );
}
