'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { FacultyHelpRequestItem } from '@/lib/faculty-live-data';

interface HelpRequestDetailFormProps {
  request: FacultyHelpRequestItem;
}

export function HelpRequestDetailForm({ request }: HelpRequestDetailFormProps) {
  const router = useRouter();
  const [status, setStatus] = useState<FacultyHelpRequestItem['status']>(request.status);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('Update the request status and save.');

  const save = async () => {
    setSaving(true);
    setMessage('Saving help request...');

    try {
      const response = await fetch(`/api/faculty/help-requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          status,
          resolvedAt: status === 'resolved' ? new Date().toISOString() : null,
        }),
      });

      if (!response.ok) {
        setMessage('Unable to update help request.');
        return;
      }

      setMessage('Help request updated.');
      router.refresh();
    } catch {
      setMessage('Unable to update help request.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-600">Request status</p>
      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
        <label className="block text-sm font-semibold text-slate-700">
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as FacultyHelpRequestItem['status'])}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          >
            <option value="open">open</option>
            <option value="in_progress">in_progress</option>
            <option value="resolved">resolved</option>
          </select>
        </label>
        <button
          type="button"
          disabled={saving}
          onClick={() => void save()}
          className="rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save request'}
        </button>
      </div>
      <p className="mt-4 text-sm text-slate-600">{message}</p>
    </div>
  );
}
