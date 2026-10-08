import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PaymentEditForm } from '@/components/payment/PaymentEditForm';
import { RoleLockedNotice } from '@/components/role-locked-notice';
import { getSkillUpAdminRole } from '@/lib/admin-session';
import { getAdminPaymentDetail } from '@/lib/skillup-admin-data';

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  if ((await getSkillUpAdminRole()) !== 'admin') {
    return (
      <RoleLockedNotice
        title="Payments are admin-only"
        description="Finance and receipt handling stay hidden in counsellor view. Please use the CRM or students surface instead."
      />
    );
  }

  const { id } = await params;
  const payment = await getAdminPaymentDetail(id);
  if (payment === undefined) {
    notFound();
  }

  return (
    <section className="mx-auto max-w-7xl space-y-6 px-6 py-8 lg:py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Payment detail</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">{payment.studentName}</h2>
        <p className="mt-2 text-sm text-slate-600">
          {payment.installmentId} · {payment.status}
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <PaymentEditForm payment={payment} />

        <aside className="space-y-4">
          <div className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Current values</p>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">Amount</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">INR {payment.amount.toLocaleString('en-IN')}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">Due date</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{payment.dueDate}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-slate-500">Reference</p>
                <p className="mt-1 text-lg font-semibold text-slate-950">{payment.paymentRef}</p>
              </div>
            </div>
          </div>

          <Link
            href="/payments"
            className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-cyan-700 transition hover:border-cyan-300 hover:bg-cyan-50"
          >
            Back to payments
          </Link>
        </aside>
      </div>
    </section>
  );
}
