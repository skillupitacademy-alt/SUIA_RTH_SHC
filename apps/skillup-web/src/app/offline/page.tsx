export const metadata = {
  title: 'Offline',
  description: 'Offline fallback for the SkillUp IT Academy student portal.',
};

export default function OfflinePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl items-center px-6 py-10">
      <section className="w-full rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">Offline mode</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight text-slate-950">Your training dashboard is unavailable offline</h1>
        <p className="mt-3 text-sm leading-7 text-slate-600">
          Reconnect to continue with batches, attendance, payments, and placement data.
        </p>
      </section>
    </main>
  );
}
