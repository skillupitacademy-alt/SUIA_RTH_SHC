import Link from 'next/link';

const columns = [
  {
    title: 'Programs',
    links: [
      { href: '/programs/full-stack-web', label: 'Full Stack Developer' },
      { href: '/programs/data-analytics', label: 'Data Analyst' },
      { href: '/programs/cloud-ops', label: 'Cloud Support' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '/', label: 'Home' },
      { href: '/login', label: 'Sign In' },
      { href: '/signup', label: 'Apply' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '/robots.txt', label: 'Robots' },
      { href: '/sitemap.xml', label: 'Sitemap' },
      { href: '/manifest.json', label: 'Manifest' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-white/65 backdrop-blur-sm">
      <div className="mx-auto grid max-w-7xl gap-8 px-6 py-10 md:grid-cols-3">
        {columns.map((column) => (
          <section key={column.title}>
            <p className="text-xs font-black uppercase tracking-[0.35em] text-slate-500">{column.title}</p>
            <ul className="mt-4 space-y-3">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm font-semibold text-slate-600 transition hover:text-cyan-700">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <div className="border-t border-slate-200/80 px-6 py-4 text-center text-xs font-medium text-slate-500">
        SkillUp IT Academy
      </div>
    </footer>
  );
}
