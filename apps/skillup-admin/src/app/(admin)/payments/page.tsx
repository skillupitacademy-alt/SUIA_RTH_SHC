import Link from 'next/link';

import { getSkillUpAdminRole } from '@/lib/admin-session';
import { RoleLockedNotice } from '@/components/role-locked-notice';
import { listAdminPayments } from '@/lib/skillup-admin-data';

export default async function PaymentsPage() {
  if ((await getSkillUpAdminRole()) !== 'admin') {
    return (
      <RoleLockedNotice
        title="Payments are admin-only"
        description="Finance and receipt handling stay hidden in counsellor view. Please use the CRM or students surface instead."
      />
    );
  }

  const payments = await listAdminPayments();

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-6 py-8 lg:py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Payments</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Installments, overdue detection, and CSV export</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Receipts are tracked by payment reference, overdue installments are highlighted after fourteen days, and the export stream is available for finance.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/api/admin/payments/export" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50">
            Export CSV
          </Link>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {payments.map((payment) => (
          <article key={payment.id} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-slate-600">{payment.studentName}</p>
                <h3 className="mt-1 text-2xl font-black tracking-tight text-slate-950">{payment.installmentId}</h3>
                <p className="mt-2 text-sm text-slate-600">Reference {payment.paymentRef}</p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-[11px] font-bold ${
                  payment.status === 'paid'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                    : payment.status === 'overdue'
                      ? 'border-rose-200 bg-rose-50 text-rose-700'
                      : 'border-amber-200 bg-amber-50 text-amber-700'
                }`}
              >
                {payment.status}
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Amount</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{payment.amount}</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.32em] text-slate-500">Overdue days</p>
                <p className="mt-2 text-3xl font-black tracking-tight text-slate-950">{payment.overdueDays}</p>
              </div>
            </div>

            <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-800">Due date</p>
              <p className="mt-1 text-sm text-slate-600">{payment.dueDate}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
