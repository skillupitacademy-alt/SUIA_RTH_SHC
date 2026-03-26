'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { FacultySessionRequestItem } from '@/lib/faculty-live-data';

interface SessionRequestDetailFormProps {
  request: FacultySessionRequestItem;
}

export function SessionRequestDetailForm({ request }: SessionRequestDetailFormProps) {
  const router = useRouter();
  const [meetingLink, setMeetingLink] = useState('');
  const [status, setStatus] = useState<FacultySessionRequestItem['status']>(request.status);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('Accept the request or save an updated status.');

  const accept = async () => {
    if (meetingLink.trim().length === 0) {
      setMessage('Add a meeting link before accepting.');
      return;
    }

    setSaving(true);
    setMessage('Accepting request...');

    try {
      const response = await fetch(`/api/faculty/session-requests/${request.id}/accept`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ meetingLink }),
      });

      if (!response.ok) {
        setMessage('Unable to accept the request.');
        return;
      }

      setMessage('Session request accepted.');
      router.refresh();
    } catch {
      setMessage('Unable to accept the request.');
    } finally {
      setSaving(false);
    }
  };

  const saveStatus = async () => {
    setSaving(true);
    setMessage('Saving request...');

    try {
      const response = await fetch(`/api/faculty/session-requests/${request.id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          status,
          meetingLink: meetingLink.trim().length > 0 ? meetingLink : null,
        }),
      });

      if (!response.ok) {
        setMessage('Unable to save the request.');
        return;
      }

      setMessage('Session request updated.');
      router.refresh();
    } catch {
      setMessage('Unable to save the request.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-600">Request control</p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
          Meeting link
          <input
            value={meetingLink}
            onChange={(event) => setMeetingLink(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
            placeholder="https://meet.google.com/..."
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700 md:col-span-2">
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as FacultySessionRequestItem['status'])}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-cyan-400"
          >
            <option value="pending">pending</option>
            <option value="accepted">accepted</option>
            <option value="scheduled">scheduled</option>
            <option value="completed">completed</option>
            <option value="cancelled">cancelled</option>
          </select>
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={saving}
          onClick={() => void accept()}
          className="rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Accept request
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => void saveStatus()}
          className="rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Save status
        </button>
      </div>

      <p className="mt-4 text-sm text-slate-600">{message}</p>
    </div>
  );
}
