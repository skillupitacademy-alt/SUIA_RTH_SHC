import Link from 'next/link';

const navItems = [
  { href: '/', label: 'Home' },
  { href: '/programs', label: 'Programs' },
  { href: '/login', label: 'Sign In' },
];

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-100 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500 text-lg font-black text-white shadow-sm">
            S
          </span>
          <span>
            <span className="block text-[0.65rem] font-black uppercase tracking-[0.45em] text-cyan-600">SkillUp</span>
            <span className="block text-sm font-semibold text-slate-600">IT Academy</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-2 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-cyan-50 hover:text-cyan-700"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-800"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="rounded-full bg-cyan-500 px-4 py-2 text-sm font-bold text-white transition hover:bg-cyan-600"
          >
            Apply
          </Link>
        </div>
      </div>
    </header>
  );
}
