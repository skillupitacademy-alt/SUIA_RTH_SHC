import type { TutorialSectionId } from '@quiz/types';

export const TUTORIAL_REQUIRED_MASTERY_SECTIONS = [
  'notes',
  'layman',
  'real_life',
  'technical',
  'code',
  'visual',
  'practice',
  'assignment',
  'project',
  'quiz',
  'summary',
  'interview',
  'ai_tutor',
] as const satisfies readonly Exclude<TutorialSectionId, 'overview'>[];

export type TutorialMasterySectionId = (typeof TUTORIAL_REQUIRED_MASTERY_SECTIONS)[number];
export type TutorialProgressStatus = 'not_started' | 'in_progress' | 'completed';
export type TutorialMasteryState = TutorialProgressStatus | 'mastered';

const REQUIRED_SET = new Set<string>(TUTORIAL_REQUIRED_MASTERY_SECTIONS);

export interface TutorialProgressEngineInput {
  completedSections?: readonly string[] | null;
  quizScorePercent?: number | null;
  practiceScorePercent?: number | null;
  assignmentCompleted?: boolean | null;
  projectCompleted?: boolean | null;
  timeSpentSec?: number | null;
}

export interface TutorialProgressSnapshot {
  requiredSections: TutorialMasterySectionId[];
  completedSections: TutorialMasterySectionId[];
  missingSections: TutorialMasterySectionId[];
  requiredCount: number;
  completedCount: number;
  completionPercent: number;
  status: TutorialProgressStatus;
  masteryState: TutorialMasteryState;
  mastered: boolean;
  quizScorePercent: number | null;
  practiceScorePercent: number | null;
  assignmentCompleted: boolean;
  projectCompleted: boolean;
  remediationTriggered: boolean;
  retryRecommended: boolean;
  recommendations: string[];
}

function normalizePercent(value: number | null | undefined): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  return Math.max(0, Math.min(100, value));
}

export function normalizeCompletedTutorialSections(
  completedSections: readonly string[] | null | undefined
): TutorialMasterySectionId[] {
  const unique = new Set<TutorialMasterySectionId>();
  for (const section of completedSections ?? []) {
    if (REQUIRED_SET.has(section)) {
      unique.add(section as TutorialMasterySectionId);
    }
  }
  return TUTORIAL_REQUIRED_MASTERY_SECTIONS.filter((section) => unique.has(section));
}

export function isTutorialMasterySection(section: string): section is TutorialMasterySectionId {
  return REQUIRED_SET.has(section);
}

export function calculateTutorialProgress(input: TutorialProgressEngineInput): TutorialProgressSnapshot {
  const completedSections = normalizeCompletedTutorialSections(input.completedSections);
  const missingSections = TUTORIAL_REQUIRED_MASTERY_SECTIONS.filter((section) => !completedSections.includes(section));
  const completionPercent = Math.round((completedSections.length / TUTORIAL_REQUIRED_MASTERY_SECTIONS.length) * 100);
  const quizScorePercent = normalizePercent(input.quizScorePercent);
  const practiceScorePercent = normalizePercent(input.practiceScorePercent);
  const assignmentCompleted = input.assignmentCompleted ?? completedSections.includes('assignment');
  const projectCompleted = input.projectCompleted ?? completedSections.includes('project');
  const requiredComplete = missingSections.length === 0;
  const mastered =
    requiredComplete &&
    (quizScorePercent === null || quizScorePercent >= 80) &&
    (practiceScorePercent === null || practiceScorePercent >= 80) &&
    assignmentCompleted &&
    projectCompleted;
  const status: TutorialProgressStatus =
    completedSections.length === 0 ? 'not_started' : requiredComplete ? 'completed' : 'in_progress';
  const retryRecommended =
    (quizScorePercent !== null && quizScorePercent < 70) ||
    (practiceScorePercent !== null && practiceScorePercent < 70);
  const remediationTriggered = retryRecommended || missingSections.length > 0;
  const recommendations: string[] = [];

  if (quizScorePercent !== null && quizScorePercent < 70) {
    recommendations.push('Retry quiz after reviewing notes, technical, and summary sections.');
  }
  if (practiceScorePercent !== null && practiceScorePercent < 70) {
    recommendations.push('Retry practice test after reviewing missed scenarios.');
  }
  if (!assignmentCompleted && completedSections.includes('assignment')) {
    recommendations.push('Submit and verify the assignment before mastery can be awarded.');
  }
  if (!projectCompleted && completedSections.includes('project')) {
    recommendations.push('Submit and verify the project before mastery can be awarded.');
  }
  if (missingSections.length > 0) {
    recommendations.push(`Complete missing sections: ${missingSections.join(', ')}.`);
  }

  return {
    requiredSections: [...TUTORIAL_REQUIRED_MASTERY_SECTIONS],
    completedSections,
    missingSections,
    requiredCount: TUTORIAL_REQUIRED_MASTERY_SECTIONS.length,
    completedCount: completedSections.length,
    completionPercent,
    status,
    masteryState: mastered ? 'mastered' : status,
    mastered,
    quizScorePercent,
    practiceScorePercent,
    assignmentCompleted,
    projectCompleted,
    remediationTriggered,
    retryRecommended,
    recommendations,
  };
}

export function mergeCompletedTutorialSection(
  completedSections: readonly string[] | null | undefined,
  sectionType: string
): TutorialMasterySectionId[] {
  if (!isTutorialMasterySection(sectionType)) {
    return normalizeCompletedTutorialSections(completedSections);
  }
  return normalizeCompletedTutorialSections([...(completedSections ?? []), sectionType]);
}

