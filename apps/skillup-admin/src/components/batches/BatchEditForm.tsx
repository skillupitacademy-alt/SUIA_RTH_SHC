'use client';

import type { FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

type BatchDetail = {
  id: string;
  name: string;
  facultyName: string;
  capacity: number;
  nextSessionAt: string;
  status: 'upcoming' | 'active' | 'completed' | 'paused' | 'cancelled';
  assignedFaculty: string;
};

interface BatchEditFormProps {
  batch: BatchDetail;
}

export function BatchEditForm({ batch }: BatchEditFormProps) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('Ready to save.');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSaving(true);
    setStatus('Saving batch...');

    try {
      const response = await fetch(`/api/admin/batches/${batch.id}`, {
        method: 'PATCH',
        body: formData,
      });

      if (!response.ok) {
        setStatus('Save failed. Please try again.');
        return;
      }

      setStatus('Batch updated.');
      router.refresh();
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
          Batch name
          <input
            name="name"
            defaultValue={batch.name}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Faculty name
          <input
            name="facultyName"
            defaultValue={batch.facultyName}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Capacity
          <input
            name="capacity"
            type="number"
            min={1}
            defaultValue={batch.capacity}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Start date
          <input
            name="startDate"
            type="date"
            defaultValue={batch.nextSessionAt.slice(0, 10)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
          Status
          <select
            name="status"
            defaultValue={batch.status}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          >
            <option value="upcoming">upcoming</option>
            <option value="active">active</option>
            <option value="paused">paused</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
          </select>
        </label>
      </div>

      <div className="mt-6 rounded-3xl border border-cyan-200 bg-cyan-50 p-4 text-sm text-slate-700">
        Update batch master data in the live people database. The current faculty assignment is preserved unless changed here.
      </div>

      <div className="mt-6 flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save batch'}
        </button>
        <p className="text-sm text-slate-600">{status}</p>
      </div>
    </form>
  );
}
