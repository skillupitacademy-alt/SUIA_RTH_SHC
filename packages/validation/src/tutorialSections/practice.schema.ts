import { z } from 'zod';
import {
  NonEmptyStringSchema,
  PercentageSchema,
  QuestionDifficultySchema,
  OptionSchema,
  nonEmptyStringArray,
  sectionSchema,
  strictObject,
} from './base';

const PracticeQuestionSchema = strictObject({
  id: NonEmptyStringSchema,
  questionNumber: z.number().int().positive(),
  type: z.enum(['single-choice', 'multiple-choice']),
  points: z.number().int().positive(),
  question: NonEmptyStringSchema,
  code: NonEmptyStringSchema.optional(),
  options: z.array(OptionSchema).min(2),
  correctAnswer: z.union([NonEmptyStringSchema, nonEmptyStringArray(1)]),
  explanation: NonEmptyStringSchema,
  difficulty: QuestionDifficultySchema,
});

export const PracticeSectionSchema = sectionSchema('practice', {
  assessmentIntro: strictObject({
    badge: NonEmptyStringSchema,
    headline: NonEmptyStringSchema,
    testDescription: NonEmptyStringSchema,
    difficultyOverview: NonEmptyStringSchema,
    learningGoals: nonEmptyStringArray(1),
    readinessIndicator: NonEmptyStringSchema,
  }).optional(),
  conceptRecallQuestions: strictObject({
    title: NonEmptyStringSchema,
    questions: z.array(PracticeQuestionSchema).min(1),
  }).optional(),
  scenarioBasedQuestions: strictObject({
    title: NonEmptyStringSchema,
    scenarios: z.array(strictObject({
      id: NonEmptyStringSchema,
      scenarioTitle: NonEmptyStringSchema,
      realWorldProblem: NonEmptyStringSchema,
      businessContext: NonEmptyStringSchema,
      decisionQuestion: NonEmptyStringSchema,
      options: z.array(OptionSchema).min(2),
      correctAnswer: NonEmptyStringSchema,
      explanation: NonEmptyStringSchema,
      difficulty: z.enum(['medium', 'hard']),
    })).min(1),
  }).optional(),
  difficultyProgression: strictObject({
    title: NonEmptyStringSchema,
    levels: z.array(strictObject({
      id: NonEmptyStringSchema,
      level: z.enum(['beginner', 'intermediate', 'advanced']),
      description: NonEmptyStringSchema,
      questionCount: z.number().int().positive(),
      passingScore: PercentageSchema,
    })).min(1),
    adaptiveLogic: z.boolean(),
  }).optional(),
  instantFeedback: strictObject({
    enabled: z.boolean(),
    feedbackType: z.enum(['immediate', 'end-of-test']),
  }).optional(),
  commonMistakeDetection: strictObject({
    title: NonEmptyStringSchema,
    mistakeCategories: z.array(strictObject({
      id: NonEmptyStringSchema,
      category: NonEmptyStringSchema,
      description: NonEmptyStringSchema,
      frequency: z.number().int().min(0),
    })).min(1),
    weaknessHeatmap: strictObject({
      topics: z.array(strictObject({
        id: NonEmptyStringSchema,
        topic: NonEmptyStringSchema,
        score: PercentageSchema,
        status: z.enum(['strong', 'moderate', 'weak']),
      })).min(1),
    }),
  }).optional(),
  performanceAnalytics: strictObject({
    title: NonEmptyStringSchema,
    scoreDisplay: strictObject({
      currentScore: z.number().finite().min(0),
      maxScore: z.number().finite().positive(),
      percentage: PercentageSchema,
    }),
    performanceGraphs: strictObject({
      accuracyTrend: z.array(PercentageSchema).min(1),
      speedTrend: z.array(PercentageSchema).min(1),
    }),
    benchmarkComparison: strictObject({
      userScore: PercentageSchema,
      averageScore: PercentageSchema,
      topScore: PercentageSchema,
    }),
    masteryPercentage: PercentageSchema,
    examReadinessScore: PercentageSchema,
  }).optional(),
  revisionRecommendations: strictObject({
    title: NonEmptyStringSchema,
    personalizedLearningPath: z.array(strictObject({
      id: NonEmptyStringSchema,
      topic: NonEmptyStringSchema,
      priority: z.enum(['high', 'medium', 'low']),
      estimatedTime: NonEmptyStringSchema,
      resources: nonEmptyStringArray(1),
    })).min(1),
    weaknessRecoverySteps: nonEmptyStringArray(1),
    recommendedResources: z.array(strictObject({
      id: NonEmptyStringSchema,
      title: NonEmptyStringSchema,
      type: z.enum(['video', 'article', 'practice']),
      link: NonEmptyStringSchema,
    })).min(1),
    futureGoals: nonEmptyStringArray(1),
  }).optional(),
});

export type PracticeSection = z.infer<typeof PracticeSectionSchema>;

