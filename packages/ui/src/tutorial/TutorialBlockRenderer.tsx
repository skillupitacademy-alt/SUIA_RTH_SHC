import React from 'react';
import type { TutorialBlock, BlockComponentProps } from './types';
import { MAX_NESTING_DEPTH } from '@quiz/types';

import { HeadingBlock } from './blocks/HeadingBlock';
import { ParagraphBlock } from './blocks/ParagraphBlock';
import { ListBlock } from './blocks/ListBlock';
import { CodeC1Block } from './blocks/CodeC1Block';
import { TableBlock } from './blocks/TableBlock';
import { ImageBlock } from './blocks/ImageBlock';
import { CalloutBlock } from './blocks/CalloutBlock';
import { DefinitionBlock } from './blocks/DefinitionBlock';
import { IntroductionBlock } from './blocks/IntroductionBlock';
import { ExampleBlock } from './blocks/ExampleBlock';
import { QuoteBlock } from './blocks/QuoteBlock';
import { SummaryBlock } from './blocks/SummaryBlock';
import { DiagramBlock } from './blocks/DiagramBlock';
import { ComparisonBlock } from './blocks/ComparisonBlock';
import { TwoColumnBlock } from './blocks/TwoColumnBlock';
import { ThreeColumnBlock } from './blocks/ThreeColumnBlock';
import { CardGridBlock } from './blocks/CardGridBlock';
import { TimelineBlock } from './blocks/TimelineBlock';
import { ObjectiveO1Block } from './blocks/ObjectiveO1Block';
import { ObjectiveO2Block } from './blocks/ObjectiveO2Block';
import { GENERATED_BLOCK_RENDERERS } from './generatedBlockRenderers';

/**
 * Deliberate polymorphic boundary for dynamic block rendering:
 * Each versioned block component expects its specific typed payload (e.g. CodeC1Block,
 * DefinitionD1Block). Because React component prop types are contravariant, a heterogeneous
 * versioned dispatch dictionary requires this polymorphic prop generic at the router boundary.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type VersionedRenderer = React.ComponentType<BlockComponentProps<any>>;
interface VersionedRendererEntry {
  component: VersionedRenderer;
  requiresTheme?: boolean;
}

const STATIC_VERSIONED_RENDERERS: Record<string, Record<string, VersionedRendererEntry>> = {
  code: { C1: { component: CodeC1Block } },
  definition: { D1: { component: DefinitionBlock } },
  introduction: { I1: { component: IntroductionBlock, requiresTheme: true } },
  summary: { S1: { component: SummaryBlock } },
  objective: { O1: { component: ObjectiveO1Block }, O2: { component: ObjectiveO2Block } },
};

const DEFAULT_VERSION_BY_FAMILY: Record<string, string> = {
  definition: 'D1',
  summary: 'S1',
};

function getVersionedRenderer(block: TutorialBlock): VersionedRendererEntry | undefined {
  const family = block.type;
  const version = ('version' in block && block.version) || DEFAULT_VERSION_BY_FAMILY[family];
  if (!version) return undefined;

  return STATIC_VERSIONED_RENDERERS[family]?.[version]
    ?? GENERATED_BLOCK_RENDERERS.find((entry) => entry.family === family && entry.version === version);
}

/** True when a family/version has a registered runtime component. */
export function hasRegisteredBlockRenderer(family: string, version: string): boolean {
  return Boolean(
    STATIC_VERSIONED_RENDERERS[family]?.[version]
    ?? GENERATED_BLOCK_RENDERERS.find((entry) => entry.family === family && entry.version === version)
  );
}

function isVersionedFamily(family: string): boolean {
  return family in STATIC_VERSIONED_RENDERERS
    || GENERATED_BLOCK_RENDERERS.some((entry) => entry.family === family);
}

function UnknownBlockState({ type }: { type: string }) {
  return (
    <div
      role="alert"
      className="my-3 p-3 rounded border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/40 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2"
    >
      <span>⚠️</span>
      <span>Unsupported or unrecognized block type: <code>{type}</code></span>
    </div>
  );
}

function NestingLimitState({ depth }: { depth: number }) {
  return (
    <div
      role="note"
      className="my-2 p-2 rounded border border-slate-200 dark:border-slate-800 text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-900/30"
    >
      [Nesting depth limit reached ({depth} &gt; {MAX_NESTING_DEPTH})]
    </div>
  );
}

