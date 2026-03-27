'use client';

"use client";

import { CheckCircle2, Loader2 } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

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

export function LiveSessionRequestDetail({ requestId }: { requestId: string }) {
  const [request, setRequest] = useState<LiveSessionRequestRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [meetingLink, setMeetingLink] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [isAccepting, setIsAccepting] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/tutorial/sessions/requests?status=pending', {
        credentials: 'include',
      });
      const payload = (await response.json().catch(() => null)) as { data?: unknown; error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Failed to load request');
      }

      const requests = Array.isArray(payload?.data) ? (payload.data as LiveSessionRequestRecord[]) : [];
      const found = requests.find((item) => item.id === requestId) ?? null;
      setRequest(found);
      if (found?.meetingLink != null) {
        setMeetingLink(found.meetingLink);
      }
      if (found?.scheduledAt != null) {
        const date = found.scheduledAt instanceof Date ? found.scheduledAt : new Date(found.scheduledAt);
        if (!Number.isNaN(date.getTime())) {
          setScheduledAt(date.toISOString().slice(0, 16));
        }
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load request');
    } finally {
      setIsLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const scheduledAtIso = useMemo(() => {
    if (scheduledAt.trim().length === 0) return null;
    const date = new Date(scheduledAt);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }, [scheduledAt]);

  const acceptRequest = async () => {
    setIsAccepting(true);
    setActionMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/tutorial/sessions/requests/${requestId}/accept`, {
        method: 'PATCH',
        credentials: 'include',
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Failed to accept request');
      }
      setActionMessage('Request accepted.');
      await refresh();
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : 'Failed to accept request');
    } finally {
      setIsAccepting(false);
    }
  };

  const scheduleRequest = async () => {
    if (scheduledAtIso == null || meetingLink.trim().length === 0) return;

    setIsScheduling(true);
    setActionMessage(null);
    setError(null);

    try {
      const response = await fetch(`/api/tutorial/sessions/requests/${requestId}/schedule`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          scheduledAt: scheduledAtIso,
          meetingLink: meetingLink.trim(),
        }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(payload?.error ?? 'Failed to schedule request');
      }
      setActionMessage('Request scheduled.');
      await refresh();
    } catch (scheduleError) {
      setError(scheduleError instanceof Error ? scheduleError.message : 'Failed to schedule request');
    } finally {
      setIsScheduling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
        <Loader2 className="animate-spin" size={16} />
        Loading request...
      </div>
    );
  }

  if (error !== null) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-800">
          {error}
        </div>
      );
    }

  if (request == null) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
        Request not found or already handled.
      </div>
    );
  }

  return (
    <div className="space-y-5 rounded-[2rem] border border-white/20 bg-white/70 p-6 shadow-sm backdrop-blur-[16px]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-extrabold uppercase tracking-[0.2em] text-sky-600">Request detail</div>
          <h2 className="mt-1 font-outfit text-3xl font-extrabold tracking-tight text-slate-900">{request.id}</h2>
        </div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase tracking-[0.18em] text-slate-600">
          {request.status}
        </span>
      </div>

      <div className="grid gap-4 rounded-[1.5rem] border border-slate-200 bg-white p-5">
        <div className="grid gap-1 text-sm">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Student</span>
          <span className="font-semibold text-slate-900">{request.studentId}</span>
        </div>
        <div className="grid gap-1 text-sm">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Subtopic</span>
          <span className="font-semibold text-slate-900">{request.subtopicId}</span>
        </div>
        <div className="grid gap-1 text-sm">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Doubt</span>
          <span className="leading-7 text-slate-700">{request.doubtText ?? 'No details provided.'}</span>
        </div>
        <div className="grid gap-1 text-sm">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Created</span>
          <span className="text-slate-700">{formatDate(request.createdAt)}</span>
        </div>
        <div className="grid gap-1 text-sm">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Meeting link</span>
          <span className="text-slate-700">{request.meetingLink ?? 'Not scheduled'}</span>
        </div>
        <div className="grid gap-1 text-sm">
          <span className="text-xs font-bold uppercase tracking-[0.18em] text-slate-500">Scheduled at</span>
          <span className="text-slate-700">{formatDate(request.scheduledAt)}</span>
        </div>
      </div>

      {actionMessage !== null ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {actionMessage}
        </div>
      ) : null}

      <div className="grid gap-3 rounded-[1.5rem] border border-slate-200 bg-white p-5">
        <button
          type="button"
          onClick={() => {
            void acceptRequest();
          }}
          disabled={isAccepting || request.status !== 'pending'}
          className="inline-flex w-fit items-center gap-2 rounded-full bg-sky-600 px-4 py-2 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAccepting ? 'Accepting...' : 'Accept request'}
        </button>

        <div className="grid gap-3 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-bold text-slate-700">Meeting link</span>
            <input
              type="url"
              value={meetingLink}
              onChange={(event) => setMeetingLink(event.target.value)}
              placeholder="https://meet.example.com/session"
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            />
          </label>
          <label className="grid gap-2">
            <span className="text-sm font-bold text-slate-700">Scheduled time</span>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(event) => setScheduledAt(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-400"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => {
            void scheduleRequest();
          }}
          disabled={isScheduling || scheduledAtIso == null || meetingLink.trim().length === 0}
          className="inline-flex w-fit items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isScheduling ? 'Scheduling...' : 'Schedule request'}
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
        <CheckCircle2 size={14} />
        Accept first, then paste a meeting link and schedule the request.
      </div>
    </div>
  );
}
