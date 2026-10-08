'use client';

import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type BatchOption = {
  id: string;
  name: string;
};

interface StudentCreateFormProps {
  batches: BatchOption[];
}

export function StudentCreateForm({ batches }: StudentCreateFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState('Fill the form to create a student.');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSaving(true);
    setStatus('Creating student...');

    try {
      const response = await fetch('/api/admin/students', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        setStatus('Unable to create student. Check the form and try again.');
        return;
      }

      setStatus('Student created successfully.');
      event.currentTarget.reset();
      router.refresh();
    } catch {
      setStatus('Unable to create student. Check the form and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          Full name
          <input
            name="name"
            placeholder="Aarav Patel"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Email address
          <input
            name="email"
            type="email"
            placeholder="aarav@example.com"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
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
        <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
          Batch label
          <input
            name="batchName"
            placeholder="Web Development - Morning"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
      </div>

      <div className="mt-6 rounded-3xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-slate-700">
        Create a live student record in the people database. The new profile will immediately appear in the student list.
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Creating...' : 'Create student'}
        </button>
        <p className="text-sm text-slate-600">{status}</p>
      </div>
    </form>
  );
}
