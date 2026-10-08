import Link from 'next/link';

export default function AssignmentsBridgePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-4xl font-black tracking-tight text-slate-900 uppercase">Assignments</h1>
        <p className="max-w-2xl text-sm font-medium leading-7 text-slate-500">
          Assignment practice lives in the tutorial app. Use the Knowledge Hub to continue the lesson flow, then return here for quiz-side progress.
        </p>
      </div>

      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-pink-600">Bridge page</p>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          This route now resolves cleanly so the sidebar no longer 404s. For lesson-based assignments, open the tutorial experience from the Knowledge Hub.
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
