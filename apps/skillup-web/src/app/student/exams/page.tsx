import Link from 'next/link';

export default function ExamsPage() {
  return (
    <section className="mx-auto max-w-7xl space-y-8 px-6 py-8 lg:py-10">
      <article className="surface-panel rounded-[3rem] p-8 lg:p-10">
        <p className="section-kicker text-cyan-600">Assessments</p>
        <h2 className="mt-3 text-4xl font-black tracking-tight text-slate-950 font-outfit">Assessments</h2>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">
          Assessment availability is currently unavailable. Review your current batch topics while the assessment list is unavailable.
        </p>
        <Link href="https://placement.skillhubcore.in/?brand=skillup" className="mt-6 inline-block text-sm font-semibold text-cyan-700 transition hover:text-cyan-900">
          Placement view
        </Link>
      </article>
    </section>
  );
}
