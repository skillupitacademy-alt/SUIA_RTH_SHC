import React from 'react';
import { ArrowRight, BookOpen, CheckCircle2, Sparkles } from 'lucide-react';

const asRecord = (value: unknown): Record<string, unknown> => (
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
);

const asArray = <T,>(value: unknown): T[] => Array.isArray(value) ? value as T[] : [];

const asString = (value: unknown, fallback = '') => (
  typeof value === 'string' && value.trim() ? value : fallback
);

const asNumber = (value: unknown, fallback = 0) => (
  typeof value === 'number' && Number.isFinite(value) ? value : fallback
);

const titleCase = (value: unknown) => String(value || '')
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/[_-]+/g, ' ')
  .split(' ')
  .filter(Boolean)
  .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
  .join(' ');

const contrastText = (hex: string) => {
  const normalized = hex.replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return '#ffffff';
  const r = parseInt(normalized.slice(0, 2), 16);
  const g = parseInt(normalized.slice(2, 4), 16);
  const b = parseInt(normalized.slice(4, 6), 16);
  return ((r * 299 + g * 587 + b * 114) / 1000) > 150 ? '#0f172a' : '#ffffff';
};

const readableItem = (value: unknown, fallback: string) => {
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  const record = asRecord(value);
  return asString(record.title, asString(record.label, asString(record.description, fallback)));
};

const getConfiguredPart = (
  parts: Record<string, unknown>[],
  ids: string[],
  fallbackVisible = true
) => {
  const part = parts.find((item) => ids.some((id) => String(item.id || '').toLowerCase().includes(id)));
  return {
    visible: part?.visible !== false && fallbackVisible,
    label: asString(part?.label, ''),
    color: asString(part?.color, ''),
  };
};

function summarizeContent(data: unknown, subsection: string, section: string) {
  const record = asRecord(data);
  const title = asString(
    record.title,
    asString(record.headline, asString(record.summaryTitle, asString(record.label, titleCase(subsection || section))))
  );
  const description = asString(
    record.description,
    asString(record.content, asString(record.definitionText, asString(record.simpleDefinition, 'A focused learning block generated from the selected architecture.')))
  );
  const iconLabel = asString(record.iconLabel, asString(record.badge, 'JS'));
  const difficulty = asString(record.difficulty, asString(record.level, 'Beginner'));
  const topicsCount = asNumber(record.topicsCount, asNumber(record.lessonsCount, 10));
  const lastUpdated = asString(record.lastUpdated, 'Today');
  const directItems = Array.isArray(data) ? asArray<unknown>(data) : [];
  const arrayItems = Object.entries(record)
    .filter(([, value]) => Array.isArray(value))
    .flatMap(([key, value]) => asArray<unknown>(value).slice(0, 4).map((item, index) => ({
      key: `${key}-${index}`,
      label: readableItem(item, `${titleCase(key)} ${index + 1}`),
    })));
  const items = directItems.length
    ? directItems.slice(0, 6).map((item, index) => ({ key: `item-${index}`, label: readableItem(item, `Learning point ${index + 1}`) }))
    : arrayItems;

  return { title, description, iconLabel, difficulty, topicsCount, lastUpdated, items };
}

