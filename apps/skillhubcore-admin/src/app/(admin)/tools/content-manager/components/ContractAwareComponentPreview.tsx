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
    layout: asString(part?.layout, 'inline').toLowerCase(),
    align: asString(part?.align, 'left').toLowerCase(),
    spacing: asString(part?.spacing, 'normal').toLowerCase(),
    radius: asString(part?.radius, 'rounded').toLowerCase(),
    shadow: asString(part?.shadow, 'soft').toLowerCase(),
  };
};

const getExactConfiguredPart = (
  parts: Record<string, unknown>[],
  id: string,
  fallbackColor: string
) => {
  const part = parts.find((item) => String(item.id || '').toLowerCase() === id.toLowerCase());
  return {
    visible: part?.visible !== false,
    color: asString(part?.color, fallbackColor),
    label: asString(part?.label, titleCase(id)),
    layout: asString(part?.layout, 'inline').toLowerCase(),
    align: asString(part?.align, 'left').toLowerCase(),
    spacing: asString(part?.spacing, 'normal').toLowerCase(),
    radius: asString(part?.radius, 'pill').toLowerCase(),
    shadow: asString(part?.shadow, 'none').toLowerCase(),
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

const buildCodePreviewDocument = (code: string) => {
  const isFullDocument = /<html[\s>]/i.test(code);
  if (isFullDocument) return code;

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
      html, body { margin: 0; min-height: 100%; background: transparent; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
      body { padding: 0; }
      * { box-sizing: border-box; }
    </style>
  </head>
  <body>
    ${code}
  </body>
</html>`;
};

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
  const customRendererCode = asString(contract.custom_renderer_code, '');

  if (customRendererCode) {
    return (
      <iframe
        data-testid="contract-aware-component-preview"
        title="Custom renderer code preview"
        sandbox="allow-scripts"
        srcDoc={buildCodePreviewDocument(customRendererCode)}
        className="block h-[640px] w-full border-0 bg-transparent"
      />
    );
  }

  const layout = asString(contract.layout, asString(contract.layout_type, 'card')).toLowerCase();
  const renderer = asString(contract.renderer, asString(contract.component, 'SubtopicViewPage'));
  const styleVariant = asString(contract.style_variant, 'standard').toLowerCase();
  const animation = asString(contract.animation, asString(contract.animation_type, 'none')).toLowerCase();
  const emphasis = asString(contract.emphasis_level, 'medium').toLowerCase();
  const colorRole = asString(contract.color_role, 'primary').toLowerCase();
  const desktopLayout = asString(contract.desktop_layout, 'single_column').toLowerCase();
  const tabletLayout = asString(contract.tablet_layout, 'stacked_cards').toLowerCase();
  const mobileLayout = asString(contract.mobile_layout, 'stacked_cards').toLowerCase();
  const density = asString(contract.density, 'comfortable').toLowerCase();
  const typography = asString(contract.typography_scale, 'standard').toLowerCase();
  const primaryColor = asString(contract.primary_color, '#4f46e5');
  const primaryColorDark = asString(contract.primary_color_dark, primaryColor);
  const accentColor = asString(contract.accent_color, primaryColorDark);
  const backgroundColor = asString(contract.background_color, '#ffffff');
  const textColor = asString(contract.text_color, '#0f172a');
  const borderColor = asString(contract.border_color, '#dbeafe');
  const brandVariant = asString(contract.brand_variant, 'shared').toLowerCase();
  const domainOverride = asString(contract.domain_override, 'default').toLowerCase();
  const interactiveElements = asArray<string>(contract.interactive_elements);
  const hoverState = Boolean(contract.hover_state);
  const clickable = Boolean(contract.clickable);
  const collapsible = Boolean(contract.collapsible);
  const progressiveDisclosure = Boolean(contract.progressive_disclosure);
  const keyboardNavigation = contract.keyboard_navigation !== false;
  const screenReaderLabels = contract.screen_reader_labels !== false;
  const reducedMotion = contract.reduced_motion !== false;
  const lazyLoad = Boolean(contract.lazy_load);
  const cacheComponent = Boolean(contract.cache_component);
  const prefetchAssets = Boolean(contract.prefetch_assets);
  const parts = asArray<Record<string, unknown>>(contract.ui_subcomponents);
  const containerPart = getConfiguredPart(parts, ['container', 'wrapper']);
  const headerPart = getConfiguredPart(parts, ['header', 'title']);
  const bodyPart = getConfiguredPart(parts, ['body', 'content', 'main']);
  const actionPart = getConfiguredPart(parts, ['action', 'cta', 'button']);
  const iconBadgePart = getExactConfiguredPart(parts, 'icon_badge', primaryColor);
  const difficultyBadgePart = getExactConfiguredPart(parts, 'difficulty_badge', accentColor);
  const brandBadgePart = getExactConfiguredPart(parts, 'brand_badge', asString(contract.secondary_color, accentColor));
  const titlePart = getExactConfiguredPart(parts, 'title', textColor);
  const descriptionPart = getExactConfiguredPart(parts, 'description', '#475569');
  const statCardsPart = getExactConfiguredPart(parts, 'stat_cards', borderColor);
  const statValuePart = getExactConfiguredPart(parts, 'stat_value', primaryColor);
  const primaryButtonPart = getExactConfiguredPart(parts, 'primary_button', accentColor);
  const secondaryButtonPart = getExactConfiguredPart(parts, 'secondary_button', primaryColor);
  const progressBarPart = getExactConfiguredPart(parts, 'progress_bar', primaryColor);
  const summary = summarizeContent(data, subsection, section);
  const compact = density === 'compact';
  const spacious = density === 'spacious';
  const partRadiusClass = (radius: string) => (
    radius === 'none' ? 'rounded-none' : radius === 'soft' ? 'rounded-xl' : radius === 'pill' ? 'rounded-[2rem]' : 'rounded-3xl'
  );
  const partShadowClass = (shadow: string) => (
    shadow === 'none' ? 'shadow-none' : shadow === 'strong' ? 'shadow-2xl' : 'shadow-xl'
  );
  const partPaddingClass = (spacing: string) => (
    spacing === 'tight' || compact ? 'p-5' : spacing === 'loose' || spacious ? 'p-9' : 'p-7'
  );
  const padding = partPaddingClass(containerPart.spacing);
  const gap = compact ? 'gap-4' : spacious ? 'gap-8' : 'gap-6';
  const focused = colorRole === 'accent' ? accentColor : primaryColor;
  const mutedSurface = colorRole === 'neutral' ? '#f8fafc' : `${focused}0f`;
  const domainLabel = domainOverride === 'default' ? 'Core concept' : titleCase(domainOverride);
  const brandLabel = brandVariant === 'suia' ? 'SkillUp IT Academy' : brandVariant === 'rth' ? 'Real Tutorial Hub' : 'Guided Learning';
  const styleClasses = containerPart.shadow
    ? partShadowClass(containerPart.shadow)
    : styleVariant === 'minimal'
    ? 'shadow-none'
    : styleVariant === 'featured'
      ? 'shadow-2xl'
      : styleVariant === 'outlined'
        ? 'shadow-sm'
        : 'shadow-xl';
  const radiusClass = containerPart.radius
    ? partRadiusClass(containerPart.radius)
    : styleVariant === 'compact' || compact ? 'rounded-2xl' : 'rounded-3xl';
  const containerLayout = containerPart.layout;
  const containerAlignClass = containerPart.align === 'center'
    ? 'text-center'
    : containerPart.align === 'right'
      ? 'text-right'
      : 'text-left';
  const containerFrameClass = containerLayout === 'inline'
    ? `overflow-visible rounded-none border-0 bg-transparent p-0 shadow-none ${containerAlignClass}`
    : containerLayout === 'pill'
      ? `overflow-hidden rounded-[2rem] border ${padding} ${styleClasses} ${containerAlignClass}`
      : containerLayout === 'progress'
        ? `overflow-hidden ${radiusClass} border ${padding} ${styleClasses} ${containerAlignClass}`
        : `overflow-hidden ${radiusClass} border ${padding} ${styleClasses} ${containerAlignClass}`;
  const emphasisScale = emphasis === 'high' ? 'scale-[1.01]' : emphasis === 'low' ? 'opacity-90' : '';
  const motionClass = reducedMotion
    ? ''
    : animation === 'pulse' || animation === 'progress'
      ? 'animate-pulse'
      : animation === 'fade_in'
        ? 'transition-opacity duration-500'
        : animation === 'slide_up'
          ? 'transition-transform duration-500'
          : '';
  const interactionClass = hoverState ? 'transition hover:-translate-y-0.5 hover:shadow-2xl' : '';
  const titleSize = typography === 'large' || typography === 'hero'
    ? 'text-4xl lg:text-5xl'
    : typography === 'compact' || typography === 'caption'
      ? 'text-2xl lg:text-3xl'
      : 'text-3xl lg:text-4xl';
  const hasItems = summary.items.length > 0;
  const partAlignClass = (part: { align: string }) => (
    part.align === 'center' ? 'text-center' : part.align === 'right' ? 'text-right' : 'text-left'
  );
  const partJustifyClass = (part: { align: string }) => (
    part.align === 'center' ? 'justify-center' : part.align === 'right' ? 'justify-end' : ''
  );
  const partSpaceClass = (part: { spacing: string }) => (
    compact ? 'space-y-3' : part.spacing === 'loose' ? 'space-y-7' : part.spacing === 'tight' ? 'space-y-3' : 'space-y-5'
  );
  const partPanelClass = (part: { radius: string; shadow: string; spacing: string; align: string }, extraClass = '') => (
    `${partRadiusClass(part.radius)} border bg-white ${part.spacing === 'tight' ? 'p-4' : part.spacing === 'loose' ? 'p-8' : 'p-5'} ${part.shadow === 'none' ? 'shadow-none' : part.shadow === 'strong' ? 'shadow-xl' : 'shadow-sm'} ${partAlignClass(part)} ${extraClass}`
  );
  const exactPartClass = (part: { radius: string; shadow: string; spacing: string }, basePadding = 'px-3 py-1') => {
    const paddingClass = part.spacing === 'tight'
      ? 'px-2 py-0.5'
      : part.spacing === 'loose'
        ? 'px-5 py-2'
        : basePadding;
    const shadowClass = part.shadow === 'none' ? 'shadow-none' : part.shadow === 'strong' ? 'shadow-lg' : 'shadow-sm';
    return `${partRadiusClass(part.radius)} ${paddingClass} ${shadowClass}`;
  };
  const exactAlignClass = (part: { align: string }) => (
    part.align === 'center' ? 'mx-auto text-center' : part.align === 'right' ? 'ml-auto text-right' : 'text-left'
  );

  const wrapPart = (partLayout: string, children: React.ReactNode, color: string, extraClass = '') => {
    const currentPart = [containerPart, headerPart, bodyPart, actionPart].find((part) => part.color === color) || containerPart;
    const radius = currentPart.radius === 'none' ? 'rounded-none' : currentPart.radius === 'soft' ? 'rounded-xl' : currentPart.radius === 'pill' ? 'rounded-[2rem]' : 'rounded-2xl';
    const shadow = currentPart.shadow === 'none' ? 'shadow-none' : currentPart.shadow === 'strong' ? 'shadow-xl' : 'shadow-sm';
    const spacingClass = currentPart.spacing === 'tight' ? 'p-3' : currentPart.spacing === 'loose' ? 'p-7' : 'p-5';
    const alignClass = currentPart.align === 'center' ? 'text-center' : currentPart.align === 'right' ? 'text-right' : 'text-left';
    if (partLayout === 'card') {
      return <div className={`${radius} border bg-white ${spacingClass} ${shadow} ${alignClass} ${extraClass}`} style={{ borderColor: color }}>{children}</div>;
    }
    if (partLayout === 'pill') {
      return <div className={`rounded-[2rem] border bg-white px-5 py-4 ${shadow} ${alignClass} ${extraClass}`} style={{ borderColor: color }}>{children}</div>;
    }
    if (partLayout === 'progress') {
      return (
        <div className={`${alignClass} ${extraClass}`}>
          {children}
          <div className="mt-4 h-2 rounded-full bg-slate-100">
            <div className="h-full rounded-full" style={{ width: progressiveDisclosure ? '48%' : '74%', backgroundColor: color }} />
          </div>
        </div>
      );
    }
    return <div className={extraClass}>{children}</div>;
  };

  const badges = wrapPart(headerPart.layout === 'pill' ? 'inline' : headerPart.layout, (
    <div className="flex flex-wrap items-center gap-3">
      {iconBadgePart.visible ? (
        <span className={`${exactPartClass(iconBadgePart)} inline-flex text-xs font-black ${exactAlignClass(iconBadgePart)}`} style={{ backgroundColor: iconBadgePart.color, color: contrastText(iconBadgePart.color) }}>
          {summary.iconLabel}
        </span>
      ) : null}
      {difficultyBadgePart.visible ? (
        <span className={`${exactPartClass(difficultyBadgePart)} inline-flex border text-xs font-bold ${exactAlignClass(difficultyBadgePart)}`} style={{ borderColor: `${difficultyBadgePart.color}66`, backgroundColor: `${difficultyBadgePart.color}12`, color: difficultyBadgePart.color }}>
          {summary.difficulty}
        </span>
      ) : null}
      {domainOverride !== 'default' ? (
        <span className="rounded-full border bg-white px-3 py-1 text-xs font-bold" style={{ borderColor, color: focused }}>
          {domainLabel}
        </span>
      ) : null}
      {brandVariant !== 'shared' && brandBadgePart.visible ? (
        <span className={`${exactPartClass(brandBadgePart)} inline-flex border bg-white text-xs font-bold ${exactAlignClass(brandBadgePart)}`} style={{ borderColor: `${brandBadgePart.color}66`, color: brandBadgePart.color }}>
          {brandLabel}
        </span>
      ) : null}
    </div>
  ), headerPart.color || primaryColor);

  const header = headerPart.visible ? (
    <div className={`${compact ? 'space-y-3' : headerPart.spacing === 'loose' ? 'space-y-6' : 'space-y-4'} ${headerPart.align === 'center' ? 'text-center' : headerPart.align === 'right' ? 'text-right' : 'text-left'}`} aria-label={screenReaderLabels ? `${renderer} header` : undefined}>
      {badges}
      {titlePart.visible ? <h2 className={`${titleSize} font-black leading-tight ${exactAlignClass(titlePart)}`} style={{ color: titlePart.color }}>{summary.title}</h2> : null}
      {descriptionPart.visible ? <p className={`max-w-2xl text-base font-semibold leading-7 ${exactAlignClass(descriptionPart)}`} style={{ color: descriptionPart.color }}>{summary.description}</p> : null}
    </div>
  ) : null;

  const stats = (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor: statCardsPart.color }}>
        <p className="text-2xl font-black" style={{ color: statValuePart.color }}>{summary.topicsCount}</p>
        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">Learning blocks</p>
      </div>
      <div className="rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor: statCardsPart.color }}>
        <p className="text-2xl font-black" style={{ color: statValuePart.color }}>{summary.lastUpdated}</p>
        <p className="mt-1 text-xs font-bold uppercase tracking-wide text-slate-500">Last updated</p>
      </div>
    </div>
  );

  const learningCard = (
    <div className="rounded-3xl border bg-white p-6 shadow-lg" style={{ borderColor, background: styleVariant === 'featured' ? `linear-gradient(135deg, #ffffff 0%, ${focused}12 100%)` : '#ffffff' }}>
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl" style={{ backgroundColor: `${primaryColor}18`, color: primaryColor }}>
        <Sparkles size={28} />
      </div>
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">{brandLabel}</p>
      <p className="mt-2 text-2xl font-black" style={{ color: textColor }}>{summary.title}</p>
      <div className="mt-5 h-2 rounded-full bg-slate-100">
        <div className="h-full rounded-full" style={{ width: progressiveDisclosure ? '42%' : '68%', backgroundColor: progressBarPart.color }} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wide text-slate-500">
        {lazyLoad ? <span>Optimized loading</span> : null}
        {cacheComponent ? <span>Fast revisit</span> : null}
        {prefetchAssets ? <span>Assets ready</span> : null}
      </div>
    </div>
  );

  const body = bodyPart.visible ? (
    <div className={`${compact ? 'space-y-4' : bodyPart.spacing === 'loose' ? 'space-y-7' : bodyPart.spacing === 'tight' ? 'space-y-3' : 'space-y-5'} ${bodyPart.align === 'center' ? 'text-center' : bodyPart.align === 'right' ? 'text-right' : 'text-left'}`} aria-label={screenReaderLabels ? `${renderer} content` : undefined}>
      {hasItems ? (
        <div className={`grid ${gap} ${layout.includes('grid') ? 'md:grid-cols-2' : ''}`}>
          {summary.items.slice(0, 6).map((item, index) => (
            <div key={item.key} className={`flex items-start gap-3 border bg-white p-4 ${bodyPart.radius === 'none' ? 'rounded-none' : bodyPart.radius === 'soft' ? 'rounded-xl' : bodyPart.radius === 'pill' ? 'rounded-[2rem]' : 'rounded-2xl'} ${bodyPart.shadow === 'none' ? 'shadow-none' : bodyPart.shadow === 'strong' ? 'shadow-xl' : 'shadow-sm'}`} style={{ borderColor: bodyPart.color || borderColor }}>
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black text-white" style={{ backgroundColor: primaryColor }}>
                {index + 1}
              </span>
              <p className="text-sm font-bold leading-6 text-slate-700">{item.label}</p>
            </div>
          ))}
        </div>
      ) : (
        wrapPart(bodyPart.layout, stats, bodyPart.color || borderColor)
      )}
    </div>
  ) : null;

  const action = actionPart.visible ? (
    <div className={`space-y-3 ${actionPart.align === 'center' ? 'text-center' : actionPart.align === 'right' ? 'text-right' : 'text-left'}`}>
      <div className={`flex flex-wrap items-center gap-3 ${actionPart.align === 'center' ? 'justify-center' : actionPart.align === 'right' ? 'justify-end' : ''}`}>
        <button
          className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-black text-white shadow-sm disabled:cursor-default"
          style={{ backgroundColor: primaryButtonPart.color, color: contrastText(primaryButtonPart.color) }}
          disabled={!clickable}
          tabIndex={keyboardNavigation ? 0 : -1}
        >
          {actionPart.label || 'Start learning'} <ArrowRight size={17} />
        </button>
        <button className="inline-flex items-center gap-2 rounded-full border bg-white px-5 py-3 text-sm font-black" style={{ borderColor: `${secondaryButtonPart.color}66`, color: secondaryButtonPart.color }}>
          <BookOpen size={17} /> View roadmap
        </button>
        {interactiveElements.slice(0, 3).map((item) => (
          <button key={item} className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-xs font-black" style={{ borderColor: actionPart.color || accentColor, color: actionPart.color || accentColor }}>
            {titleCase(item)}
          </button>
        ))}
      </div>
      <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-wide text-slate-500">
        {keyboardNavigation || screenReaderLabels || reducedMotion ? <span>Accessible reading mode</span> : null}
        {lazyLoad || cacheComponent || prefetchAssets ? <span>Optimized delivery</span> : null}
        {progressiveDisclosure ? <span>Step-by-step reveal</span> : null}
      </div>
    </div>
  ) : null;

  const appliedHeader = headerPart.layout === 'inline' ? header : wrapPart(headerPart.layout, header, headerPart.color || primaryColor);
  const appliedBody = bodyPart.layout === 'inline' ? body : wrapPart(bodyPart.layout, body, bodyPart.color || borderColor);
  const appliedAction = actionPart.layout === 'inline' ? action : wrapPart(actionPart.layout, action, actionPart.color || accentColor);
  const visibleBlocks = [appliedHeader, appliedBody, appliedAction].filter(Boolean);
  const notesPairClass = layout.includes('inline')
    ? `flex flex-wrap items-center justify-between ${gap}`
    : layout.includes('grid') || desktopLayout.includes('dashboard')
      ? `grid ${gap} md:grid-cols-2`
      : layout.includes('hero') || layout.includes('wide') || desktopLayout.includes('wide') || desktopLayout.includes('two_column')
        ? `grid ${gap} lg:grid-cols-[1.1fr_0.9fr] lg:items-center`
        : 'space-y-5';
  const notesCardClass = `${partRadiusClass(bodyPart.radius)} border bg-white ${bodyPart.spacing === 'tight' ? 'p-4' : bodyPart.spacing === 'loose' ? 'p-8' : 'p-6'} ${bodyPart.shadow === 'none' ? 'shadow-none' : bodyPart.shadow === 'strong' ? 'shadow-xl' : 'shadow-lg'}`;
  const notesPreviewCardClass = bodyPart.layout === 'inline'
    ? `${partSpaceClass(bodyPart)} ${partAlignClass(bodyPart)}`
    : bodyPart.layout === 'pill'
      ? `${partRadiusClass('pill')} border bg-white ${bodyPart.spacing === 'tight' ? 'px-4 py-3' : bodyPart.spacing === 'loose' ? 'px-8 py-6' : 'px-6 py-5'} ${bodyPart.shadow === 'none' ? 'shadow-none' : bodyPart.shadow === 'strong' ? 'shadow-xl' : 'shadow-lg'} ${partAlignClass(bodyPart)}`
      : bodyPart.layout === 'progress'
        ? `${partSpaceClass(bodyPart)} ${partAlignClass(bodyPart)}`
        : notesCardClass;
  const notesHeaderClass = `${partSpaceClass(headerPart)} ${partAlignClass(headerPart)}`;
  const notesBadgeRowClass = `flex flex-wrap items-center gap-3 ${partJustifyClass(headerPart)}`;
  const notesActionRowClass = `flex flex-wrap gap-3 ${partJustifyClass(actionPart)}`;
  const notesInlineHeaderStyle = headerPart.color
    ? {
      borderBottom: `3px solid ${headerPart.color}`,
      paddingBottom: compact ? '0.75rem' : '1rem',
    }
    : undefined;
  const renderNotesHeader = (children: React.ReactNode) => {
    if (!headerPart.visible) return null;
    const headerContent = <div className={notesHeaderClass} style={headerPart.layout === 'inline' ? notesInlineHeaderStyle : undefined}>{children}</div>;
    return headerPart.layout === 'inline'
      ? headerContent
      : wrapPart(headerPart.layout, headerContent, headerPart.color || primaryColor);
  };
  const contentRecord = asRecord(data);
  const normalizedSection = section.toLowerCase();
  const normalizedSubsection = subsection
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .replace(/[-\s]+/g, '_')
    .toLowerCase();
  const isNotesSection = normalizedSection === 'notes';

  const notesSpecificContent = isNotesSection ? (() => {
    if (['simple_words', 'simplewords', 'concept_card'].includes(normalizedSubsection)) {
      const quickLook = asArray<unknown>(contentRecord.quickLook);
      return (
        <div className={notesPairClass}>
          {renderNotesHeader(<>
            <div className={notesBadgeRowClass}>
              {iconBadgePart.visible ? (
                <span className={`${exactPartClass(iconBadgePart)} inline-flex text-xs font-black ${exactAlignClass(iconBadgePart)}`} style={{ backgroundColor: iconBadgePart.color, color: contrastText(iconBadgePart.color) }}>{summary.iconLabel}</span>
              ) : null}
              {difficultyBadgePart.visible ? (
                <span className={`${exactPartClass(difficultyBadgePart)} inline-flex border text-xs font-bold ${exactAlignClass(difficultyBadgePart)}`} style={{ borderColor: `${difficultyBadgePart.color}66`, color: difficultyBadgePart.color }}>{summary.difficulty}</span>
              ) : null}
              {brandVariant !== 'shared' && brandBadgePart.visible ? (
                <span className={`${exactPartClass(brandBadgePart)} inline-flex border bg-white text-xs font-bold ${exactAlignClass(brandBadgePart)}`} style={{ borderColor: `${brandBadgePart.color}66`, color: brandBadgePart.color }}>{brandLabel}</span>
              ) : null}
            </div>
            {titlePart.visible ? (
              <h2 className={`${titleSize} font-black leading-tight ${exactAlignClass(titlePart)}`} style={{ color: titlePart.color }}>
                {asString(contentRecord.heroTitle, `${summary.title} Notes`)}
              </h2>
            ) : null}
            {descriptionPart.visible ? (
              <p className={`max-w-2xl text-base font-semibold leading-7 ${exactAlignClass(descriptionPart)}`} style={{ color: descriptionPart.color }}>
                {asString(contentRecord.heroSubtitle, summary.description)}
              </p>
            ) : null}
            {secondaryButtonPart.visible ? (
              <div className={`flex flex-wrap gap-2 ${partJustifyClass(secondaryButtonPart) || partJustifyClass(headerPart)}`}>
                {(quickLook.length ? quickLook : ['Definition', 'Mechanics', 'Syntax', 'Examples']).map((item) => (
                  <span key={String(item)} className={`${exactPartClass(secondaryButtonPart, 'px-4 py-2')} border bg-white text-xs font-black ${exactAlignClass(secondaryButtonPart)}`} style={{ borderColor: `${secondaryButtonPart.color}66`, color: secondaryButtonPart.color }}>
                    {String(item)}
                  </span>
                ))}
              </div>
            ) : null}
          </>)}
          {bodyPart.visible ? (
            <div className={notesPreviewCardClass} style={{ borderColor: bodyPart.layout === 'inline' || bodyPart.layout === 'progress' ? undefined : bodyPart.color || statCardsPart.color }}>
              <p className="text-xs font-black uppercase tracking-widest text-slate-400">Simple Words</p>
              <p className={`mt-3 text-2xl font-black ${exactAlignClass(titlePart)}`} style={{ color: titlePart.color }}>Begin with meaning first</p>
              <p className={`mt-3 text-sm font-semibold leading-6 ${exactAlignClass(descriptionPart)}`} style={{ color: descriptionPart.color }}>A short overview designed to orient the learner before detail-heavy blocks.</p>
              {progressBarPart.visible ? (
                <div className={`${progressBarPart.spacing === 'tight' ? 'mt-3' : progressBarPart.spacing === 'loose' ? 'mt-7' : 'mt-5'} h-2 rounded-full bg-slate-100 ${progressBarPart.shadow === 'none' ? 'shadow-none' : progressBarPart.shadow === 'strong' ? 'shadow-lg' : 'shadow-sm'}`}>
                  <div className={`h-full w-2/5 ${partRadiusClass(progressBarPart.radius)}`} style={{ backgroundColor: progressBarPart.color }} />
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      );
    }

    if (['definition_block', 'definitionblock'].includes(normalizedSubsection)) {
      return (
        <div className={partSpaceClass(bodyPart)}>
          {renderNotesHeader(<div className={notesBadgeRowClass}>
            <span className="rounded-full px-3 py-1 text-xs font-black" style={{ backgroundColor: iconBadgePart.color, color: contrastText(iconBadgePart.color) }}>
              {asString(contentRecord.badge, 'Core Concept')}
            </span>
            <span className="rounded-full border px-3 py-1 text-xs font-bold" style={{ borderColor: `${difficultyBadgePart.color}66`, color: difficultyBadgePart.color }}>Definition</span>
          </div>)}
          <div className={notesCardClass} style={{ borderColor: bodyPart.color || statCardsPart.color }}>
            <p className="text-xs font-black uppercase tracking-widest text-slate-400">Canonical Definition</p>
            <h2 className={`mt-3 text-3xl font-black leading-tight ${partAlignClass(headerPart)}`} style={{ color: titlePart.color }}>
              {asString(contentRecord.headline, summary.title)}
            </h2>
            <p className="mt-5 border-l-4 pl-5 text-lg font-bold leading-8 text-slate-700" style={{ borderColor: progressBarPart.color }}>
              {asString(contentRecord.definition, summary.description)}
            </p>
          </div>
          <div className={`grid gap-4 ${layout.includes('inline') ? 'md:grid-cols-1' : 'md:grid-cols-2'}`}>
            <div className={partPanelClass(bodyPart)} style={{ borderColor: bodyPart.color || borderColor }}>
              <p className="text-xs font-black uppercase tracking-wider" style={{ color: primaryColor }}>Simple Explanation</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{asString(contentRecord.simpleExplanation, 'Short learner-friendly explanation.')}</p>
            </div>
            <div className={partPanelClass(bodyPart)} style={{ borderColor: bodyPart.color || borderColor }}>
              <p className="text-xs font-black uppercase tracking-wider" style={{ color: primaryColor }}>Why It Matters</p>
              <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{asString(contentRecord.whyItMatters, 'Why the definition matters for the learner.')}</p>
            </div>
          </div>
        </div>
      );
    }

    if (['syntax_block', 'syntaxblock'].includes(normalizedSubsection)) {
      const breakdown = asArray<Record<string, unknown>>(contentRecord.breakdown);
      return (
        <div className={partSpaceClass(bodyPart)}>
          {renderNotesHeader(<h2 className={`${titleSize} font-black`} style={{ color: titlePart.color }}>{asString(contentRecord.title, summary.title)}</h2>)}
          <pre className={`overflow-x-auto ${partRadiusClass(bodyPart.radius)} border bg-slate-950 ${bodyPart.spacing === 'tight' ? 'p-4' : bodyPart.spacing === 'loose' ? 'p-8' : 'p-6'} text-sm font-bold leading-7 text-emerald-300 ${bodyPart.shadow === 'none' ? 'shadow-none' : 'shadow-lg'}`} style={{ borderColor: bodyPart.color || borderColor }}>
            <code>{asString(contentRecord.codeSnippet, 'example = \"value\"')}</code>
          </pre>
          <div className={`grid gap-3 ${layout.includes('inline') ? 'md:grid-cols-1' : 'md:grid-cols-3'}`}>
            {breakdown.map((item, index) => (
              <div key={index} className={partPanelClass(bodyPart)} style={{ borderColor: bodyPart.color || borderColor }}>
                <p className="font-mono text-sm font-black" style={{ color: iconBadgePart.color }}>{asString(item.part, `part_${index + 1}`)}</p>
                <p className="mt-2 text-xs font-semibold leading-5 text-slate-600">{asString(item.explanation, 'Syntax explanation.')}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (['component_grid', 'componentgrid'].includes(normalizedSubsection)) {
      const mechanics = asArray<Record<string, unknown>>(contentRecord.mechanics);
      return (
        <div className={partSpaceClass(bodyPart)}>
          {renderNotesHeader(<>
            <h2 className={`${titleSize} font-black`} style={{ color: titlePart.color }}>{asString(contentRecord.panelTitle, summary.title)}</h2>
            <p className={`max-w-3xl text-base font-semibold leading-7 ${headerPart.align === 'center' ? 'mx-auto' : headerPart.align === 'right' ? 'ml-auto' : ''}`} style={{ color: descriptionPart.color }}>{asString(contentRecord.description, summary.description)}</p>
          </>)}
          <div className={`grid gap-4 ${layout.includes('inline') ? 'md:grid-cols-1' : 'md:grid-cols-3'}`}>
            {mechanics.map((item, index) => (
              <div key={asString(item.id, String(index))} className={partPanelClass(bodyPart)} style={{ borderColor: bodyPart.color || borderColor }}>
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl text-sm font-black" style={{ backgroundColor: iconBadgePart.color, color: contrastText(iconBadgePart.color) }}>{index + 1}</span>
                <h3 className="mt-4 text-lg font-black" style={{ color: textColor }}>{asString(item.label, `Step ${index + 1}`)}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{asString(item.detail, 'Mechanic detail.')}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (['example_panel', 'examplepanel'].includes(normalizedSubsection)) {
      const components = asArray<Record<string, unknown>>(contentRecord.components);
      return (
        <div className={partSpaceClass(bodyPart)}>
          {renderNotesHeader(<>
            <h2 className={`${titleSize} font-black`} style={{ color: titlePart.color }}>{asString(contentRecord.title, summary.title)}</h2>
            <p className={`max-w-3xl text-base font-semibold leading-7 ${headerPart.align === 'center' ? 'mx-auto' : headerPart.align === 'right' ? 'ml-auto' : ''}`} style={{ color: descriptionPart.color }}>{asString(contentRecord.description, summary.description)}</p>
          </>)}
          <div className={`grid gap-4 ${layout.includes('inline') ? 'md:grid-cols-1' : 'md:grid-cols-2'}`}>
            {components.map((item, index) => (
              <div key={asString(item.id, String(index))} className={partPanelClass(bodyPart)} style={{ borderColor: bodyPart.color || borderColor }}>
                <h3 className="text-lg font-black" style={{ color: primaryColor }}>{asString(item.title, `Example ${index + 1}`)}</h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{asString(item.description, 'Example detail.')}</p>
                <ul className="mt-4 space-y-2">
                  {asArray<unknown>(item.points).map((point, pointIndex) => (
                    <li key={pointIndex} className="flex items-start gap-2 text-xs font-bold text-slate-700">
                      <CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: iconBadgePart.color }} />
                      {String(point)}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (['practice_card', 'practicecard'].includes(normalizedSubsection)) {
      const practices = asArray<Record<string, unknown>>(contentRecord.practices);
      return (
        <div className={partSpaceClass(bodyPart)}>
          {renderNotesHeader(<h2 className={`${titleSize} font-black`} style={{ color: titlePart.color }}>{asString(contentRecord.title, 'Practice Checklist')}</h2>)}
          <div className={notesCardClass} style={{ borderColor: bodyPart.color || borderColor }}>
            <div className="space-y-4">
              {practices.map((item, index) => (
                <div key={asString(item.id, String(index))} className={`flex items-start gap-4 ${partPanelClass(bodyPart, 'p-4')}`} style={{ borderColor: bodyPart.color || borderColor }}>
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-black" style={{ backgroundColor: iconBadgePart.color, color: contrastText(iconBadgePart.color) }}>
                    <CheckCircle2 size={16} />
                  </span>
                  <div>
                    <h3 className="text-sm font-black" style={{ color: textColor }}>{asString(item.label, `Practice ${index + 1}`)}</h3>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{asString(item.tip, 'Practice tip.')}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (['warning_faq', 'warningfaq'].includes(normalizedSubsection)) {
      const mistakes = asArray<Record<string, unknown>>(contentRecord.mistakes);
      return (
        <div className={partSpaceClass(bodyPart)}>
          {renderNotesHeader(<h2 className={`${titleSize} font-black`} style={{ color: titlePart.color }}>{asString(contentRecord.title, 'Common Mistakes')}</h2>)}
          {mistakes.map((item, index) => (
            <details key={asString(item.id, String(index))} open={index === 0} className={partPanelClass(bodyPart)} style={{ borderColor: bodyPart.color || borderColor }}>
              <summary className="cursor-pointer text-base font-black" style={{ color: iconBadgePart.color }}>
                {asString(item.mistake, `Mistake ${index + 1}`)}
              </summary>
              <div className="mt-4 rounded-2xl border p-4 text-sm font-semibold leading-6 text-slate-700" style={{ borderColor: `${progressBarPart.color}66`, backgroundColor: `${progressBarPart.color}10` }}>
                <span className="font-black" style={{ color: progressBarPart.color }}>Fix: </span>
                {asString(item.fix, 'Correction guidance.')}
              </div>
            </details>
          ))}
        </div>
      );
    }

    if (['summary_card', 'summarycard'].includes(normalizedSubsection)) {
      const takeaways = asArray<unknown>(contentRecord.keyTakeaways);
      return (
        <div className={notesPairClass}>
          <div className={notesCardClass} style={{ borderColor: bodyPart.color || borderColor, background: `linear-gradient(135deg, #ffffff 0%, ${primaryColor}12 100%)` }}>
            {headerPart.visible ? <div className="mb-4" style={notesInlineHeaderStyle} /> : null}
            <p className="text-xs font-black uppercase tracking-widest" style={{ color: primaryColor }}>Revision Summary</p>
            {titlePart.visible ? <h2 className={`mt-3 text-3xl font-black leading-tight ${partAlignClass(headerPart)}`} style={{ color: titlePart.color }}>{asString(contentRecord.summaryTitle, summary.title)}</h2> : null}
            {descriptionPart.visible ? <p className="mt-4 text-sm font-semibold leading-6" style={{ color: descriptionPart.color }}>{asString(contentRecord.conceptDiagramDescription, summary.description)}</p> : null}
          </div>
          <div className="space-y-3">
            {takeaways.map((item, index) => (
              <div key={index} className={`flex items-start gap-3 ${partPanelClass(bodyPart, 'p-4')}`} style={{ borderColor: bodyPart.color || borderColor }}>
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black" style={{ backgroundColor: iconBadgePart.color, color: contrastText(iconBadgePart.color) }}>{index + 1}</span>
                <p className="text-sm font-bold leading-6 text-slate-700">{String(item)}</p>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (['footer_block', 'footerblock'].includes(normalizedSubsection)) {
      return (
        <div className={notesCardClass} style={{ borderColor: bodyPart.color || borderColor, backgroundColor }}>
          <div className={`grid ${gap} ${layout.includes('inline') ? '' : 'lg:grid-cols-[1fr_auto]'} lg:items-center`}>
            {renderNotesHeader(<>
              <p className="text-xs font-black uppercase tracking-widest" style={{ color: primaryColor }}>Closing Checkpoint</p>
              {titlePart.visible ? <h2 className="mt-3 text-3xl font-black leading-tight" style={{ color: titlePart.color }}>
                {asString(contentRecord.title, 'Ready to continue?')}
              </h2> : null}
              {descriptionPart.visible ? <p className={`mt-4 max-w-3xl text-base font-semibold leading-7 ${headerPart.align === 'center' ? 'mx-auto' : headerPart.align === 'right' ? 'ml-auto' : ''}`} style={{ color: descriptionPart.color }}>
                {asString(contentRecord.closingLine, summary.description)}
              </p> : null}
              <p className="mt-3 text-sm font-bold leading-6 text-slate-500">
                {asString(contentRecord.supportText, 'Use the next section after the current idea is clear.')}
              </p>
            </>)}
            {actionPart.visible ? <div className={notesActionRowClass}>
              <button className="inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-black text-white" style={{ backgroundColor: accentColor }}>
                {asString(contentRecord.primaryAction, 'Continue learning')}
                <ArrowRight size={16} />
              </button>
              <button className="inline-flex items-center gap-2 rounded-full border bg-white px-5 py-3 text-sm font-black" style={{ borderColor, color: primaryColor }}>
                <BookOpen size={16} />
                {asString(contentRecord.secondaryAction, 'Review summary')}
              </button>
            </div> : null}
          </div>
        </div>
      );
    }

    if (['summary_hero_svg', 'summaryherosvg'].includes(normalizedSubsection)) {
      const stages = asArray<unknown>(contentRecord.stages);
      const displayStages = stages.length ? stages : ['Definition', 'Mechanics', 'Syntax', 'Examples', 'Practice', 'Revision'];
      return (
        <div className={notesPairClass}>
          {renderNotesHeader(<>
            <span className="inline-flex rounded-full px-3 py-1 text-xs font-black text-white" style={{ backgroundColor: primaryColor }}>Summary Visual</span>
            {titlePart.visible ? <h2 className="mt-4 text-4xl font-black leading-tight" style={{ color: titlePart.color }}>
              {asString(contentRecord.title, `${summary.title} Blueprint`)}
            </h2> : null}
            {descriptionPart.visible ? <p className={`mt-4 max-w-2xl text-base font-semibold leading-7 ${headerPart.align === 'center' ? 'mx-auto' : headerPart.align === 'right' ? 'ml-auto' : ''}`} style={{ color: descriptionPart.color }}>
              {asString(contentRecord.description, summary.description)}
            </p> : null}
            <p className="mt-4 text-sm font-black uppercase tracking-widest text-slate-400">
              {asString(contentRecord.caption, 'Follow the learning flow from meaning to application.')}
            </p>
          </>)}
          <div className={notesCardClass} style={{ borderColor: bodyPart.color || borderColor }}>
            <div className="relative min-h-[240px]">
              <div className="absolute inset-x-8 top-1/2 hidden h-1 -translate-y-1/2 rounded-full md:block" style={{ backgroundColor: `${primaryColor}22` }} />
              <div className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {displayStages.map((stage, index) => (
                  <div key={String(stage)} className="rounded-2xl border bg-white p-4 shadow-sm" style={{ borderColor }}>
                    <span className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-black text-white" style={{ backgroundColor: index % 2 ? accentColor : primaryColor }}>
                      {index + 1}
                    </span>
                    <p className="mt-3 text-sm font-black" style={{ color: textColor }}>{String(stage)}</p>
                    <div className="mt-3 h-1.5 rounded-full bg-slate-100">
                      <div className="h-full rounded-full" style={{ width: `${Math.min(100, 30 + index * 12)}%`, backgroundColor: index % 2 ? accentColor : primaryColor }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return null;
  })() : null;

  const unmappedNotesContent = isNotesSection && !notesSpecificContent ? (
    <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6">
      <p className="text-xs font-black uppercase tracking-widest text-rose-600">No Notes Renderer Mapped</p>
      <h2 className="mt-2 text-2xl font-black text-rose-950">{titleCase(subsection || 'selected component')}</h2>
      <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-rose-800">
        This Notes component does not have a learner-facing preview implementation. Add a specific renderer branch before using it in Global Architecture, Visual Guide, Prompt Generator, or Content Manager.
      </p>
      <div className="mt-4 rounded-2xl border border-rose-200 bg-white p-4">
        <span className="block text-[10px] font-black uppercase tracking-widest text-rose-400">Requested subsection</span>
        <code className="mt-1 block break-all text-sm font-black text-rose-900">{normalizedSubsection || 'unknown'}</code>
      </div>
    </div>
  ) : null;

  const content = notesSpecificContent ?? unmappedNotesContent ?? (() => {
    if (collapsible || layout.includes('accordion')) {
      return (
        <div className="space-y-3">
          <details open className="rounded-2xl border bg-white p-5" style={{ borderColor }}>
            <summary className="cursor-pointer text-base font-black" style={{ color: primaryColor }}>{summary.title}</summary>
            <div className="mt-4 space-y-5">{appliedHeader}{appliedBody}{appliedAction}</div>
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
          {visibleBlocks.map((block, index) => (
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

    if (layout.includes('inline')) {
      return (
        <div className={`flex flex-wrap items-center justify-between ${gap}`}>
          <div className="min-w-[260px] flex-1">{appliedHeader}</div>
          <div className="min-w-[220px] flex-1">{appliedBody}</div>
          {appliedAction}
        </div>
      );
    }

    if (layout.includes('grid') || desktopLayout.includes('dashboard')) {
      return (
        <div className={`grid ${gap} lg:grid-cols-[1fr_0.85fr] lg:items-start`}>
          <div className="space-y-5">{appliedHeader}{appliedAction}</div>
          <div className="space-y-5">{appliedBody}{learningCard}</div>
        </div>
      );
    }

    if (layout.includes('hero') || layout.includes('wide') || desktopLayout.includes('wide') || desktopLayout.includes('two_column')) {
      return (
        <div className={`grid ${gap} lg:grid-cols-[1.1fr_0.9fr] lg:items-center`}>
          <div className="space-y-6">{appliedHeader}{appliedAction}</div>
          <div className="space-y-5">{learningCard}{appliedBody}</div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {appliedHeader}
        {appliedBody}
        {appliedAction}
      </div>
    );
  })();

  return (
    <section
      data-testid="contract-aware-component-preview"
      className={`${containerFrameClass} ${emphasisScale} ${motionClass} ${interactionClass}`}
      data-renderer={renderer}
      data-layout={layout}
      data-desktop-layout={desktopLayout}
      data-tablet-layout={tabletLayout}
      data-mobile-layout={mobileLayout}
      data-brand={brandVariant}
      data-domain={domainOverride}
      style={{
        backgroundColor: containerLayout === 'inline' ? 'transparent' : containerPart.color || backgroundColor,
        borderColor: containerLayout === 'inline' ? 'transparent' : borderColor,
        borderWidth: containerLayout === 'inline' ? 0 : emphasis === 'high' ? 3 : emphasis === 'low' ? 1 : 2,
        color: textColor,
        backgroundImage: containerLayout !== 'inline' && styleVariant === 'featured' ? `linear-gradient(135deg, ${backgroundColor} 0%, ${mutedSurface} 100%)` : undefined,
      }}
    >
      {content}

      {(tabletLayout !== 'stacked_cards' || mobileLayout !== 'stacked_cards') ? (
        <div className="mt-6 grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
          <div className="rounded-2xl border bg-white p-3" style={{ borderColor }}>
            <p className="text-xs font-black" style={{ color: primaryColor }}>Tablet preview</p>
            <div className={`mt-3 grid gap-2 ${tabletLayout.includes('grid') || tabletLayout.includes('two') ? 'grid-cols-2' : 'grid-cols-1'}`}>
              <span className="h-8 rounded-lg" style={{ backgroundColor: `${primaryColor}22` }} />
              <span className="h-8 rounded-lg" style={{ backgroundColor: `${accentColor}22` }} />
            </div>
          </div>
          <div className="rounded-2xl border bg-white p-3" style={{ borderColor }}>
            <p className="text-xs font-black" style={{ color: primaryColor }}>Mobile preview</p>
            <div className={`mt-3 grid gap-2 ${mobileLayout.includes('accordion') ? 'grid-cols-1' : 'grid-cols-1'}`}>
              <span className="h-7 rounded-lg" style={{ backgroundColor: `${primaryColor}22` }} />
              <span className="h-7 rounded-lg" style={{ backgroundColor: `${accentColor}22` }} />
            </div>
          </div>
        </div>
      ) : null}

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
