import Link from 'next/link';

export default function LiveSessionsBridgePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Live Sessions</h1>
        <p className="max-w-2xl text-sm font-medium leading-7 text-slate-500">
          Live faculty support is managed from the tutorial experience. This bridge page keeps the dashboard navigation valid.
        </p>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">Bridge page</p>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          If you need to request a live session, open a lesson from the Knowledge Hub and use the live session panel there.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/learn"
            className="inline-flex items-center justify-center rounded-2xl bg-pink-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-pink-600/20 transition hover:bg-pink-700"
          >
            Open Knowledge Hub
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-2xl border border-slate-200 px-5 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
