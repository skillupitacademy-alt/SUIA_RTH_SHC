'use client';

/**
 * Code C1 Block - Canonical Code Block Renderer
 * 
 * Composes UBA Generic Primitives:
 * BlockShell, BlockHeader, StepBadge, SyntaxPill, TerminalWindow, CalloutBanner
 */

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Code2, Copy, Lightbulb, MessageCircle, Monitor, Star, Terminal, Check, Boxes } from 'lucide-react';
import type { BlockComponentProps } from '../types';
import type { CodeC1Block as CodeC1BlockType } from '@quiz/types';
import { getThemeColor, withAlpha, DEFAULT_THEME } from '../theme-utils';
import { SafeHtml } from '../../SafeHtml';
import { BlockShell, BlockHeader, StepBadge, SyntaxPill, TerminalWindow, CalloutBanner, CardSurface } from '../primitives';

export function CodeC1Block({ block, theme: providedTheme, runtimeContext }: BlockComponentProps<CodeC1BlockType>) {
  const page = block.content.page;

  // Use provided theme or default theme with Tailwind colors
  const theme = providedTheme ?? DEFAULT_THEME;

  // UBRC: Use runtimeContext if available, fallback to block fields
  const blockId = runtimeContext?.blockId ?? block.id;
  const blockType = runtimeContext?.blockType ?? 'code';
  const blockVersion = runtimeContext?.blockVersion ?? 'C1';

  function variantStyles(variant: string | undefined) {
    if (variant === 'value') {
      return { color: getThemeColor(theme, 'emerald', 700), backgroundColor: getThemeColor(theme, 'emerald', 50), borderColor: getThemeColor(theme, 'emerald', 200) };
    }
    if (variant === 'result') {
      return { color: getThemeColor(theme, 'amber', 700), backgroundColor: getThemeColor(theme, 'amber', 50), borderColor: getThemeColor(theme, 'amber', 200) };
    }
    return { color: getThemeColor(theme, 'blue', 700), backgroundColor: getThemeColor(theme, 'blue', 50), borderColor: getThemeColor(theme, 'blue', 200) };
  }

  // Extract data from canonical C1 structure
  const memory = page.memoryModel;
  const columns = Array.isArray(memory?.columns) ? memory.columns : [];
  const nodes = Array.isArray(memory?.nodes) ? memory.nodes : [];
  const rows = [...new Set(nodes.map((node) => node.row))].sort((a, b) => a - b);
  const explanationSteps = Array.isArray(page.explanation) ? page.explanation : [];
  const takeawayItems = page.takeaway ? page.takeaway.split('\n\n').filter(Boolean) : [];

  return (
    <BlockShell
      className="w-full"
      theme={theme}
      runtimeContext={runtimeContext}
      blockId={blockId}
      blockType={blockType}
      blockVersion={blockVersion}
    >
      <BlockHeader
        eyebrow="CODE + EXPLANATION"
        icon={Code2}
        badgeStyle="pill"
        title={page.title}
        headingLevel="h1"
        titleScale="hero"
        introduction={page.introduction}
        theme={theme}
        className="mb-[30px]"
      />

      {/* Code Section */}
      <section className="mb-[30px] w-full">
        <div className="mb-[14px] flex items-center gap-2.5">
          <Terminal className="h-[25px] w-[25px]" style={{ color: theme.primary }} />
          <h2 className="text-[21px] font-extrabold leading-snug" style={{ color: theme.secondary }}>Code Example</h2>
        </div>
        <TerminalWindow title={page.filename || page.language || 'Code'} copySource={page.code} theme={theme}>
          <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <pre className="m-0 px-[22px] pb-7 pt-6" style={{ backgroundColor: getThemeColor(theme, 'slate', 900) }}>
              <code className="block whitespace-pre font-mono text-base font-medium leading-[1.8]" style={{ color: getThemeColor(theme, 'slate', 50) }}>{page.code}</code>
            </pre>
          </div>
        </TerminalWindow>
      </section>

      {/* Explanation Section */}
      {explanationSteps.length > 0 && (
        <section className="mb-[30px] w-full">
          <div className="mb-[14px] flex items-center gap-2.5">
            <MessageCircle className="h-[25px] w-[25px]" style={{ color: theme.primary }} />
            <h2 className="text-[21px] font-extrabold leading-snug" style={{ color: theme.secondary }}>Explanation</h2>
          </div>
          <CardSurface
            theme={theme}
            elevation="dashboard"
            hoverable={false}
            className="w-full overflow-hidden p-0"
            style={{ borderColor: withAlpha(theme.primary, '66') }}
          >
            {explanationSteps.map((step, index) => (
              <div key={`${index}-${step.focus}`} data-testid="code-c1-explanation-row" className="grid min-h-20 w-full grid-cols-[48px_minmax(0,1fr)] items-center border-b last:border-b-0 sm:grid-cols-[48px_minmax(150px,250px)_minmax(0,1fr)] dark:border-slate-700" style={{ borderColor: withAlpha(theme.primary, '33') }}>
                <StepBadge step={index + 1} size="md" theme={theme} className="ml-3" />
                <div className="min-w-0 py-3 sm:py-0"><SyntaxPill text={step.focus} theme={theme} className="justify-self-start" /></div>
                <SafeHtml as="div" html={step.description} className="col-span-2 px-5 pb-[17px] pl-[22px] text-base font-medium leading-[1.65] sm:col-span-1 sm:px-5 sm:py-[17px] sm:pl-2.5 [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:font-bold" style={{ color: theme.secondary }} />
              </div>
            ))}
          </CardSurface>
        </section>
      )}

      {/* Output Section */}
      {page.output?.value && (
        <section className="mb-8 w-full">
          <div className="mb-[14px] flex items-center gap-2.5">
            <Monitor className="h-[25px] w-[25px]" style={{ color: theme.primary }} />
            <h2 className="text-[21px] font-extrabold leading-snug" style={{ color: theme.secondary }}>Output</h2>
          </div>
          {page.output.description && (
            <p className="mb-3 text-base font-medium leading-[1.65]" style={{ color: theme.secondary }}>{page.output.description}</p>
          )}
          <TerminalWindow title="Terminal" theme={theme}>
            <pre className="m-0 whitespace-pre-wrap p-[22px] font-mono text-base leading-[1.7]" style={{ backgroundColor: getThemeColor(theme, 'slate', 900), color: getThemeColor(theme, 'slate', 200) }}>{page.output.value}</pre>
          </TerminalWindow>
        </section>
      )}

      {/* Memory / Model Section */}
      {memory && (
        <section className="mb-8 w-full">
          <div className="mb-[14px] flex items-center gap-2.5">
            <Boxes className="h-[25px] w-[25px]" style={{ color: theme.primary }} />
            <h2 className="text-[21px] font-extrabold leading-snug" style={{ color: theme.secondary }}>Memory / Model</h2>
          </div>
          {memory.description && <p className="mb-4 text-base font-medium leading-[1.65]" style={{ color: theme.secondary }}>{memory.description}</p>}
          {columns.length > 0 && nodes.length > 0 && (
            <CardSurface
              theme={theme}
              elevation="dashboard"
              hoverable={false}
              className="w-full overflow-x-auto p-[22px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ borderColor: withAlpha(theme.primary, '66') }}
            >
              <div className="grid min-w-[760px] items-center justify-center gap-x-[26px] gap-y-[18px]" style={{ gridTemplateColumns: columns.map((column) => column.width ?? 'minmax(160px,1fr)').join(' ') }}>
                {columns.map((column) => (
                  <div key={column.id} className="min-h-[25px] text-base font-extrabold leading-snug" style={{ color: theme.primaryDark }}>{column.title}</div>
                ))}
                {rows.flatMap((row) => columns.map((column) => {
                  const node = nodes.find((item) => item.row === row && item.column === column.id);
                  return (
                    <div
                      key={`${row}-${column.id}`}
                      className="flex min-h-12 items-center justify-center rounded-lg border px-3.5 py-[9px] text-center text-[15px] font-bold leading-snug"
                      style={node ? { ...variantStyles(node.variant), fontFamily: node.monospace ? 'SFMono-Regular, Cascadia Code, Consolas, monospace' : undefined } : { borderColor: 'transparent' }}
                    >
                      {node?.label ?? ''}
                    </div>
                  );
                }))}
              </div>
            </CardSurface>
          )}
          {memory.note && <div className="mt-3 rounded-[7px] border px-[13px] py-2.5 text-[13px] font-semibold leading-[1.55]" style={{ color: theme.secondary, borderColor: getThemeColor(theme, 'blue', 200), backgroundColor: getThemeColor(theme, 'blue', 50) }}>{memory.note}</div>}
        </section>
      )}

      {/* Key Takeaway Section */}
      {takeawayItems.length > 0 && (
        <CalloutBanner
          variant="warning"
          theme={theme}
          title="Key Takeaway"
          className="mb-6 w-full"
        >
          <ul className="flex list-disc flex-col gap-2 pl-5 text-[15px] font-medium leading-[1.55] [&_code]:rounded [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:font-bold" style={{ color: theme.secondary }}>
            {takeawayItems.map((item, index) => (
              <SafeHtml as="li" key={index} html={item} />
            ))}
          </ul>
        </CalloutBanner>
      )}

      {/* Practice / Tip Section */}
      {page.practiceHint && (
        <CalloutBanner
          variant="info"
          icon={Lightbulb}
          theme={theme}
          title="Tip"
          className="w-full"
        >
          <p className="text-[15px] font-medium leading-[1.65]" style={{ color: theme.secondary }}>{page.practiceHint}</p>
        </CalloutBanner>
      )}
    </BlockShell>
  );
}
