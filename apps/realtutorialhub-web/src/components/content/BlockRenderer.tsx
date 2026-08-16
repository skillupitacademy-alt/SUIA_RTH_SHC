'use client';

import { useMemo } from 'react';

import type { ContentBlockType, TutorialContentJSON, TutorialDocument } from '@quiz/types';
import { isTutorialDocument } from '@quiz/types';
import { TutorialRenderer } from '@quiz/ui';

import type { DomainTheme } from '@/lib/domain-themes';
import { AssignmentBlock } from './AssignmentBlock';
import { CodeBlock } from './CodeBlock';
import { InterviewBlock } from './InterviewBlock';
import { LaymanBlock } from './LaymanBlock';
import { NotesBlock } from './NotesBlock';
import { PracticeBlock } from './PracticeBlock';
import { ProjectBlock } from './ProjectBlock';
import { QuizBlock } from './QuizBlock';
import { RealLifeBlock } from './RealLifeBlock';
import { SummaryBlock } from './SummaryBlock';
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
  theme,
  subtopicName,
}: BlockRendererProps) {
  // Use activeBlockType if type is not provided
  const targetType = type || activeBlockType || 'notes';

  const sectionData = (content as any)?.[targetType];

  const renderedBlock = useMemo(() => {
    // If section content is a canonical TutorialDocument, render via Universal TutorialRenderer
    if (isTutorialDocument(sectionData)) {
      return (
        <TutorialRenderer
          document={sectionData as TutorialDocument}
          sectionType={targetType}
          theme={theme}
        />
      );
    }

    // Otherwise, fall back to legacy block renderer components
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
      case 'summary':
        return <SummaryBlock data={content.summary} theme={theme} subtopicName={subtopicName} />;
      case 'interview':
        return <InterviewBlock data={content.interview} theme={theme} subtopicName={subtopicName} />;
      case 'ai_tutor':
        return <AITutorBlock data={content.ai_tutor} theme={theme} />;
      default:
        return null;
    }
  }, [targetType, sectionData, content, theme, subtopicName]);

  if (!renderedBlock) return null;

  return (
    <div className="block-container" id={`block-${targetType}`}>
      {renderedBlock}
    </div>
  );
}
