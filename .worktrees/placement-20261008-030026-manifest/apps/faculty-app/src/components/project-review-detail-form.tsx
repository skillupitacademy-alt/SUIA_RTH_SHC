'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import type { FacultyReviewQueueItem } from '@/lib/faculty-live-data';

interface ProjectReviewDetailFormProps {
  submission: FacultyReviewQueueItem;
}

export function ProjectReviewDetailForm({ submission }: ProjectReviewDetailFormProps) {
  const router = useRouter();
  const [notes, setNotes] = useState('Reviewed by faculty');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('Choose approve or request revision.');

  const submit = async (action: 'approve' | 'request-revision') => {
    setSaving(true);
    setMessage(action === 'approve' ? 'Approving submission...' : 'Requesting revision...');

    try {
      const response = await fetch(`/api/faculty/project-reviews/${submission.id}/${action}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        setMessage('Unable to update project review.');
        return;
      }

      setMessage(action === 'approve' ? 'Submission approved.' : 'Revision requested.');
      router.refresh();
    } catch {
      setMessage('Unable to update project review.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-600">Review decision</p>
      <div className="mt-4 space-y-4">
        <label className="block text-sm font-semibold text-slate-700">
          Notes
          <textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={4}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={() => void submit('approve')}
            className="rounded-full bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Approve
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void submit('request-revision')}
            className="rounded-full bg-amber-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            Request revision
          </button>
        </div>
      </div>
      <p className="mt-4 text-sm text-slate-600">{message}</p>
    </div>
  );
}
