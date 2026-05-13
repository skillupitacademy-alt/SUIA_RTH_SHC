import { BrandConfig } from './brandConfig';
import {
  TutorialSectionValidationError,
  formatTutorialSectionValidationIssues,
  parseTutorialSection,
} from '@quiz/validation';

export interface ContentCardData {
  id: string;
  title: string;
  type: 'notes' | 'layman' | 'example' | 'code' | 'deep-dive' | 'visual' | 'task' | 'practice' | 'assignment' | 'project' | 'quiz';
  content?: string;
  code?: string;
  ctaLabel: string;
  badge?: {
    text: string;
    type: 'success' | 'warning' | 'info';
  };
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface Weakness {
  id: string;
  topic: string;
  status: string;
  color: string;
}

export interface SubtopicViewData {
  nav: {
    courseLabel: string;
    lessonLabel: string;
    dashboardCtaLabel: string;
    streak: number;
    xpPoints: number;
    learnerInitials: string;
  };
  subtopic: {
    title: string;
    description: string;
    iconLabel?: string;
    progress: number;
    progressLabel: string;
    metadata: {
      level: string;
      readingTime: string;
      xp: number;
      topicsCount: number;
      lastUpdated: string;
    };
    stats: { id: string; label: string; value: string; icon: string }[];
    overallProgress: {
      percentage: number;
      checklist: { label: string; completed: boolean }[];
    };
    sidebar: {
      subtopicsTitle: string;
      items: {
        id: string;
        title: string;
        status: 'completed' | 'active' | 'locked';
        isCurrent?: boolean;
      }[];
    };
    tabs: { id: string; label: string; icon: string }[];
    content: ContentCardData[];
    tasks: ContentCardData[];
    navigation: {
      prev: { title: string };
      next: { title: string };
    };
  };
  rightSidebar: {
    xpSection: { title: string; earnedXp: number; totalXp: number; xpMessage: string };
    achievements: { title: string; items: Achievement[] };
    weaknessAnalysis: { title: string; score: number; scoreLabel: string; items: Weakness[] };
    aiTutor: { title: string; subtitle: string; inputPlaceholder: string; examples: string[] };
  };
}

type JsonRecord = Record<string, unknown>;

interface TutorialSectionsResponse {
  subtopicName?: string;
  difficulty?: string;
  totalSections?: number;
  sections?: Record<string, unknown>;
}

const contentCardTypes = ['notes', 'layman', 'example', 'code', 'deep-dive', 'visual', 'task', 'practice', 'assignment', 'project', 'quiz'] as const;

function isRecord(value: unknown): value is JsonRecord {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function asRecord(value: unknown): JsonRecord {
  return isRecord(value) ? value : {};
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : [];
}

function getPath(source: unknown, path: Array<string | number>): unknown {
  let current: unknown = source;
  for (const segment of path) {
    if (typeof segment === 'number') {
      if (!Array.isArray(current)) return undefined;
      current = current[segment];
      continue;
    }

    if (!isRecord(current)) return undefined;
    current = current[segment];
  }
  return current;
}

function firstText(...values: unknown[]): string {
  for (const value of values) {
    const text = asString(value);
    if (text) return text;
  }
  return '';
}

function titleFromSlug(slug: string): string {
  return slug
    .split('-')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ') || 'Tutorial';
}

function difficultyLabel(value: unknown): string {
  const text = asString(value, 'Beginner').toLowerCase();
  if (text === 'simple') return 'Beginner';
  if (text === 'mixed') return 'Mixed';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function iconLabelFromTitle(title: string): string {
  if (/javascript/i.test(title)) return 'JS';
  const words = title.match(/[a-zA-Z0-9]+/g) ?? [];
  if (words.length === 0) return 'RT';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase();
}

function normalizeChecklist(value: unknown): Array<{ label: string; completed: boolean }> {
  return asArray<JsonRecord>(value)
    .map((item, index) => ({
      label: asString(item.label, `Step ${index + 1}`),
      completed: typeof item.completed === 'boolean' ? item.completed : false,
    }))
    .filter((item) => item.label.length > 0);
}

function normalizeContentCard(value: unknown, fallback: ContentCardData): ContentCardData {
  const card = asRecord(value);
  const rawType = asString(card.type, fallback.type);
  const type = contentCardTypes.includes(rawType as ContentCardData['type'])
    ? rawType as ContentCardData['type']
    : fallback.type;
  const badge = asRecord(card.badge);
  const badgeType = asString(badge.type, 'info');

  return {
    id: asString(card.id, fallback.id),
    title: asString(card.title, fallback.title),
    type,
    content: asString(card.content, fallback.content),
    code: asString(card.code, fallback.code),
    ctaLabel: asString(card.ctaLabel, fallback.ctaLabel),
    ...(Object.keys(badge).length > 0 && {
      badge: {
        text: asString(badge.text, fallback.badge?.text ?? 'Task'),
        type: (['success', 'warning', 'info'].includes(badgeType) ? badgeType : 'info') as 'success' | 'warning' | 'info',
      },
    }),
  };
}

async function fetchTutorialSections(subtopicId: string): Promise<TutorialSectionsResponse | null> {
  if (typeof window === 'undefined') return null;

  try {
    const response = await fetch(`/api/tutorial/sections/${encodeURIComponent(subtopicId)}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Failed to load overview sections' }));
      throw new Error(error.error || 'Failed to load overview sections');
    }
    return await response.json() as TutorialSectionsResponse;
  } catch (error) {
    console.error('[loadTutorialData] Failed to load overview sections:', error);
    throw error;
  }
}

function deriveOverviewContent(sections: Record<string, unknown>, title: string): ContentCardData[] {
  const notes = asRecord(sections.notes);
  const layman = asRecord(sections.layman);
  const realLife = asRecord(sections.real_life);
  const technical = asRecord(sections.technical);
  const code = asRecord(sections.code);
  const visual = asRecord(sections.visual);

  return [
    {
      id: 'notes',
      title: 'Notes',
      type: 'notes',
      content: firstText(
        notes.simpleWords,
        getPath(notes, ['definitionBlock', 'definitionText']),
        getPath(notes, ['coreDefinition', 'simpleExplanation']),
        `Learn the core definition, structure, and examples for ${title}.`
      ),
      ctaLabel: 'Read Full Notes',
    },
    {
      id: 'layman',
      title: 'Layman Explanation',
      type: 'layman',
      content: firstText(
        getPath(layman, ['simpleOverview', 'simpleDefinition']),
        getPath(layman, ['simpleOverview', 'subExplanation']),
        `Understand ${title} in simple beginner-friendly language.`
      ),
      ctaLabel: 'Read Simply',
    },
    {
      id: 'real-life',
      title: 'Real-Life Example',
      type: 'example',
      content: firstText(
        getPath(realLife, ['conceptMapping', 'realWorldTranslation']),
        getPath(realLife, ['industryUseCase', 'scenarioDescription']),
        `See how ${title} is used in real-world work.`
      ),
      ctaLabel: 'View Examples',
    },
    {
      id: 'code',
      title: 'Code Example',
      type: 'code',
      code: firstText(
        getPath(code, ['basicCodeExample', 'code']),
        getPath(code, ['primaryCodeWorkspace', 'code']),
        getPath(code, ['codeBlock', 'code']),
        `// ${title}\nconsole.log("${title}");`
      ),
      ctaLabel: 'Run Code',
    },
    {
      id: 'technical',
      title: 'Technical Deep Dive',
      type: 'deep-dive',
      content: firstText(
        technical.intro,
        getPath(technical, ['coreTechnicalDefinition', 'definition']),
        `Review the deeper mechanics and tradeoffs behind ${title}.`
      ),
      ctaLabel: 'Read Details',
    },
    {
      id: 'visual',
      title: 'Visual Explanation',
      type: 'visual',
      content: firstText(
        getPath(visual, ['conceptVisualIntro', 'visualDefinition']),
        getPath(visual, ['visualSummary', 'summaryTitle']),
        `Visualize how ${title} works step by step.`
      ),
      ctaLabel: 'View Visual',
    },
  ];
}

function deriveTaskCards(sections: Record<string, unknown>, title: string): ContentCardData[] {
  const practice = asRecord(sections.practice);
  const assignment = asRecord(sections.assignment);
  const project = asRecord(sections.project);
  const quiz = asRecord(sections.quiz);
  const quizQuestions = asArray(getPath(quiz, ['questions']));

  return [
    {
      id: 'practice',
      title: 'Practice Tasks',
      type: 'practice',
      content: firstText(
        getPath(practice, ['assessmentIntro', 'testDescription']),
        `Practice recall, scenario questions, and application checks for ${title}.`
      ),
      ctaLabel: 'Start Practice',
    },
    {
      id: 'assignment',
      title: 'Assignment',
      type: 'assignment',
      content: firstText(assignment.description, getPath(assignment, ['task', 'description']), `Apply ${title} in a focused assignment.`),
      badge: { text: 'Easy', type: 'success' },
      ctaLabel: 'Start Assignment',
    },
    {
      id: 'project',
      title: 'Project',
      type: 'project',
      content: firstText(project.description, getPath(project, ['hero', 'description']), `Build a small project that uses ${title}.`),
      badge: { text: 'Project', type: 'success' },
      ctaLabel: 'View Project',
    },
    {
      id: 'quiz',
      title: 'Quiz',
      type: 'quiz',
      content: firstText(quiz.description, `${quizQuestions.length || asNumber(quiz.totalQuestions, 10)} Questions\nPassing Score: 70%`),
      ctaLabel: 'Start Quiz',
    },
  ];
}

function buildOverviewFromSections(brand: BrandConfig, subtopicId: string, apiData: TutorialSectionsResponse | null): SubtopicViewData {
  const sections = apiData?.sections;
  if (!sections || !Object.prototype.hasOwnProperty.call(sections, 'overview')) {
    throw new Error('This tutorial section failed schema validation and must be regenerated. Section: overview. Missing required DB section.');
  }

  let overview: ReturnType<typeof parseTutorialSection<'overview'>>;
  try {
    overview = parseTutorialSection('overview', sections.overview);
  } catch (error) {
    if (error instanceof TutorialSectionValidationError) {
      throw new Error(
        `This tutorial section failed schema validation and must be regenerated. Section: overview. ${formatTutorialSectionValidationIssues(error.issues)}`
      );
    }
    throw error;
  }

  const hero = overview.hero;
  const progressSummary = overview.progressSummary;
  const title = hero.title;
  const description = hero.description;
  const topicsCount = hero.topicsCount;
  const progress = progressSummary.percentage;
  const checklist = progressSummary.checklist;
  const contentCards = overview.learningRoadmap.contentCards;
  const taskCards = overview.learningRoadmap.taskCards;
  const navigation = overview.navigation;

  return {
    nav: {
      courseLabel: 'Course',
      lessonLabel: 'Lesson',
      dashboardCtaLabel: 'Dashboard',
      streak: 12,
      xpPoints: 12450,
      learnerInitials: 'AJ',
    },
    subtopic: {
      title,
      description,
        iconLabel: firstText(hero.iconLabel, iconLabelFromTitle(title)),
        progress,
        progressLabel: 'Subtopic Progress',
        metadata: {
        level: difficultyLabel(hero.difficulty),
        readingTime: hero.estimatedReadTime,
        xp: hero.xp,
        topicsCount,
        lastUpdated: hero.lastUpdated,
      },
      stats: [
        { id: 'time', label: 'Est. Time', value: hero.estimatedReadTime, icon: 'Clock' },
        { id: 'level', label: 'Difficulty', value: difficultyLabel(hero.difficulty), icon: 'BarChart' },
        { id: 'xp', label: 'Reward', value: `${hero.xp} XP`, icon: 'Zap' },
      ],
      overallProgress: {
        percentage: progress,
        checklist,
      },
      sidebar: {
        subtopicsTitle: 'Learning Path',
        items: [
          { id: subtopicId, title, status: 'active', isCurrent: true },
        ],
      },
      tabs: [
        { id: 'overview', label: 'Overview', icon: 'LayoutDashboard' },
        { id: 'learn', label: 'Learn', icon: 'BookOpen' },
        { id: 'practice', label: 'Practice', icon: 'Rocket' },
        { id: 'assignment', label: 'Assignment', icon: 'ClipboardList' },
        { id: 'project', label: 'Project', icon: 'Puzzle' },
        { id: 'quiz', label: 'Quiz', icon: 'ClipboardCheck' },
        { id: 'ai-tutor', label: brand.tutorLabel, icon: 'Bot' },
        { id: 'summary', label: 'Summary', icon: 'FileText' },
        { id: 'interview', label: 'Interview', icon: 'Presentation' },
        { id: 'remediation', label: 'Remediation', icon: 'Activity' },
      ],
      content: contentCards as ContentCardData[],
      tasks: taskCards as ContentCardData[],
      navigation: {
        prev: { title: navigation.prevTitle },
        next: { title: navigation.nextTitle },
      },
    },
    rightSidebar: {
      xpSection: {
        title: 'XP & Badges',
        earnedXp: 0,
        totalXp: hero.xp,
        xpMessage: 'for completing this subtopic',
      },
      achievements: {
        title: 'Achievements',
        items: [
          { id: 'a1', title: `${title} Starter`, description: 'Review the core overview and notes', icon: 'Award', color: 'blue' },
          { id: 'a2', title: 'Practice Ready', description: 'Complete practice and quiz modules', icon: 'Award', color: 'red' },
        ],
      },
      weaknessAnalysis: {
        title: 'Weakness Analysis',
        score: 0,
        scoreLabel: 'Not started',
        items: [
          { id: 'w1', topic: title, status: 'Pending', color: 'amber' },
        ],
      },
      aiTutor: {
        title: `Ask ${brand.tutorLabel}`,
        subtitle: `Got doubts about ${title}?\nAsk our ${brand.tutorLabel} anytime.`,
        inputPlaceholder: 'Ask anything...',
        examples: ['Examples', 'Explain simply', 'Interview questions'],
      },
    },
  };
}

export async function loadTutorialData(brand: BrandConfig, subtopicId: string = 'component-architecture'): Promise<SubtopicViewData> {
  const resolvedSubtopicId = subtopicId || 'component-architecture';
  const apiData = await fetchTutorialSections(resolvedSubtopicId);
  return buildOverviewFromSections(brand, resolvedSubtopicId, apiData);
}
