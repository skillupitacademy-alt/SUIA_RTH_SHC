import React from 'react';
import { BookOpen, FileText, Star, Sparkles } from 'lucide-react';
import type { IDefinitionBlock, BlockComponentProps, DomainTheme } from '../types';
import { withAlpha } from '../theme-utils';
import { BlockShell, BlockHeader, CardSurface, CalloutBanner, TerminalWindow } from '../primitives';

/**
 * Definition Block - Version Router
 * Routes to version-specific implementation based on block.version
 */
export function DefinitionBlock({ 
  block, 
  className = '',
  theme,
  runtimeContext
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
      return <DefinitionD1View block={block} theme={theme} className={className} runtimeContext={runtimeContext} />;
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
 * Composes UBA primitives: BlockShell, BlockHeader, TerminalWindow, CardSurface, CalloutBanner.
 * Only theme.primary and theme.secondary vary by brand.
 */
function DefinitionD1View({ 
  block, 
  theme,
  className = '',
  runtimeContext
}: { 
  block: IDefinitionBlock;
  theme?: DomainTheme;
  className?: string;
  runtimeContext?: BlockComponentProps<IDefinitionBlock>['runtimeContext'];
}) {
  const page = block.content?.page ?? ({} as IDefinitionBlock['content']['page']);
  
  const characteristics = Array.isArray(page.characteristics) ? page.characteristics : [];
  const explanation = Array.isArray(page.explanation) ? page.explanation : [];

  // Theme is required for canonical locked renderer
  if (!theme?.primary || !theme?.secondary) {
    throw new Error(
      `[DefinitionD1View] Missing required brand theme for Definition D1 block ${block.id}`
    );
  }

  const primary = theme.primary;
  const secondary = theme.secondary;

  // UBRC: Use runtimeContext if available, fallback to block fields
  const blockId = runtimeContext?.blockId ?? block.id;
  const blockType = runtimeContext?.blockType ?? 'definition';
  const blockVersion = runtimeContext?.blockVersion ?? block.version;

  return (
    <BlockShell
      className={className}
      theme={theme}
      runtimeContext={runtimeContext}
      blockId={blockId}
      blockType={blockType}
      blockVersion={blockVersion}
    >
      <BlockHeader
        eyebrow={page.category ?? 'Definition'}
        icon={BookOpen}
        badgeStyle="box"
        title={page.title ?? 'Untitled Definition'}
        headingLevel="h1"
        titleScale="hero"
        introduction={page.intro}
        theme={theme}
        className="mb-[26px]"
      />

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
        <div className="my-[26px]">
          <TerminalWindow
            title={page.example.language ? `Example (${page.example.language})` : 'Example'}
            copySource={page.example.code}
            theme={theme}
          >
            <div className="p-4 sm:p-5 overflow-x-auto">
              <pre className="whitespace-pre-wrap font-mono text-base font-medium leading-[1.85] text-slate-200">
                <code>{page.example.code}</code>
              </pre>
            </div>
          </TerminalWindow>
        </div>
      )}

      {characteristics.length > 0 && (
        <section className="my-8">
          <div className="mb-4 flex items-center gap-3">
            <Star className="h-6 w-6 fill-current" style={{ color: primary }} />
            <h2 className="text-2xl font-extrabold leading-snug tracking-[-0.3px]" style={{ color: secondary }}>Key Characteristics</h2>
          </div>
          <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {characteristics.map((item, index) => (
              <CardSurface 
                key={item.title || index} 
                hoverable
                className="flex flex-col p-5 text-center" 
                theme={theme}
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
                <p className="text-sm font-medium leading-[1.65] text-slate-600 dark:text-slate-400 break-words flex-1">
                  {item.description}
                </p>
              </CardSurface>
            ))}
          </div>
        </section>
      )}

      {page.takeaway && (
        <CalloutBanner
          variant="takeaway"
          theme={theme}
          title="Key Takeaway"
          className="mt-8"
        >
          <p className="text-base font-medium leading-[1.7]" style={{ color: secondary }}>
            {page.takeaway}
          </p>
        </CalloutBanner>
      )}
    </BlockShell>
  );
}
