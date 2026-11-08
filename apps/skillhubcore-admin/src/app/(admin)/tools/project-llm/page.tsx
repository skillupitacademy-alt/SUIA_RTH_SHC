import Link from 'next/link';

export default function ProjectLlmDashboardPage() {
  return (
    <section className="mx-auto max-w-5xl space-y-6 p-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900">Project LLM</h1>
        <p className="mt-3 text-sm text-slate-600">
          Workflow status, certification evidence, repository snapshot and recent activity are currently unavailable.
        </p>
      </div>
      <nav aria-label="Project LLM tools" className="flex flex-wrap gap-3 text-sm font-bold">
        <Link href="/tools/project-llm/create" className="rounded-xl border border-slate-200 bg-white px-4 py-3">Create</Link>
        <Link href="/tools/project-llm/registry" className="rounded-xl border border-slate-200 bg-white px-4 py-3">Registry</Link>
        <Link href="/tools/project-llm/explorer" className="rounded-xl border border-slate-200 bg-white px-4 py-3">Explorer</Link>
        <Link href="/tools/project-llm/candidate-upload" className="rounded-xl border border-slate-200 bg-white px-4 py-3">Upload candidate</Link>
        <Link href="/tools/project-llm/workflow-details" className="rounded-xl border border-slate-200 bg-white px-4 py-3">Workflow details</Link>
        <Link href="/tools/project-llm/integration-certification" className="rounded-xl border border-slate-200 bg-white px-4 py-3">Integration and certification</Link>
        <Link href="/tools/project-llm/external-ai-handoff" className="rounded-xl border border-slate-200 bg-white px-4 py-3">External AI handoff</Link>
        <Link href="/tools/project-llm/compliance-brief" className="rounded-xl border border-slate-200 bg-white px-4 py-3">Compliance brief</Link>
        <Link href="/tools/tutorial-page-content" className="rounded-xl border border-slate-200 bg-white px-4 py-3">Tutorial composer</Link>
        <Link href="/tools/project-llm/mix-match" className="rounded-xl border border-slate-200 bg-white px-4 py-3">Mix &amp; match</Link>
      </nav>
    </section>
  );
}
