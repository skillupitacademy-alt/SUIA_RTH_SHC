import Link from 'next/link';

import { StudentCreateForm } from '@/components/students/StudentCreateForm';
import { getSkillUpAdminRole } from '@/lib/admin-session';
import { RoleLockedNotice } from '@/components/role-locked-notice';
import { listAdminBatches, listAdminStudents } from '@/lib/skillup-admin-data';

const statusStyles: Record<string, string> = {
  current: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  due: 'border-amber-200 bg-amber-50 text-amber-700',
  overdue: 'border-rose-200 bg-rose-50 text-rose-700',
};

type StudentsPageProps = {
  searchParams?: Promise<{
    q?: string;
    payment?: string;
  }>;
};

export default async function StudentsPage({ searchParams }: StudentsPageProps) {
  if ((await getSkillUpAdminRole()) !== 'admin') {
    return (
      <RoleLockedNotice
        title="Students are admin-only"
        description="Student records, attendance triage, and payment review are hidden in counsellor view."
      />
    );
  }

  const params = (await searchParams) ?? {};
  const query = params.q?.trim().toLowerCase() ?? '';
  const paymentFilter = params.payment?.trim().toLowerCase() ?? 'all';
  const [students, batches] = await Promise.all([listAdminStudents(), listAdminBatches()]);
  const filteredStudents = students.filter((student) => {
    const matchesQuery =
      query.length === 0 ||
      [student.name, student.email, student.batchName, student.batchId].some((value) => value.toLowerCase().includes(query));

    const matchesPayment = paymentFilter === 'all' || student.paymentStatus === paymentFilter;

    return matchesQuery && matchesPayment;
  });

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-6 py-8 lg:py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Students</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Search, filter, and open student records</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          This list supports admissions follow-up, attendance triage, and payment review with the same light card rhythm used across the portal.
        </p>

        <form method="get" className="mt-6 grid gap-3 lg:grid-cols-[1.4fr_repeat(3,_1fr)]">
          <input
            type="search"
            name="q"
            defaultValue={params.q ?? ''}
            placeholder="Search student, batch, email..."
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-cyan-300 focus:bg-white"
          />
          <select
            name="payment"
            defaultValue={params.payment ?? 'all'}
            className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-cyan-300 focus:bg-white"
          >
            <option value="all">All statuses</option>
            <option value="current">Current</option>
            <option value="due">Due</option>
            <option value="overdue">Overdue</option>
          </select>
          <button className="rounded-2xl border border-cyan-200 bg-cyan-50 px-4 py-3 text-sm font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-100">
            Apply filters
          </button>
          <Link
            href="/students"
            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50"
          >
            Reset
          </Link>
        </form>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <StudentCreateForm batches={batches.map((batch) => ({ id: batch.id, name: batch.name }))} />

          <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Student onboarding notes</p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
              <p>New students are created in the live people database.</p>
              <p>Batch assignment, profile, and admission rows are created together.</p>
              <p>The record appears immediately in the filtered student grid below.</p>
            </div>
          </aside>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {filteredStudents.map((student) => (
          <article key={student.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-600">{student.batchName}</p>
                <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{student.name}</h3>
                <p className="mt-2 text-sm text-slate-600">{student.email}</p>
              </div>
              <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${statusStyles[student.paymentStatus]}`}>
                {student.paymentStatus}
              </span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Attendance</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{student.attendancePct}%</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Upcoming session</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{new Date(student.upcomingSessionAt).toLocaleString()}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Batch</p>
                <p className="mt-2 text-sm font-semibold text-slate-950">{student.batchId}</p>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-between gap-3">
            <p className="text-sm text-slate-600">Open the profile for attendance history, payments, enrollment details, and edit actions.</p>
            <Link
              href={`/students/${student.id}`}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900"
            >
              Open profile
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
