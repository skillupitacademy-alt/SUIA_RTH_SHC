'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';

type StudentBatchOption = {
  id: string;
  name: string;
};

type StudentDetail = {
  id: string;
  name: string;
  email: string;
  batchId: string;
  batchName: string;
};

interface StudentEditFormProps {
  student: StudentDetail;
  batches: StudentBatchOption[];
}

export function StudentEditForm({ student, batches }: StudentEditFormProps) {
  const [status, setStatus] = useState('Ready to save.');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSaving(true);
    setStatus('Saving student record...');

    try {
      const response = await fetch(`/api/admin/students/${student.id}`, {
        method: 'PATCH',
        body: formData,
      });

      if (!response.ok) {
        setStatus('Save failed. Please try again.');
        return;
      }

      setStatus('Student record updated.');
      window.location.reload();
    } catch {
      setStatus('Save failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700">
          Student name
          <input
            name="name"
            defaultValue={student.name}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Email address
          <input
            name="email"
            type="email"
            defaultValue={student.email}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
          Batch assignment
          <select
            name="batchId"
            defaultValue={student.batchId}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          >
            {batches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-6 rounded-3xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-slate-700">
        Update the live student identity, email, and batch assignment in the `people_prod` database. This also keeps the linked
        admission and enrollment rows aligned.
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save student'}
        </button>
        <p className="text-sm text-slate-600">{status}</p>
      </div>
    </form>
  );
}
