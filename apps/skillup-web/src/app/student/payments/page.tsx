import { formatCurrency, formatDate, isOverdue, studentInstallments } from '@/lib/skillup-demo-data';

export default function PaymentsPage() {
  return (
    <section className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:py-10">
      <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Payments</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">Fee history and upcoming installments</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          Installments are highlighted when they are overdue so the student can act before a queue builds up.
        </p>
      </article>

      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="space-y-4">
            {studentInstallments.map((installment) => {
              const overdue = installment.status === 'overdue' || isOverdue(installment.dueDate);

              return (
                <div
                  key={installment.id}
                  className={`rounded-3xl border p-4 ${
                    overdue ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{installment.label}</p>
                      <p className="mt-1 text-sm text-slate-600">Due {formatDate(installment.dueDate)}</p>
                    </div>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                        installment.status === 'paid'
                          ? 'border border-emerald-200 bg-emerald-50 text-emerald-700'
                          : overdue
                            ? 'border border-rose-200 bg-rose-50 text-rose-700'
                            : 'border border-amber-200 bg-amber-50 text-amber-700'
                      }`}
                    >
                      {installment.status}
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-lg font-black text-slate-950">{formatCurrency(installment.amount)}</p>
                    {installment.paymentRef ? (
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">{installment.paymentRef}</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </article>

        <aside className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Actions</p>
          <div className="mt-6 space-y-4">
            <button className="w-full rounded-full bg-cyan-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-cyan-600">
              Pay overdue installment
            </button>
            <button className="w-full rounded-full border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50">
              Download receipt
            </button>
          </div>
        </aside>
      </section>
    </section>
  );
}
