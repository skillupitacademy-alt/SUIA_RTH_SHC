import React from 'react';
import type { TutorialBlock, BlockComponentProps } from './types';
import { MAX_NESTING_DEPTH } from '@quiz/types';

import { HeadingBlock } from './blocks/HeadingBlock';
import { ParagraphBlock } from './blocks/ParagraphBlock';
import { ListBlock } from './blocks/ListBlock';
import { CodeBlock } from './blocks/CodeBlock';
import { CodeC1Block } from './blocks/CodeC1Block';
import { TableBlock } from './blocks/TableBlock';
import { ImageBlock } from './blocks/ImageBlock';
import { CalloutBlock } from './blocks/CalloutBlock';
import { DefinitionBlock } from './blocks/DefinitionBlock';
import { ExampleBlock } from './blocks/ExampleBlock';
import { QuoteBlock } from './blocks/QuoteBlock';
import { SummaryBlock } from './blocks/SummaryBlock';
import { DiagramBlock } from './blocks/DiagramBlock';
import { ComparisonBlock } from './blocks/ComparisonBlock';
import { TwoColumnBlock } from './blocks/TwoColumnBlock';
import { ThreeColumnBlock } from './blocks/ThreeColumnBlock';
import { CardGridBlock } from './blocks/CardGridBlock';
import { TimelineBlock } from './blocks/TimelineBlock';

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

export function TutorialBlockRenderer({ block, depth = 0, theme, className = '' }: BlockComponentProps) {
  if (!block || !block.type) {
    return null;
  }

  // Enforce maximum recursion depth
  if (depth > MAX_NESTING_DEPTH) {
    return <NestingLimitState depth={depth} />;
  }

  try {
    switch (block.type) {
      case 'heading':
        return <HeadingBlock block={block} depth={depth} theme={theme} className={className} />;
      case 'paragraph':
        return <ParagraphBlock block={block} depth={depth} theme={theme} className={className} />;
      case 'list':
        return <ListBlock block={block} depth={depth} theme={theme} className={className} />;
      case 'code': {
        // Code C1 is the only supported version
        if (!('version' in block) || block.version !== 'C1') {
          throw new Error(
            `Unsupported code block version. Code C1 is required. Received: ${('version' in block) ? (block as any).version : 'no version'}`
          );
        }
        
        // CodeC1Block - use versioned renderer
        return <CodeC1Block block={block as any} depth={depth} theme={theme} className={className} />;
      }
      case 'table':
        return <TableBlock block={block} depth={depth} theme={theme} className={className} />;
      case 'image':
        return <ImageBlock block={block} depth={depth} theme={theme} className={className} />;
      case 'callout':
        return <CalloutBlock block={block} depth={depth} theme={theme} className={className} />;
      case 'definition':
        return <DefinitionBlock block={block} depth={depth} theme={theme} className={className} />;
      case 'example':
        return <ExampleBlock block={block} depth={depth} theme={theme} className={className} />;
      case 'quote':
        return <QuoteBlock block={block} depth={depth} theme={theme} className={className} />;
      case 'summary':
        return <SummaryBlock block={block} depth={depth} theme={theme} className={className} />;
      case 'diagram':
        return <DiagramBlock block={block} depth={depth} theme={theme} className={className} />;
      case 'comparison':
        return <ComparisonBlock block={block} depth={depth} theme={theme} className={className} />;
      case 'two-column':
        return <TwoColumnBlock block={block} depth={depth} theme={theme} className={className} />;
      case 'three-column':
        return <ThreeColumnBlock block={block} depth={depth} theme={theme} className={className} />;
      case 'card-grid':
        return <CardGridBlock block={block} depth={depth} theme={theme} className={className} />;
      case 'timeline':
        return <TimelineBlock block={block} depth={depth} theme={theme} className={className} />;
      default: {
        const _exhaustiveCheck: never = block;
        return <UnknownBlockState type={(_exhaustiveCheck as any)?.type || 'unknown'} />;
      }
    }
  } catch (err) {
    console.error(`[TutorialBlockRenderer] Failed rendering block ${block.id} (${block.type}):`, err);
    return (
      <div role="alert" className="my-2 p-2 text-xs text-rose-500 bg-rose-50 dark:bg-rose-950/30 rounded border border-rose-200 dark:border-rose-900">
        Error rendering block: {block.id}
      </div>
    );
  }
}
