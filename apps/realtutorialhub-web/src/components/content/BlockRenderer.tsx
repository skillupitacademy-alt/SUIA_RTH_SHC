'use client';

import { useMemo } from 'react';

import type { ContentBlockType, TutorialContentJSON } from '@quiz/types';

import type { DomainTheme } from '@/lib/domain-themes';
import { AssignmentBlock } from './AssignmentBlock';
import { CodeBlock } from './CodeBlock';
import { LaymanBlock } from './LaymanBlock';
import { NotesBlock } from './NotesBlock';
import { PracticeBlock } from './PracticeBlock';
import { ProjectBlock } from './ProjectBlock';
import { QuizBlock } from './QuizBlock';
import { RealLifeBlock } from './RealLifeBlock';
import { TechnicalBlock } from './TechnicalBlock';
import { VisualBlock } from './VisualBlock';
import { AITutorBlock } from './AITutorBlock';

interface BlockRendererProps {
  type?: ContentBlockType;
  activeBlockType?: ContentBlockType;
  content: TutorialContentJSON;
  theme: DomainTheme;
  subtopicId?: string;
  subtopicName?: string;
  simulateSlowLoad?: boolean;
  simulateError?: boolean;
}

export function BlockRenderer({ 
  type, 
  activeBlockType, 
  content, 
  theme
}: BlockRendererProps) {
  // Use activeBlockType if type is not provided
  const targetType = type || activeBlockType || 'notes';

  const renderedBlock = useMemo(() => {
    switch (targetType) {
      case 'notes':
        return <NotesBlock data={content.notes} theme={theme} />;
      case 'layman':
        return <LaymanBlock data={content.layman} theme={theme} />;
      case 'real_life':
        return <RealLifeBlock data={content.real_life} theme={theme} />;
      case 'technical':
        return <TechnicalBlock data={content.technical} theme={theme} />;
      case 'visual':
        return <VisualBlock data={content.visual} theme={theme} />;
      case 'code':
        return <CodeBlock data={content.code} theme={theme} />;
      case 'quiz':
        return <QuizBlock data={content.quiz} theme={theme} />;
      case 'practice':
        return <PracticeBlock data={content.practice} theme={theme} />;
      case 'assignment':
        return <AssignmentBlock data={content.assignment} theme={theme} />;
      case 'project':
        return <ProjectBlock data={content.project} theme={theme} />;
      case 'ai_tutor':
        return <AITutorBlock data={content.ai_tutor} theme={theme} />;
      default:
        return null;
    }
  }, [targetType, content, theme]);

  if (!renderedBlock) return null;

  return (
    <div className="block-container" id={`block-${targetType}`}>
      {renderedBlock}
    </div>
  );
}
