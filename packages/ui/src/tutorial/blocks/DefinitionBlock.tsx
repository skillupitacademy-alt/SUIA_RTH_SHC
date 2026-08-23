import React from 'react';
import { BookOpen, FileText, Code2, Star, Sparkles } from 'lucide-react';
import type { IDefinitionBlock, BlockComponentProps, DomainTheme } from '../types';

/**
 * Definition Block - Version Router
 * Routes to version-specific implementation based on block.version
 */
export function DefinitionBlock({ 
  block, 
  className = '',
  theme
}: BlockComponentProps<IDefinitionBlock>) {
  // Explicit version check
  if (!block.version) {
    throw new Error(
      `[DefinitionBlock] Missing version field for block ${block.id}`
    );
  }

  // Version routing
  switch (block.version) {
    case 'D1':
      return <DefinitionD1View block={block} theme={theme} className={className} />;
    default:
      throw new Error(
        `[DefinitionBlock] Unsupported Definition version: ${block.version}`
      );
  }
}

/**
 * Definition D1 View - CANONICAL LOCKED UI
 * 
 * This is the single authoritative Definition D1 renderer for ALL brands.
 * Layout, typography, spacing, icons, cards, borders, and responsive behavior are FIXED.
 * Only theme.primary and theme.secondary vary by brand.
 * 
 * Used by:
 * - Composer Preview
 * - SUIA Student Page
 * - RTH Student Page
 * - All other brand learner pages
 */
function DefinitionD1View({ 
  block, 
  theme,
  className = '' 
}: { 
  block: IDefinitionBlock;
  theme?: DomainTheme;
  className?: string;
}) {
  const page = block.content.page;
  const characteristics = Array.isArray(page.characteristics) ? page.characteristics : [];
  const explanation = Array.isArray(page.explanation) ? page.explanation : [];

  // Default colors if theme not provided (fallback only)
  const primary = theme?.primary || '#6366f1';
  const secondary = theme?.secondary || '#0f172a';

  // Helper to create color with alpha
  function withAlpha(hex: string, alphaHex: string) {
    return `${hex}${alphaHex}`;
  }

  return (
    <article className={`w-full bg-white px-[5%] py-10 ${className}`} style={{ color: secondary }}>
      <header className="mb-[26px]">
        <div className="mb-[14px] flex items-center gap-2.5 text-base font-extrabold leading-snug" style={{ color: primary }}>
          <span className="inline-flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-md border-2" style={{ borderColor: primary }}>
            <BookOpen className="h-4 w-4" />
          </span>
          <span>{page.category ?? 'Definition'}</span>
        </div>
        <h1 className="text-[clamp(38px,6.9vw,55px)] font-extrabold leading-[1.08] tracking-[-1.4px]" style={{ color: secondary }}>
          {page.title ?? 'Untitled Definition'}
        </h1>
        <div className="mb-[17px] mt-4 h-1 w-12 rounded-full" style={{ backgroundColor: primary }} />
        {page.intro && <p className="text-lg font-medium leading-[1.7]" style={{ color: secondary }}>{page.intro}</p>}
      </header>

      <section className="my-6 grid min-h-[175px] w-full grid-cols-[86px_1px_minmax(0,1fr)] items-center gap-6 rounded-[11px] border px-9 py-[30px]" style={{ backgroundColor: withAlpha(primary, '0d'), borderColor: withAlpha(primary, '66') }}>
        <div className="m-auto flex h-[70px] w-[70px] items-center justify-center rounded-full text-white shadow-sm" style={{ backgroundColor: primary }}>
          <FileText className="h-8 w-8" />
        </div>
        <div className="h-[92px] w-px" style={{ backgroundColor: withAlpha(primary, '73') }} />
        <div className="min-w-0">
          <h2 className="mb-2.5 text-xl font-extrabold leading-snug" style={{ color: primary }}>Definition</h2>
          <p className="text-[19px] font-semibold leading-[1.65]" style={{ color: secondary }}>{page.definition}</p>
        </div>
      </section>

      {explanation.length > 0 && (
        <section className="my-7">
          <div className="mb-[14px] flex items-center gap-3">
            <FileText className="h-6 w-6" style={{ color: primary }} />
            <h2 className="text-2xl font-extrabold leading-snug tracking-[-0.3px]" style={{ color: secondary }}>Explanation</h2>
          </div>
          <div className="text-lg font-medium leading-[1.75]" style={{ color: secondary }}>
            {explanation.map((item, index) => (
              <p key={index} className={index > 0 ? 'mt-4' : undefined}>{item}</p>
            ))}
          </div>
        </section>
      )}

      {page.example && (
        <section className="my-[26px] rounded-[10px] border px-[26px] pb-[23px] pt-5" style={{ backgroundColor: '#f6f8ff', borderColor: '#d2dcf0' }}>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-extrabold leading-snug" style={{ color: secondary }}>Example</h2>
            <Code2 className="h-[17px] w-[17px]" style={{ color: primary }} />
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-base font-medium leading-[1.85]" style={{ color: secondary }}>
            <code>{page.example.code}</code>
          </pre>
        </section>
      )}

      {characteristics.length > 0 && (
        <section className="my-8">
          <div className="mb-4 flex items-center gap-3">
            <Star className="h-6 w-6 fill-current" style={{ color: primary }} />
            <h2 className="text-2xl font-extrabold leading-snug tracking-[-0.3px]" style={{ color: secondary }}>Key Characteristics</h2>
          </div>
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {characteristics.map((item, index) => (
              <div 
                key={item.title || index} 
                className="flex flex-col rounded-xl border bg-white p-5 text-center transition hover:-translate-y-0.5 hover:shadow-md" 
                style={{ borderColor: '#e0dce6' }}
              >
                <div 
                  className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border text-xl font-bold shrink-0" 
                  style={{ backgroundColor: withAlpha(primary, '14'), borderColor: withAlpha(primary, '73'), color: primary }}
                >
                  {item.icon || <Sparkles className="h-5 w-5" />}
                </div>
                <h3 className="mb-2 text-base font-extrabold leading-snug tracking-[-0.1px] break-words" style={{ color: secondary }}>
                  {item.title}
                </h3>
                <p className="text-sm font-medium leading-[1.65] text-slate-600 break-words flex-1">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {page.takeaway && (
        <section className="relative mt-8 overflow-hidden rounded-[10px] border py-[23px] pl-6 pr-[100px]" style={{ backgroundColor: '#fffaf0', borderColor: '#ead8a8' }}>
          <div className="mb-3 flex items-center gap-[11px]">
            <span className="inline-flex h-[29px] w-[29px] shrink-0 items-center justify-center rounded-full bg-[#f59e0b] text-white">
              <Star className="h-[15px] w-[15px] fill-current" />
            </span>
            <h2 className="text-[19px] font-extrabold leading-snug text-[#d97706]">Key Takeaway</h2>
          </div>
          <p className="text-base font-medium leading-[1.7]" style={{ color: secondary }}>{page.takeaway}</p>
          <Sparkles className="absolute bottom-[15px] right-[22px] h-12 w-12 text-[#f59e0b]" />
        </section>
      )}
    </article>
  );
}
