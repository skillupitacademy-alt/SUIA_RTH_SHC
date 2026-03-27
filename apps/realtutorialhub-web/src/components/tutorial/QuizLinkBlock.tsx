import Link from 'next/link';

interface QuizLinkBlockProps {
  title: string;
  description: string;
  href: string;
  ctaLabel?: string;
  accentColor?: string;
  ariaLabel?: string;
}

export function QuizLinkBlock({
  title,
  description,
  href,
  ctaLabel = 'Open quiz',
  accentColor = '#f57c00',
  ariaLabel,
}: QuizLinkBlockProps) {
  return (
    <section
      aria-label={ariaLabel ?? title}
      className="overflow-hidden rounded-3xl border border-white/20 bg-white/70 backdrop-blur-[16px]"
      style={{ boxShadow: '0 20px 60px rgba(15, 23, 42, 0.08)' }}
    >
      <div className="border-b border-white/25 px-6 py-4">
        <h2 className="font-outfit text-[15px] font-extrabold tracking-tight" style={{ color: accentColor }}>
          {title}
        </h2>
      </div>
      <div className="space-y-4 px-6 py-5">
        <p className="m-0 text-sm leading-7 text-slate-700">{description}</p>
        <Link
          href={href}
          className="inline-flex w-fit items-center rounded-full px-4 py-2 text-sm font-bold text-white transition hover:opacity-95"
          style={{ background: accentColor }}
        >
          {ctaLabel}
        </Link>
      </div>
    </section>
  );
}