export function ContractAwareComponentPreview({
  section,
  subsection,
  data,
  contract,
  showDiagnostics = false,
}: {
  section: string;
  subsection: string;
  data: unknown;
  contract: Record<string, unknown>;
  showDiagnostics?: boolean;
}) {
  const layout = asString(contract.layout, asString(contract.layout_type, 'card')).toLowerCase();
  const density = asString(contract.density, 'comfortable').toLowerCase();
  const typography = asString(contract.typography_scale, 'standard').toLowerCase();
  const primaryColor = asString(contract.primary_color, '#4f46e5');
  const accentColor = asString(contract.accent_color, '#10b981');
  const backgroundColor = asString(contract.background_color, '#ffffff');
  const textColor = asString(contract.text_color, '#0f172a');
  const borderColor = asString(contract.border_color, '#dbeafe');
  const parts = asArray<Record<string, unknown>>(contract.ui_subcomponents);
  const headerPart = getConfiguredPart(parts, ['header', 'title']);
  const bodyPart = getConfiguredPart(parts, ['body', 'content', 'main']);
  const actionPart = getConfiguredPart(parts, ['action', 'cta', 'button']);
  const summary = summarizeContent(data, subsection, section);
  const compact = density === 'compact';
  const spacious = density === 'spacious';
  const padding = compact ? 'p-5' : spacious ? 'p-9' : 'p-7';
  const gap = compact ? 'gap-4' : spacious ? 'gap-8' : 'gap-6';
  const titleSize = typography === 'large' || typography === 'hero'
    ? 'text-4xl lg:text-5xl'
    : typography === 'compact' || typography === 'caption'
      ? 'text-2xl lg:text-3xl'
      : 'text-3xl lg:text-4xl';
  const hasItems = summary.items.length > 0;

  const badges = (
    <div className="flex flex-wrap items-center gap-3">
      <span className="rounded-full px-3 py-1 text-xs font-black text-white" style={{ backgroundColor: primaryColor }}>
        {summary.iconLabel}
      </span>
      <span className="rounded-full border px-3 py-1 text-xs font-bold" style={{ borderColor: `${accentColor}66`, backgroundColor: `${accentColor}12`, color: accentColor }}>
        {summary.difficulty}
      </span>
    </div>
  );

  const header = headerPart.visible ? (
    <div className={compact ? 'space-y-3' : 'space-y-4'}>
      {badges}
      <h2 className={`${titleSize} font-black leading-tight`} style={{ color: textColor }}>{summary.title}</h2>
      <p className="max-w-2xl text-base font-semibold leading-7 text-slate-600">{summary.description}</p>
    </div>
  ) : null;

  const stats = (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor }}>
        <p className="text-2xl font-black" style={{ color: primaryColor }}>{summary.topicsCount}</p>
        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">Learning blocks</p>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor }}>
        <p className="text-2xl font-black" style={{ color: primaryColor }}>{summary.lastUpdated}</p>
        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">Last updated</p>
      </div>
    </div>
  );

  const learningCard = (
    <div className="rounded-3xl border bg-white p-6 shadow-lg" style={{ borderColor }}>
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}>
        <Sparkles size={28} />
      </div>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">Learner First View</p>
      <p className="mt-2 text-2xl font-black" style={{ color: textColor }}>{summary.title}</p>
      <div className="mt-5 h-2 rounded-full bg-slate-100">
        <div className="h-full w-2/5 rounded-full" style={{ backgroundColor: primaryColor }} />
      </div>
    </div>
  );

  const body = bodyPart.visible ? (
    <div className={compact ? 'space-y-4' : 'space-y-5'}>
      {hasItems ? (
        <div className={`grid ${gap} ${layout.includes('grid') ? 'md:grid-cols-2' : ''}`}>
          {summary.items.slice(0, 6).map((item, index) => (
            <div key={item.key} className="flex items-start gap-3 rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor }}>
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white" style={{ backgroundColor: primaryColor }}>
                {index + 1}
              </span>
              <p className="text-sm font-bold leading-6 text-slate-700">{item.label}</p>
            </div>
          ))}
        </div>
      ) : (
        stats
      )}
    </div>
  ) : null;

  const action = actionPart.visible ? (
    <div className="flex flex-wrap items-center gap-3">
      <button className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-black text-white shadow-sm" style={{ backgroundColor: accentColor }}>
        Start learning <ArrowRight size={17} />
      </button>
      <button className="inline-flex items-center gap-2 rounded-full border bg-white px-5 py-3 text-sm font-black" style={{ borderColor, color: primaryColor }}>
        <BookOpen size={17} /> View roadmap
      </button>
    </div>
  ) : null;

  const content = (() => {
    if (layout.includes('accordion')) {
      return (
        <div className="space-y-3">
          <details open className="rounded-2xl border bg-white p-5" style={{ borderColor }}>
            <summary className="cursor-pointer text-base font-black" style={{ color: primaryColor }}>{summary.title}</summary>
            <div className="mt-4 space-y-5">{header}{body}{action}</div>
          </details>
          {hasItems ? summary.items.slice(0, 3).map((item) => (
            <details key={item.key} className="rounded-2xl border bg-white p-5" style={{ borderColor }}>
              <summary className="cursor-pointer text-sm font-bold text-slate-700">{item.label}</summary>
            </details>
          )) : null}
        </div>
      );
    }

    if (layout.includes('timeline')) {
      return (
        <div className="space-y-5">
          {[header, body, action].filter(Boolean).map((block, index) => (
            <div key={index} className="grid grid-cols-[38px_1fr] gap-4">
              <div className="flex flex-col items-center">
                <span className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-black text-white" style={{ backgroundColor: primaryColor }}>{index + 1}</span>
                {index < 2 ? <span className="h-full w-px bg-slate-200" /> : null}
              </div>
              <div className="rounded-3xl border bg-white p-5 shadow-sm" style={{ borderColor }}>{block}</div>
            </div>
          ))}
        </div>
      );
    }

    if (layout.includes('grid')) {
      return (
        <div className={`grid ${gap} lg:grid-cols-[1fr_0.85fr] lg:items-start`}>
          <div className="space-y-5">{header}{action}</div>
          <div className="space-y-5">{body}{learningCard}</div>
        </div>
      );
    }

    if (layout.includes('hero') || layout.includes('wide')) {
      return (
        <div className={`grid ${gap} lg:grid-cols-[1.1fr_0.9fr] lg:items-center`}>
          <div className="space-y-6">{header}{action}</div>
          <div className="space-y-5">{learningCard}{body}</div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {header}
        {body}
        {action}
      </div>
    );
  })();

  return (
    <section
      data-testid="contract-aware-component-preview"
      className={`overflow-hidden rounded-3xl border ${padding} shadow-xl`}
      style={{ backgroundColor, borderColor, color: textColor }}
    >
      {content}

      {showDiagnostics ? (
        <div className="mt-6 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
          {[
            `Renderer: ${titleCase(asString(contract.renderer, String(contract.component || 'default_renderer')))}`,
            `Layout: ${titleCase(layout)}`,
            `Desktop: ${titleCase(asString(contract.desktop_layout, layout))}`,
            `Mobile: ${titleCase(asString(contract.mobile_layout, 'stacked_cards'))}`,
            `Density: ${titleCase(density)}`,
          ].map((badge) => (
            <span key={badge} className="rounded-full border bg-white px-3 py-1 text-[10px] font-black uppercase tracking-wider" style={{ borderColor, color: primaryColor }}>
              {badge}
            </span>
          ))}
        </div>
      ) : null}
    </section>
  );
}
