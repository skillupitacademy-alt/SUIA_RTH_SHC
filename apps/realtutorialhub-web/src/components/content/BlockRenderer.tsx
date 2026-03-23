'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo } from 'react';
import type { ReactNode } from 'react';

import type { ContentBlockType, TutorialContentJSON } from '@quiz/types';

import type { DomainTheme } from '@/lib/domain-themes';

import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { BlockLoadingSkeleton } from './BlockLoadingSkeleton';
import { NotesBlock } from './NotesBlock';
import { LaymanBlock } from './LaymanBlock';
import { RealLifeBlock } from './RealLifeBlock';
import { TechnicalBlock } from './TechnicalBlock';
import { CodeBlock } from './CodeBlock';

const DynamicCodeBlock = dynamic(() => Promise.resolve(CodeBlock), { ssr: true, loading: () => <div /> });
const DynamicAITutorBlock = dynamic(() => import('./AITutorBlock').then((mod) => mod.AITutorBlock), {
  ssr: true,
  loading: () => <div />,
});

interface BlockRendererProps {
  content: TutorialContentJSON;
  theme: DomainTheme;
  subtopicId?: string;
  subtopicName?: string;
  completedBlocks?: number;
  activeBlockType?: ContentBlockType;
  simulateSlowLoad?: boolean;
  simulateError?: boolean;
}

const BLOCK_ORDER: ContentBlockType[] = ['notes', 'layman', 'real_life', 'technical', 'code', 'ai_tutor'];

function BlockShell({
  blockType,
  children,
  simulateError,
}: {
  blockType: ContentBlockType;
  children: ReactNode;
  simulateError?: boolean;
}) {
  if (simulateError && blockType === 'technical') {
    throw new Error('Simulated block error');
  }

  return <>{children}</>;
}

export function BlockRenderer({
  content,
  theme,
  subtopicId,
  subtopicName,
  completedBlocks = 0,
  activeBlockType,
  simulateSlowLoad = false,
  simulateError = false,
}: BlockRendererProps) {
  const blocksToRender = useMemo(() => (activeBlockType ? [activeBlockType] : BLOCK_ORDER), [activeBlockType]);
  const blockTranslations = useTranslations('blocks');

  useEffect(() => {
    const storedBlock = window.sessionStorage.getItem('rth-last-block') as ContentBlockType | null;
    const targetBlock = activeBlockType ?? storedBlock ?? blocksToRender[0] ?? null;
    if (!targetBlock) return;

    const targetHeading = document.getElementById(`block-${targetBlock}-heading`);
    if (targetHeading instanceof HTMLElement) {
      targetHeading.focus();
    }
  }, [activeBlockType, blocksToRender]);

  const renderBlock = (blockType: ContentBlockType) => {
    switch (blockType) {
      case 'notes':
        return <NotesBlock data={content.notes} theme={{ blockNotes: theme.blockNotes, blockNotesHeader: theme.sidebarAccent }} />;
      case 'layman':
        return <LaymanBlock data={content.layman} theme={theme} isCompleted={completedBlocks >= 1} />;
      case 'real_life':
        return <RealLifeBlock data={content.real_life} theme={theme} />;
      case 'technical':
        return <TechnicalBlock data={content.technical} theme={theme} />;
      case 'code':
        return <DynamicCodeBlock data={content.code} theme={theme} />;
      case 'ai_tutor':
        return <DynamicAITutorBlock data={content.ai_tutor} theme={theme} subtopicId={subtopicId} subtopicName={subtopicName} />;
      default:
        return null;
    }
  };

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {blocksToRender.map((blockType) => (
        <div key={blockType} id={`block-${blockType}`} data-tutorial-block={blockType} style={{ scrollMarginTop: 112 }}>
          <ErrorBoundary blockName={blockTranslations(`${blockType}.title`)}>
            <BlockShell blockType={blockType} simulateError={simulateError}>
              {simulateSlowLoad ? <BlockLoadingSkeleton blockType={blockType} /> : renderBlock(blockType)}
            </BlockShell>
          </ErrorBoundary>
        </div>
      ))}
    </div>
  );
}
