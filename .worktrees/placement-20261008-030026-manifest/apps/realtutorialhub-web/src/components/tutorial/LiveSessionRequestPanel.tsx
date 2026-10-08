'use client';

import { useState } from 'react';

import type { DomainTheme } from '@/lib/domain-themes';

import { LiveSessionBlock } from './LiveSessionBlock';

interface LiveSessionRequestPanelProps {
  subtopicId: string;
  subtopicName: string;
  theme: DomainTheme;
}

export function LiveSessionRequestPanel({ subtopicId, subtopicName, theme }: LiveSessionRequestPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [doubtText, setDoubtText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submitRequest = async () => {
    const trimmed = doubtText.trim();
    if (isSubmitting || trimmed.length === 0) return;

    setIsSubmitting(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch('/api/tutorial/sessions/request', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          subtopicId,
          doubtText: trimmed,
        }),
      });

      const payload = (await response.json().catch(() => null)) as { error?: string; data?: { requestId?: string } } | null;

      if (!response.ok) {
        throw new Error(payload?.error ?? 'Failed to request a live session');
      }

      setMessage(payload?.data?.requestId != null ? 'Request submitted. Faculty will review it soon.' : 'Request submitted.');
      setDoubtText('');
      setIsOpen(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to request a live session');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <LiveSessionBlock
        title="Live Session Support"
        description={`Request a live faculty session for ${subtopicName}. Use this when you want direct help on a specific doubt or want the topic explained live.`}
        accentColor={theme.sidebarAccent}
        onRequest={() => setIsOpen(true)}
      />

      {message ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {message}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {error}
        </div>
      ) : null}

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-8 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-[2rem] border border-white/20 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-slate-500">Request live session</div>
                <h3 className="mt-1 font-outfit text-2xl font-extrabold tracking-tight text-slate-900">
                  {subtopicName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-bold text-slate-600 transition hover:bg-slate-200"
              >
                Close
              </button>
            </div>

            <div className="mt-5 space-y-4">
              <p className="m-0 text-sm leading-7 text-slate-600">
                Add one or two lines describing the doubt. Faculty will see this request in the live-session queue.
              </p>
              <label className="grid gap-2">
                <span className="text-sm font-bold text-slate-700">Your doubt</span>
                <textarea
                  value={doubtText}
                  onChange={(event) => setDoubtText(event.target.value)}
                  rows={6}
                  placeholder="Explain where you are stuck or what you want to review live..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-7 text-slate-900 outline-none transition focus:border-slate-400"
                />
              </label>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    void submitRequest();
                  }}
                  disabled={isSubmitting || doubtText.trim().length === 0}
                  className="rounded-full px-5 py-2 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-60"
                  style={{ background: theme.sidebarAccent }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
