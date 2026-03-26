import Link from 'next/link';
import { notFound } from 'next/navigation';

import { RoleLockedNotice } from '@/components/role-locked-notice';
import { StudentEditForm } from '@/components/students/StudentEditForm';
import { getSkillUpAdminRole } from '@/lib/admin-session';
import { getAdminStudentDetail, listAdminBatches } from '@/lib/skillup-admin-data';

const badgeStyles: Record<string, string> = {
  enrolled: 'border-cyan-200 bg-cyan-50 text-cyan-700',
  admitted: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  qualified: 'border-amber-200 bg-amber-50 text-amber-700',
  enquired: 'border-slate-200 bg-slate-50 text-slate-700',
};

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  if ((await getSkillUpAdminRole()) !== 'admin') {
    return (
      <RoleLockedNotice
        title="Students are admin-only"
        description="Student records, attendance triage, and payment review are hidden in counsellor view."
      />
    );
  }

  const student = await getAdminStudentDetail(params.id);
  if (student === undefined) {
    notFound();
  }

  const batches = await listAdminBatches();
  const batchOptions = [
    ...batches.filter((batch) => batch.id !== student.batchId),
    ...(student.batchId === 'unassigned'
      ? []
      : [
          {
            id: student.batchId,
            name: student.batchName,
          },
        ]),
  ];

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-6 py-8 lg:py-10">
      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <article className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Student profile</p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{student.name}</h2>
              <p className="mt-2 text-sm text-slate-600">{student.email}</p>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${badgeStyles[student.enrollmentStage]}`}>{student.enrollmentStage}</span>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Batch</p>
              <p className="mt-2 text-lg font-black text-slate-950">{student.batchName}</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Attendance</p>
              <p className="mt-2 text-lg font-black text-slate-950">{student.attendancePct}%</p>
            </div>
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Counsellor</p>
              <p className="mt-2 text-lg font-black text-slate-950">{student.counselor}</p>
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-700">Edit profile</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Update the live name, email, and batch assignment for this student. The form writes to `people_prod` and keeps linked
              enrollment rows aligned.
            </p>
            <div className="mt-4">
              <StudentEditForm
                student={{
                  id: student.id,
                  name: student.name,
                  email: student.email,
                  batchId: student.batchId,
                  batchName: student.batchName,
                }}
                batches={batchOptions.map((batch) => ({
                  id: batch.id,
                  name: batch.name,
                }))}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-5">
            <p className="text-xs font-black uppercase tracking-[0.32em] text-cyan-700">Enroll action</p>
            <p className="mt-2 text-sm leading-6 text-slate-700">
              Posting to <code className="rounded bg-white px-1 py-0.5 text-xs text-slate-900">/api/admin/students/{student.id}/enroll</code> creates the live
              student enrollment flow and updates the batch assignment.
            </p>
            <form className="mt-4" action={`/api/admin/students/${student.id}/enroll`} method="post">
              <button className="rounded-full bg-cyan-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700">
                Enroll student
              </button>
            </form>
          </div>
        </article>

        <aside className="space-y-4">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Attendance history</p>
            <div className="mt-4 space-y-3">
              {student.attendanceHistory.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-800">{item.label}</p>
                    <p className="text-sm font-black text-slate-950">{item.pct}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Payment history</p>
            <div className="mt-4 space-y-3">
              {student.payments.map((item) => (
                <div key={item.installment} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{item.installment}</p>
                      <p className="text-xs text-slate-500">{item.dueDate}</p>
                    </div>
                    <p className="text-sm font-black text-slate-950">{item.amount}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Batch history</p>
            <div className="mt-4 space-y-3">
              {student.batchHistory.map((item) => (
                <div key={item.batchName} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-sm font-semibold text-slate-800">{item.batchName}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.28em] text-slate-500">{item.status}</p>
                </div>
              ))}
            </div>
          </div>

          <Link href="/students" className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50">
            Back to students
          </Link>
        </aside>
      </div>
    </section>
  );
}
