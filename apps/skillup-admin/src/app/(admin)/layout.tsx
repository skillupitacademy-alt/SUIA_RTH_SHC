import Link from 'next/link';
import { getSkillUpAdminRole } from '@/lib/admin-session';
import type { ReactNode } from 'react';

const adminNavItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/students', label: 'Students' },
  { href: '/crm', label: 'CRM' },
  { href: '/batches', label: 'Batches' },
  { href: '/payments', label: 'Payments' },
  { href: '/placement', label: 'Placement' },
  { href: '/audit', label: 'Audit Log' },
];

const counsellorNavItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/students', label: 'Students' },
  { href: '/crm', label: 'CRM' },
];

export default async function AdminSectionLayout({ children }: { children: ReactNode }) {
  const role = await getSkillUpAdminRole();
  const navItems = role === 'admin' ? adminNavItems : counsellorNavItems;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(14,165,233,0.11),_transparent_30%),linear-gradient(180deg,#f8fbff_0%,#eef4fb_100%)] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/88 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">SkillUp Admin Portal</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight">Admissions and growth control center</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600">
              Student ops, CRM, batches, payments, and placement live here in the same locked light shell used across the platform.
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 lg:items-end">
            <span className="rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.35em] text-cyan-700">
              {role === 'admin' ? 'Admin view' : role === 'counsellor' ? 'Counsellor view' : 'Guest view'}
            </span>
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
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
