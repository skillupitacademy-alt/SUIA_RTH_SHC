import Link from 'next/link';

export default function LearnPage() {
  return (
    <section className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:py-10">
      <article className="surface-panel rounded-[3rem] p-8 lg:p-10">
        <p className="section-kicker text-cyan-600">Learn</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 font-outfit">Study workspace and lesson resources</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Your learning path and lesson resources are currently unavailable here.
        </p>
        <Link href="/student/my-batch" className="mt-6 inline-block text-sm font-semibold text-cyan-700 transition hover:text-cyan-900">
          Batch details
        </Link>
      </article>
    </section>
  );
}
