'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

type AttendanceMap = Record<string, boolean>;

interface AttendanceStudent {
  id: string;
  name: string;
  rollNumber: string;
  avatarUrl: string;
  present: boolean;
}

interface AttendanceQueueEntry {
  batchId: string;
  sessionId: string;
  attendanceRecords: Array<{ studentId: string; present: boolean }>;
}

interface AttendanceBoardProps {
  batchId: string;
  sessionId: string;
}

const getStorageKey = (batchId: string, sessionId: string) => `faculty-attendance:${batchId}:${sessionId}`;
const getQueueKey = (batchId: string, sessionId: string) => `faculty-attendance-queue:${batchId}:${sessionId}`;

export function AttendanceBoard({ batchId, sessionId }: AttendanceBoardProps) {
  const [roster, setRoster] = useState<AttendanceStudent[]>([]);
  const [attendance, setAttendance] = useState<AttendanceMap>({});
  const [isOnline, setIsOnline] = useState(true);
  const [status, setStatus] = useState<string>('Loading roster...');

  const presentCount = useMemo(() => Object.values(attendance).filter(Boolean).length, [attendance]);
  const isLargeRoster = roster.length > 50;

  useEffect(() => {
    const loadRoster = async () => {
      try {
        const response = await fetch(`/api/faculty/attendance?batchId=${encodeURIComponent(batchId)}&sessionId=${encodeURIComponent(sessionId)}`, {
          headers: { accept: 'application/json' },
          cache: 'no-store',
        });
        if (!response.ok) {
          setStatus('Unable to load roster.');
          return;
        }

        const payload = (await response.json()) as { data: { roster: AttendanceStudent[] } };
        setRoster(payload.data.roster);
        setAttendance(Object.fromEntries(payload.data.roster.map((student) => [student.id, student.present])));
        setStatus('Ready to submit.');
      } catch {
        setStatus('Unable to load roster.');
      }
    };

    void loadRoster();

    const queue = localStorage.getItem(getQueueKey(batchId, sessionId));
    if (queue !== null) {
      setStatus('Queued attendance exists. It will sync when the browser is back online.');
    }

    const updateOnlineState = () => {
      setIsOnline(navigator.onLine);
    };

    updateOnlineState();
    window.addEventListener('online', updateOnlineState);
    window.addEventListener('offline', updateOnlineState);
    return () => {
      window.removeEventListener('online', updateOnlineState);
      window.removeEventListener('offline', updateOnlineState);
    };
  }, [batchId, sessionId]);

  useEffect(() => {
    localStorage.setItem(getStorageKey(batchId, sessionId), JSON.stringify(attendance));
  }, [attendance, batchId, sessionId]);

  useEffect(() => {
    const syncQueuedAttendance = async () => {
      if (!isOnline) return;
      const queued = localStorage.getItem(getQueueKey(batchId, sessionId));
      if (queued === null) return;

      try {
        const payload = JSON.parse(queued) as AttendanceQueueEntry;
        const response = await fetch('/api/faculty/attendance', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (response.ok) {
          localStorage.removeItem(getQueueKey(batchId, sessionId));
          setStatus('Queued attendance synced successfully.');
        }
      } catch {
        setStatus('Queued attendance will retry on the next reconnect.');
      }
    };

    void syncQueuedAttendance();
  }, [batchId, isOnline, sessionId]);

  const toggleStudent = (studentId: string, present: boolean) => {
    setAttendance((current) => ({ ...current, [studentId]: present }));
  };

  const handleSubmit = async () => {
    const attendanceRecords = roster.map((student) => ({
      studentId: student.id,
      present: attendance[student.id] ?? false,
    }));
    const payload: AttendanceQueueEntry = { batchId, sessionId, attendanceRecords };

    if (!navigator.onLine) {
      localStorage.setItem(getQueueKey(batchId, sessionId), JSON.stringify(payload));
      setStatus('Offline mode: attendance queued locally and will sync when you reconnect.');
      return;
    }

    setStatus('Submitting attendance...');
    const response = await fetch('/api/faculty/attendance', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      localStorage.setItem(getQueueKey(batchId, sessionId), JSON.stringify(payload));
      setStatus('Submission failed. Attendance was queued locally.');
      return;
    }

    localStorage.removeItem(getQueueKey(batchId, sessionId));
    setStatus('Attendance submitted successfully with one bulk payload.');
  };

  return (
    <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.35em] text-cyan-600">Attendance sheet</p>
          <h3 className="mt-2 text-3xl font-black tracking-tight text-slate-950">Mark the session in one bulk submit</h3>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
            The roster stays cached locally so this page can tolerate short offline gaps. A single submit sends the current batch roster together.
          </p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-700">
          <p className="font-semibold text-slate-950">
            {presentCount}/{roster.length} marked present
          </p>
          <p className="mt-1 text-slate-500">{isOnline ? 'Online and ready to submit.' : 'Offline mode enabled.'}</p>
        </div>
      </div>

      {!isOnline ? (
        <div className="mt-4 rounded-3xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          Offline mode - marks will sync when connected.
        </div>
      ) : null}

      <div
        className="mt-6 overflow-hidden rounded-[1.75rem] border border-slate-200 bg-slate-50"
        style={isLargeRoster ? { contain: 'layout paint style', contentVisibility: 'auto' } : undefined}
      >
        <div className="grid grid-cols-[1.1fr_0.5fr_0.5fr] gap-4 border-b border-slate-200 px-5 py-3 text-xs font-black uppercase tracking-[0.3em] text-slate-500">
          <span>Student</span>
          <span>Roll</span>
          <span>Status</span>
        </div>
        <div className="divide-y divide-slate-200">
          {roster.map((student) => (
            <div key={student.id} className="grid grid-cols-[1.1fr_0.5fr_0.5fr] items-center gap-4 px-5 py-4">
              <div>
                <div className="flex items-center gap-3">
                  <Image
                    src={student.avatarUrl}
                    alt={`${student.name} profile placeholder`}
                    loading="lazy"
                    width={40}
                    height={40}
                    className="h-10 w-10 rounded-full border border-slate-200 bg-white object-cover"
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-950">{student.name}</p>
                    <p className="text-xs text-slate-500">Profile image placeholder</p>
                  </div>
                </div>
                <p className="mt-1 text-xs text-slate-500">{student.id}</p>
              </div>
              <p className="text-sm text-slate-600">{student.rollNumber}</p>
              <div className="inline-flex overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                <button
                  type="button"
                  onClick={() => toggleStudent(student.id, true)}
                  className={`px-3 py-1.5 text-xs font-black uppercase tracking-[0.25em] transition ${
                    attendance[student.id] ? 'bg-emerald-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Present
                </button>
                <button
                  type="button"
                  onClick={() => toggleStudent(student.id, false)}
                  className={`px-3 py-1.5 text-xs font-black uppercase tracking-[0.25em] transition ${
                    attendance[student.id] === false ? 'bg-rose-500 text-white' : 'bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Absent
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="text-sm text-slate-600">{status}</div>
        <button
          type="button"
          onClick={() => void handleSubmit()}
          className="rounded-full bg-cyan-600 px-5 py-3 text-sm font-black uppercase tracking-[0.25em] text-white transition hover:bg-cyan-700"
        >
          Submit bulk attendance
        </button>
      </div>
    </section>
  );
}
