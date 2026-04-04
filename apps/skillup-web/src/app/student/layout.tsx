import Link from 'next/link';
import type { ReactNode } from 'react';

import { StudentRouteTracker } from '@/components/StudentRouteTracker';

export const dynamic = 'force-dynamic';

const navItems = [
  { href: '/student', label: 'Dashboard' },
  { href: '/student/my-batch', label: 'My Batch' },
  { href: '/student/attendance', label: 'Attendance' },
  { href: '/student/payments', label: 'Payments' },
  { href: 'https://placement.skillhubcore.in/?brand=skillup', label: 'Placement' },
  { href: '/student/learn', label: 'Learn' },
  { href: '/student/exams', label: 'Exams' },
];

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <div className="surface-shell min-h-screen text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="section-kicker text-cyan-600">SkillUp Student Portal</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight font-outfit">Learner workspace</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Batch progress, attendance, payments, and placement stay in the same light shell used across the platform.
            </p>
          </div>
          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-slate-900"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <StudentRouteTracker />
      <main>{children}</main>
    </div>
  );
}
