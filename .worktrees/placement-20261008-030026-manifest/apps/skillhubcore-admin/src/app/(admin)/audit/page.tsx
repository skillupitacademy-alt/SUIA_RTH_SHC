'use client';

import { useEffect, useMemo, useState } from 'react';

import { AdminAuditEntry, adminAuditLogs, formatDateTime, formatPlatform } from '@/lib/skillhubcore-admin-data';

const PAGE_SIZE = 50;

type Filters = {
  actor: string;
  action: string;
  platform: string;
  from: string;
  to: string;
};

const initialFilters: Filters = {
  actor: '',
  action: '',
  platform: '',
  from: '',
  to: '',
};

export default function AuditPage() {
  const [filters, setFilters] = useState(initialFilters);
  const [page, setPage] = useState(1);

  const filteredLogs = useMemo(() => {
    return adminAuditLogs.filter((entry: AdminAuditEntry) => {
      const actorMatches = filters.actor.trim().length === 0 || entry.actor.toLowerCase().includes(filters.actor.toLowerCase());
      const actionMatches = filters.action.trim().length === 0 || entry.action.toLowerCase().includes(filters.action.toLowerCase());
      const platformMatches =
        filters.platform.trim().length === 0 || formatPlatform(entry.platform).toLowerCase().includes(filters.platform.toLowerCase());

      const entryDate = new Date(entry.createdAt);
      const fromMatches = filters.from.length === 0 || entryDate >= new Date(`${filters.from}T00:00:00`);
      const toMatches = filters.to.length === 0 || entryDate <= new Date(`${filters.to}T23:59:59.999`);

      return actorMatches && actionMatches && platformMatches && fromMatches && toMatches;
    });
  }, [filters]);

  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  useEffect(() => {
    if (page !== safePage) {
      setPage(safePage);
    }
  }, [page, safePage]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  const currentEntries = filteredLogs.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const startIndex = filteredLogs.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const endIndex = Math.min(filteredLogs.length, safePage * PAGE_SIZE);

  return (
    <section className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:py-10">
      <article className="rounded-[2rem] border border-slate-200/80 bg-white/70 p-8 shadow-sm backdrop-blur-[16px]">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Activity Log</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight font-outfit text-slate-950">auth_audit_log monitor</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          This is the primary security monitoring page. It surfaces the audit trail with before and after details, filters,
          and pagination for incident review.
        </p>
      </article>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <article className="rounded-[2rem] border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-[16px]">
          <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Filters</p>
          <div className="mt-6 grid gap-3">
            <input
              value={filters.actor}
              onChange={(event) => setFilters((current) => ({ ...current, actor: event.target.value }))}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-300"
              placeholder="Actor"
            />
            <input
              value={filters.action}
              onChange={(event) => setFilters((current) => ({ ...current, action: event.target.value }))}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-300"
              placeholder="Action"
            />
            <input
              value={filters.platform}
              onChange={(event) => setFilters((current) => ({ ...current, platform: event.target.value }))}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-300"
              placeholder="Platform"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-semibold text-slate-700">
                From
                <input
                  type="date"
                  value={filters.from}
                  onChange={(event) => setFilters((current) => ({ ...current, from: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-300"
                />
              </label>
              <label className="block text-sm font-semibold text-slate-700">
                To
                <input
                  type="date"
                  value={filters.to}
                  onChange={(event) => setFilters((current) => ({ ...current, to: event.target.value }))}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-300"
                />
              </label>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setFilters(initialFilters)}
            className="mt-6 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50"
          >
            Clear filters
          </button>
        </article>

        <article className="rounded-[2rem] border border-slate-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-[16px]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">Entries</p>
              <p className="mt-2 text-sm text-slate-600">
                Showing {startIndex}-{endIndex} of {filteredLogs.length}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                Previous
              </button>
              <span className="rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-bold text-cyan-700">
                Page {safePage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {currentEntries.map((entry) => (
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

            {currentEntries.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
                No audit entries match the current filters.
              </div>
            ) : null}
          </div>
        </article>
      </section>
    </section>
  );
}
