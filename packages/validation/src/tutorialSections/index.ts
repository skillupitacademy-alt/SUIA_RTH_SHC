import { z } from 'zod';
import type { TutorialSectionId } from '@quiz/types';
import { AITutorSectionSchema } from './aiTutor.schema';
import { AssignmentSectionSchema } from './assignment.schema';
import { CodeSectionSchema } from './code.schema';
import { InterviewSectionSchema } from './interview.schema';
import { LaymanSectionSchema } from './layman.schema';
import { NotesSectionSchema } from './notes.schema';
import { OverviewSectionSchema } from './overview.schema';
import { PracticeSectionSchema } from './practice.schema';
import { ProjectSectionSchema } from './project.schema';
import { QuizSectionSchema } from './quiz.schema';
import { RealLifeSectionSchema } from './realLife.schema';
import { SummarySectionSchema } from './summary.schema';
import { TechnicalSectionSchema } from './technical.schema';
import { VisualSectionSchema } from './visual.schema';

export * from './base';
export * from './overview.schema';
export * from './notes.schema';
export * from './layman.schema';
export * from './realLife.schema';
export * from './technical.schema';
export * from './code.schema';
export * from './visual.schema';
export * from './practice.schema';
export * from './assignment.schema';
export * from './project.schema';
export * from './quiz.schema';
export * from './summary.schema';
export * from './interview.schema';
export * from './aiTutor.schema';

export const TutorialSectionSchemas = {
  overview: OverviewSectionSchema,
  notes: NotesSectionSchema,
  layman: LaymanSectionSchema,
  real_life: RealLifeSectionSchema,
  technical: TechnicalSectionSchema,
  code: CodeSectionSchema,
  visual: VisualSectionSchema,
  practice: PracticeSectionSchema,
  assignment: AssignmentSectionSchema,
  project: ProjectSectionSchema,
  quiz: QuizSectionSchema,
  summary: SummarySectionSchema,
  interview: InterviewSectionSchema,
  ai_tutor: AITutorSectionSchema,
} as const satisfies Record<TutorialSectionId, z.ZodType<unknown>>;

export type TutorialSectionSchemaMap = typeof TutorialSectionSchemas;
export type ValidatedTutorialSection<TSection extends TutorialSectionId> = z.infer<TutorialSectionSchemaMap[TSection]>;

export interface TutorialSectionValidationIssue {
  path: string;
  code: string;
  message: string;
}

export class TutorialSectionValidationError extends Error {
  readonly sectionType: TutorialSectionId;
  readonly issues: TutorialSectionValidationIssue[];

  constructor(sectionType: TutorialSectionId, issues: TutorialSectionValidationIssue[]) {
    super(`Tutorial section "${sectionType}" failed strict schema validation`);
    this.name = 'TutorialSectionValidationError';
    this.sectionType = sectionType;
    this.issues = issues;
  }
}

function mapZodIssues(issues: z.ZodIssue[]): TutorialSectionValidationIssue[] {
  return issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join('.') : '<root>',
    code: issue.code,
    message: issue.message,
  }));
}

export function validateTutorialSection<TSection extends TutorialSectionId>(
  sectionType: TSection,
  content: unknown
): { success: true; data: ValidatedTutorialSection<TSection> } | { success: false; issues: TutorialSectionValidationIssue[] } {
  const result = TutorialSectionSchemas[sectionType].safeParse(content);
  if (!result.success) {
    return { success: false, issues: mapZodIssues(result.error.issues) };
  }
  return { success: true, data: result.data as ValidatedTutorialSection<TSection> };
}

export function parseTutorialSection<TSection extends TutorialSectionId>(
  sectionType: TSection,
  content: unknown
): ValidatedTutorialSection<TSection> {
  const result = validateTutorialSection(sectionType, content);
  if (!result.success) {
    throw new TutorialSectionValidationError(sectionType, result.issues);
  }
  return result.data;
}

export function formatTutorialSectionValidationIssues(
  issues: readonly TutorialSectionValidationIssue[]
): string {
  return issues.map((issue) => `${issue.path}: ${issue.message}`).join('; ');
}

