"use client";

import { CheckCircle2, ExternalLink, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

type LiveSessionRequestRecord = {
  id: string;
  studentId: string;
  subtopicId: string;
  doubtText: string | null;
  status: 'pending' | 'accepted' | 'scheduled' | 'completed' | 'cancelled';
  facultyId: string | null;
  meetingLink: string | null;
  scheduledAt: string | Date | null;
  completedAt: string | Date | null;
  cancelledReason: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
};

function formatDate(value: string | Date | null) {
  if (value == null) return 'N/A';
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? 'N/A' : date.toLocaleString();
}

export function LiveSessionRequestsBoard() {
  const [requests, setRequests] = useState<LiveSessionRequestRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/tutorial/sessions/requests?status=pending', {
          credentials: 'include',
          signal: controller.signal,
        });
        const payload = (await response.json().catch(() => null)) as { data?: unknown; error?: string } | null;

        if (!response.ok) {
          throw new Error(payload?.error ?? 'Failed to load live session requests');
        }

        const items = Array.isArray(payload?.data) ? (payload?.data as LiveSessionRequestRecord[]) : [];
        setRequests(items);
      } catch (loadError) {
        if (!controller.signal.aborted) {
          setError(loadError instanceof Error ? loadError.message : 'Failed to load live session requests');
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => controller.abort();
  }, [reloadKey]);

  return (
    <div className="space-y-6 rounded-[2rem] border border-white/20 bg-white/70 p-6 shadow-sm backdrop-blur-[16px]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-sky-600">Tutorial live sessions</div>
          <h2 className="mt-1 font-outfit text-2xl font-extrabold tracking-tight text-slate-900">Pending requests</h2>
        </div>
        <button
          type="button"
          onClick={() => setReloadKey((current) => current + 1)}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {isLoading ? (
        <div className="grid gap-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      ) : error !== null ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {error}
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
          No pending live session requests.
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <article key={request.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                      {request.status}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                      {request.id}
                    </span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">Student {request.studentId}</div>
                  <div className="text-sm text-slate-600">Subtopic {request.subtopicId}</div>
                </div>

                <Link
                  href={`/tutorial/live-sessions/${request.id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-sky-500"
                >
                  Open request
                  <ExternalLink size={16} />
                </Link>
              </div>

              <div className="mt-4 grid gap-3 text-sm text-slate-700">
                <p className="m-0">
                  <span className="font-bold text-slate-900">Doubt:</span> {request.doubtText ?? 'No details provided.'}
                </p>
                <div className="grid gap-1 text-xs text-slate-500">
                  <div>Created: {formatDate(request.createdAt)}</div>
                  <div>Updated: {formatDate(request.updatedAt)}</div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!isLoading && error === null && requests.length > 0 ? (
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <CheckCircle2 size={14} />
          Requests are pulled from the shared tutorial queue and can be accepted from the detail view.
        </div>
      ) : null}
    </div>
  );
}
