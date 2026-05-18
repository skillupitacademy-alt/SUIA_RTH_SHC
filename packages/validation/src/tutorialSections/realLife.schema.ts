import { z } from 'zod';
import {
  NonEmptyStringSchema,
  OptionalNonEmptyStringSchema,
  nonEmptyStringArray,
  sectionSchema,
  strictObject,
} from './base';

export const RealLifeSectionSchema = sectionSchema('real_life', {
  conceptMapping: strictObject({
    badge: NonEmptyStringSchema,
    headline: NonEmptyStringSchema,
    conceptDefinition: NonEmptyStringSchema,
    realWorldTranslation: NonEmptyStringSchema,
    importanceBlock: NonEmptyStringSchema,
    careerRelevance: OptionalNonEmptyStringSchema,
  }).optional(),
  industryUseCase: strictObject({
    title: NonEmptyStringSchema,
    industryName: NonEmptyStringSchema,
    scenarioDescription: NonEmptyStringSchema,
    businessContext: NonEmptyStringSchema,
    implementation: NonEmptyStringSchema,
    impact: NonEmptyStringSchema,
    keyTakeaway: NonEmptyStringSchema,
    image: OptionalNonEmptyStringSchema,
  }).optional(),
  dailyLifeExample: strictObject({
    title: NonEmptyStringSchema,
    storyTitle: NonEmptyStringSchema,
    storyNarrative: NonEmptyStringSchema,
    everydayConnection: NonEmptyStringSchema,
    technicalMapping: NonEmptyStringSchema,
    relatableInsight: NonEmptyStringSchema,
    image: OptionalNonEmptyStringSchema,
  }).optional(),
  careerRelevance: strictObject({
    title: NonEmptyStringSchema,
    careerPaths: z.array(strictObject({
      id: NonEmptyStringSchema,
      role: NonEmptyStringSchema,
      description: NonEmptyStringSchema,
      skillLevel: z.enum(['entry', 'mid', 'senior']),
      salaryRange: OptionalNonEmptyStringSchema,
      icon: NonEmptyStringSchema,
    })).min(1),
    industryDemand: NonEmptyStringSchema,
    futureGrowth: NonEmptyStringSchema,
  }).optional(),
  problemSolutionContext: strictObject({
    title: NonEmptyStringSchema,
    problemStatement: NonEmptyStringSchema,
    context: NonEmptyStringSchema,
    solution: NonEmptyStringSchema,
    implementation: NonEmptyStringSchema,
    outcome: NonEmptyStringSchema,
    lessonsLearned: NonEmptyStringSchema,
  }).optional(),
  businessApplication: strictObject({
    title: NonEmptyStringSchema,
    companyType: NonEmptyStringSchema,
    businessChallenge: NonEmptyStringSchema,
    technicalApplication: NonEmptyStringSchema,
    businessProcess: NonEmptyStringSchema,
    roi: NonEmptyStringSchema,
    scalability: NonEmptyStringSchema,
    keyInsight: NonEmptyStringSchema,
  }).optional(),
  domainScenarios: strictObject({
    title: NonEmptyStringSchema,
    scenarios: z.array(strictObject({
      id: NonEmptyStringSchema,
      domain: NonEmptyStringSchema,
      title: NonEmptyStringSchema,
      description: NonEmptyStringSchema,
      application: NonEmptyStringSchema,
      icon: NonEmptyStringSchema,
    })).min(1),
  }).optional(),
  practicalRecap: strictObject({
    summaryTitle: NonEmptyStringSchema,
    keyApplications: nonEmptyStringArray(1),
    industryRelevance: nonEmptyStringArray(1),
    careerImpact: NonEmptyStringSchema,
    nextSteps: nonEmptyStringArray(1),
    practicalAdvice: NonEmptyStringSchema,
  }).optional(),
});

export type RealLifeSection = z.infer<typeof RealLifeSectionSchema>;

