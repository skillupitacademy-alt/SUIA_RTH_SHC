interface SummaryBlockProps {
  title: string;
  points: string[];
  accentColor?: string;
  ariaLabel?: string;
}

export function SummaryBlock({ title, points, accentColor = '#2e4057', ariaLabel }: SummaryBlockProps) {
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
      <div className="px-6 py-5">
        <ul className="m-0 space-y-3 pl-5 text-sm leading-7 text-slate-700">
          {points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
