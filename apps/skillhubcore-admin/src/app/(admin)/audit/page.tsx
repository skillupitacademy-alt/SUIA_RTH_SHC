import { adminAuditLogs, formatDateTime, formatPlatform } from '@/lib/skillhubcore-admin-data';

export default function AuditPage() {
  return (
    <section className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:py-10">
      <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Activity Log</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950">auth_audit_log monitor</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          This is the primary security monitoring page. It surfaces the audit trail with before and after details for review.
        </p>
      </article>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Filters</p>
          <div className="mt-6 grid gap-3">
            <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-300" placeholder="Actor" />
            <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-300" placeholder="Action" />
            <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-300" placeholder="Platform" />
            <input className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-300" placeholder="Date range" />
          </div>
        </article>

        <article className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Entries</p>
          <div className="mt-6 space-y-3">
            {adminAuditLogs.map((entry) => (
              <details key={entry.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <summary className="cursor-pointer list-none">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{entry.action}</p>
                      <p className="mt-1 text-sm text-slate-600">
                        {entry.actor} - {formatPlatform(entry.platform)}
                      </p>
                    </div>
                    <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-700">
                      {formatDateTime(entry.createdAt)}
                    </span>
                  </div>
                </summary>
                <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">
                  <p className="text-sm text-slate-700">{entry.details}</p>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">Before</p>
                      <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-700">
                        {JSON.stringify(entry.before, null, 2)}
                      </pre>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-500">After</p>
                      <pre className="mt-2 whitespace-pre-wrap text-xs text-slate-700">
                        {JSON.stringify(entry.after, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </article>
      </section>
    </section>
  );
}
