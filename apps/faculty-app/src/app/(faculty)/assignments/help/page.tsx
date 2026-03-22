import { HelpRequestsPanel } from '@/components/help-requests-panel';
import { facultyHelpRequests } from '@/lib/faculty-demo-data';

export default function HelpRequestsPage() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-8 lg:py-10">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Assignment help</p>
        <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Open help requests</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
          These are the tutorial-engine requests that require faculty follow-up. Use in-progress when you start, and resolved once the student has an answer.
        </p>
      </div>
      <div className="mt-6">
        <HelpRequestsPanel requests={facultyHelpRequests} />
      </div>
    </section>
  );
}
