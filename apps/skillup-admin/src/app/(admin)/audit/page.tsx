import Link from 'next/link';

import { getSkillUpAdminRole } from '@/lib/admin-session';
import { RoleLockedNotice } from '@/components/role-locked-notice';
import { listAdminAuditLog } from '@/lib/skillup-admin-data';

type SearchParams = {
  student?: string;
  action?: string;
  from?: string;
  to?: string;
};

const actionOptions = [
  { value: '', label: 'All actions' },
  { value: 'enrolled', label: 'Enrolled' },
  { value: 'payment', label: 'Payment' },
  { value: 'attendance', label: 'Attendance' },
];

function firstValue(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? '' : value ?? '';
}

export default async function AuditPage({ searchParams }: { searchParams?: SearchParams }) {
  if ((await getSkillUpAdminRole()) !== 'admin') {
    return (
      <RoleLockedNotice
        title="Audit log is admin-only"
        description="Security monitoring, exports, and metadata inspection are only available to admin and super_admin roles."
      />
    );
  }

  const filters = {
    student: firstValue(searchParams?.student),
    action: firstValue(searchParams?.action),
    from: firstValue(searchParams?.from),
    to: firstValue(searchParams?.to),
  };

  const rows = await listAdminAuditLog(filters);
  const exportParams = new URLSearchParams();
  if (filters.student.length > 0) exportParams.set('student', filters.student);
  if (filters.action.length > 0) exportParams.set('action', filters.action);
  if (filters.from.length > 0) exportParams.set('from', filters.from);
  if (filters.to.length > 0) exportParams.set('to', filters.to);

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-6 py-8 lg:py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Activity log</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Security monitoring and change history</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Inspect who changed what, when it changed, and how the record looked before and after each update.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            href={`/api/admin/audit-log/export${exportParams.toString().length > 0 ? `?${exportParams.toString()}` : ''}`}
            className="rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700"
          >
            Export CSV
          </Link>
        </div>
      </div>

      <form className="grid gap-3 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm lg:grid-cols-[1.4fr_1fr_1fr_1fr_auto]">
        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Student</span>
          <input
            name="student"
            defaultValue={filters.student}
            placeholder="Name or ID"
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Action type</span>
          <select
            name="action"
            defaultValue={filters.action}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          >
            {actionOptions.map((action) => (
              <option key={action.value} value={action.value}>
                {action.label}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">From</span>
          <input
            type="date"
            name="from"
            defaultValue={filters.from}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">To</span>
          <input
            type="date"
            name="to"
            defaultValue={filters.to}
            className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-cyan-300 focus:bg-white"
          />
        </label>
        <button className="rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
          Filter
        </button>
      </form>

      <div className="grid gap-4">
        {rows.map((entry) => (
          <details key={entry.id} className="group rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <summary className="cursor-pointer list-none">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-600">{entry.studentName}</p>
                  <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{entry.action}</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    {entry.actor} on {entry.platform}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-bold text-cyan-700">
                    {entry.studentId}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-[11px] font-bold text-slate-700">
                    {new Date(entry.timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </summary>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Before</p>
                <pre className="mt-3 overflow-x-auto rounded-2xl bg-white p-4 text-sm text-slate-700">{JSON.stringify(entry.before, null, 2)}</pre>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">After</p>
                <pre className="mt-3 overflow-x-auto rounded-2xl bg-white p-4 text-sm text-slate-700">{JSON.stringify(entry.after, null, 2)}</pre>
              </div>
            </div>
          </details>
        ))}

        {rows.length === 0 ? (
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 text-sm text-slate-600 shadow-sm">
            No audit records matched the current filters.
          </div>
        ) : null}
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Showing {rows.length} live audit records.
      </div>
    </section>
  );
}