export function TutorialBlockRenderer({ block, depth = 0, theme, className = '', runtimeContext }: BlockComponentProps) {
  if (!block || !block.type) {
    return null;
  }

  // Enforce maximum recursion depth
  if (depth > MAX_NESTING_DEPTH) {
    return <NestingLimitState depth={depth} />;
  }

  // Phase 2.5: Create renderChild with runtime context propagation
  const renderChild = (childBlock: TutorialBlock, childDepth: number) => (
    <TutorialBlockRenderer 
      block={childBlock} 
      depth={childDepth} 
      theme={theme}
      runtimeContext={runtimeContext}
    />
  );

  try {
    const rendererEntry = getVersionedRenderer(block);
    if (rendererEntry) {
      if (rendererEntry.requiresTheme && (!theme?.primary || !theme?.secondary)) {
        throw new Error(`Missing required brand theme for ${block.type} ${('version' in block && block.version) || ''} block ${block.id}`);
      }
      const VersionedBlock = rendererEntry.component;
      return <VersionedBlock block={block as any} depth={depth} theme={theme} className={className} runtimeContext={runtimeContext} renderChild={renderChild} />;
    }

    if (isVersionedFamily(block.type)) {
      const version = ('version' in block && block.version) || 'no version';
      throw new Error(`Unsupported ${block.type} version: ${String(version)}`);
    }

    switch (block.type) {
      case 'heading':
        return <HeadingBlock block={block} depth={depth} theme={theme} className={className} runtimeContext={runtimeContext} renderChild={renderChild} />;
      case 'paragraph':
        return <ParagraphBlock block={block} depth={depth} theme={theme} className={className} runtimeContext={runtimeContext} renderChild={renderChild} />;
      case 'list':
        return <ListBlock block={block} depth={depth} theme={theme} className={className} runtimeContext={runtimeContext} renderChild={renderChild} />;
      case 'table':
        return <TableBlock block={block} depth={depth} theme={theme} className={className} runtimeContext={runtimeContext} renderChild={renderChild} />;
      case 'image':
        return <ImageBlock block={block} depth={depth} theme={theme} className={className} runtimeContext={runtimeContext} renderChild={renderChild} />;
      case 'callout':
        return <CalloutBlock block={block} depth={depth} theme={theme} className={className} runtimeContext={runtimeContext} renderChild={renderChild} />;
      case 'example':
        return <ExampleBlock block={block} depth={depth} theme={theme} className={className} runtimeContext={runtimeContext} renderChild={renderChild} />;
      case 'quote':
        return <QuoteBlock block={block} depth={depth} theme={theme} className={className} runtimeContext={runtimeContext} renderChild={renderChild} />;
      case 'diagram':
        return <DiagramBlock block={block} depth={depth} theme={theme} className={className} runtimeContext={runtimeContext} renderChild={renderChild} />;
      case 'comparison':
        return <ComparisonBlock block={block} depth={depth} theme={theme} className={className} runtimeContext={runtimeContext} renderChild={renderChild} />;
      case 'two-column':
        return <TwoColumnBlock block={block} depth={depth} theme={theme} className={className} runtimeContext={runtimeContext} renderChild={renderChild} />;
      case 'three-column':
        return <ThreeColumnBlock block={block} depth={depth} theme={theme} className={className} runtimeContext={runtimeContext} renderChild={renderChild} />;
      case 'card-grid':
        return <CardGridBlock block={block} depth={depth} theme={theme} className={className} runtimeContext={runtimeContext} renderChild={renderChild} />;
      case 'timeline':
        return <TimelineBlock block={block} depth={depth} theme={theme} className={className} runtimeContext={runtimeContext} renderChild={renderChild} />;
      default: {
        return <UnknownBlockState type={block.type || 'unknown'} />;
      }
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error(`[TutorialBlockRenderer] Failed rendering block ${block.id} (${block.type}):`, err);
    return (
      <div role="alert" className="my-2 p-2 text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 rounded border border-rose-200 dark:border-rose-900">
        Error rendering block: {block.id} - {errorMessage}
      </div>
    );
  }
}
