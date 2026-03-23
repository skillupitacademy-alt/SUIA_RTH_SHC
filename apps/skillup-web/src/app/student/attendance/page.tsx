import { CheckCircle2, Clock3, XCircle } from 'lucide-react';

import { studentAttendanceHistory } from '@/lib/skillup-demo-data';

export default function AttendancePage() {
  return (
    <section className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:py-10">
      <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Attendance</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Monthly attendance view</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          The student portal surfaces attendance history with clear state chips so color is not the only signal.
        </p>
      </article>

      <section className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            {studentAttendanceHistory.map((entry) => (
              <div key={entry.date} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-800">{entry.date}</p>
                  <span
                    aria-label={
                      entry.state === 'present'
                        ? 'Present'
                        : entry.state === 'late'
                          ? 'Late'
                          : 'Absent'
                    }
                    className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                      entry.state === 'present'
                        ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                        : entry.state === 'late'
                          ? 'border border-amber-200 bg-amber-50 text-amber-700'
                          : 'border border-rose-200 bg-rose-50 text-rose-700'
                    }`}
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {entry.state === 'present' ? <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                      {entry.state === 'late' ? <Clock3 className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                      {entry.state === 'absent' ? <XCircle className="h-3.5 w-3.5" aria-hidden="true" /> : null}
                      {entry.state}
                    </span>
                  </span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">{entry.note}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Monthly summary</p>
          <div className="mt-6 space-y-4">
            {[
              { label: 'Present days', value: '22' },
              { label: 'Late arrivals', value: '3' },
              { label: 'Absent days', value: '1' },
              { label: 'Attendance percent', value: '86%' },
            ].map((item) => (
              <div key={item.label} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-900 shadow-sm">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}
