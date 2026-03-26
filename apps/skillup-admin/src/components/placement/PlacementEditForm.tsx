'use client';

import type { FormEvent } from 'react';
import { useState } from 'react';

type PlacementProfile = {
  id: string;
  targetRole: string;
  resumeStatus: string;
  matchScore: number;
  interviewCount: number;
  jobMatches: string[];
};

interface PlacementEditFormProps {
  profile: PlacementProfile;
}

export function PlacementEditForm({ profile }: PlacementEditFormProps) {
  const [status, setStatus] = useState<string>('Ready to save.');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setSaving(true);
    setStatus('Saving placement profile...');

    try {
      const response = await fetch(`/api/admin/placement/${profile.id}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        setStatus('Save failed. Please try again.');
        return;
      }

      setStatus('Placement profile saved.');
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
          Target role
          <input
            name="targetRole"
            defaultValue={profile.targetRole}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Resume status
          <input
            name="resumeStatus"
            defaultValue={profile.resumeStatus}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Profile completion
          <input
            name="profileCompletion"
            type="number"
            min={0}
            max={100}
            defaultValue={profile.matchScore}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="block text-sm font-semibold text-slate-700">
          Interview count
          <input
            name="interviewCount"
            type="number"
            min={0}
            max={100}
            defaultValue={profile.interviewCount}
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
      </div>
      <label className="mt-4 block text-sm font-semibold text-slate-700">
        Skills, comma separated
        <textarea
          name="skills"
          defaultValue={profile.jobMatches.join(', ')}
          rows={4}
          className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
        />
      </label>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? 'Saving...' : 'Save placement profile'}
        </button>
        <p className="self-center text-sm text-slate-600">{status}</p>
      </div>
    </form>
  );
}
