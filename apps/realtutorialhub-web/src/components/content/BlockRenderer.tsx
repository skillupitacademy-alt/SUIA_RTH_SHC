import dynamic from 'next/dynamic';

import type { ContentBlockType, TutorialContentJSON } from '@quiz/types';

import type { DomainTheme } from '@/lib/domain-themes';

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
  completedBlocks?: number;
  activeBlockType?: ContentBlockType;
}

const BLOCK_ORDER: ContentBlockType[] = ['notes', 'layman', 'real_life', 'technical', 'code', 'ai_tutor'];

export function BlockRenderer({ content, theme, completedBlocks = 0, activeBlockType }: BlockRendererProps) {
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
        return <DynamicAITutorBlock data={content.ai_tutor} theme={theme} />;
      default:
        return null;
    }
  };

  const blocksToRender = activeBlockType ? [activeBlockType] : BLOCK_ORDER;

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {blocksToRender.map((blockType) => (
        <div key={blockType}>{renderBlock(blockType)}</div>
      ))}
    </div>
  );
}
