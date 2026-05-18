/**
 * Universal Subtopic Content Registry
 * 
 * This file defines the universal pattern for all subtopic content.
 * Component-architecture is the BASE pattern that all other subtopics follow.
 */

import { NotesSectionPattern } from './types/notes.types';
import { LaymanSectionPattern } from './types/layman.types';
import { RealLifeSectionPattern } from './types/reallife.types';
import { TechnicalSectionPattern } from './types/technical.types';
import { CodeSectionPattern } from './types/code.types';
import { AssignmentSectionPattern } from './types/assignment.types';
import { ProjectSectionPattern } from './types/project.types';
import { QuizSectionPattern } from './types/quiz.types';
import { VisualSectionPattern } from './types/visual.types';
import { PracticeSectionPattern } from './types/practice.types';
import { ProgressSectionPattern } from './types/progress.types';

export interface SubtopicContentPattern extends NotesSectionPattern {
  simpleWords: string;
  laymanExplanation?: LaymanSectionPattern;
  realLifeExamples?: RealLifeSectionPattern;
  technicalDeepDive?: TechnicalSectionPattern;
  codeExample?: CodeSectionPattern;
  assignment?: AssignmentSectionPattern;
  project?: ProjectSectionPattern;
  quiz?: QuizSectionPattern;
  visualExplanation?: VisualSectionPattern;
  practiceTest?: PracticeSectionPattern;
  progress?: ProgressSectionPattern;
}

import { componentArchitectureContent } from './subtopics/component-architecture';
import { whatIsJavaScriptContent } from './subtopics/whatisjavascript';
import { variableContent } from './subtopics/variable';

export const subtopicContentRegistry: Record<string, SubtopicContentPattern> = {
  'component-architecture': componentArchitectureContent,
  'whatisjavascript': whatIsJavaScriptContent,
  'variable': variableContent
};

/**
 * Get content for a subtopic
 * Returns undefined if subtopic not found - no fallback
 */
export function getSubtopicContent(subtopicId: string): SubtopicContentPattern | undefined {
  return subtopicContentRegistry[subtopicId];
}
