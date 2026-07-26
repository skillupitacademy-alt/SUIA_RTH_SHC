/**
 * API-Based Data Loading for Tutorial System
 * 
 * This replaces static file reads with database API calls
 * Fetches content from /api/tutorial/sections/:subtopicId
 */

import { BrandConfig } from './brandConfig';
import { SubtopicNotesViewData } from './subtopicNotesData';
import {
  calculateTutorialProgress,
  formatTutorialSectionValidationIssues,
  type TutorialMasterySectionId,
  type ValidatedTutorialSection,
  validateTutorialSection,
} from '@quiz/validation';

type JsonRecord = Record<string, any>;
type LoadedSection<TSection extends TutorialMasterySectionId> = {
  data?: ValidatedTutorialSection<TSection>;
  error?: string;
};

function firstText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value;
    }
  }
  return '';
}

function strictSectionError(sectionType: TutorialMasterySectionId, detail: string): string {
  return `This tutorial section failed schema validation and must be regenerated. Section: ${sectionType}. ${detail}`;
}

function loadStrictSection<TSection extends TutorialMasterySectionId>(
  sections: Record<string, unknown>,
  sectionType: TSection
): LoadedSection<TSection> {
  if (!Object.prototype.hasOwnProperty.call(sections, sectionType)) {
    return { error: strictSectionError(sectionType, 'Missing required DB section.') };
  }

  const rawSection = sections[sectionType];
  const validation = validateTutorialSection(sectionType, rawSection);
  if (!validation.success) {
    return { error: strictSectionError(sectionType, formatTutorialSectionValidationIssues(validation.issues)) };
  }

  return { data: validation.data };
}

/**
 * Load subtopic data from database via API
 * 
 * @param brand - Brand configuration
 * @param subtopicId - Subtopic slug (e.g., 'component-architecture')
 * @param apiBaseUrl - API base URL (default: current origin)
 * @returns Promise<SubtopicNotesViewData>
 */
export function buildSubtopicNotesDataFromSectionsResponse(
  brand: BrandConfig,
  subtopicId: string,
  data: { subtopicName?: string; sectionMeta?: Record<string, JsonRecord>; sections?: Record<string, unknown> }
): SubtopicNotesViewData {
  const sections = data.sections || {};
  const sectionMeta = data.sectionMeta || {};
  const sectionRecordIds = Object.fromEntries(
    Object.entries(sectionMeta as Record<string, JsonRecord>)
      .filter(([, meta]) => typeof meta?.id === 'string')
      .map(([sectionType, meta]) => [sectionType, meta.id as string])
  );
  const subtopicName = data.subtopicName || subtopicId;

  const subtopicInfo = {
    title: subtopicName,
    description: `Learn about ${subtopicName}`,
    level: 'Intermediate',
    topic: 'Programming Concepts'
  };

  const loadedSections = {
    notes: loadStrictSection(sections, 'notes'),
    layman: loadStrictSection(sections, 'layman'),
    real_life: loadStrictSection(sections, 'real_life'),
    technical: loadStrictSection(sections, 'technical'),
    code: loadStrictSection(sections, 'code'),
    visual: loadStrictSection(sections, 'visual'),
    practice: loadStrictSection(sections, 'practice'),
    assignment: loadStrictSection(sections, 'assignment'),
    project: loadStrictSection(sections, 'project'),
    quiz: loadStrictSection(sections, 'quiz'),
    summary: loadStrictSection(sections, 'summary'),
    interview: loadStrictSection(sections, 'interview'),
    ai_tutor: loadStrictSection(sections, 'ai_tutor'),
  };
  const sectionErrors = Object.fromEntries(
    Object.entries(loadedSections)
      .filter((entry): entry is [TutorialMasterySectionId, { error: string }] => typeof entry[1].error === 'string')
      .map(([sectionType, result]) => [sectionType, result.error])
  );

  const notesContent = loadedSections.notes.data;
  const laymanContent = loadedSections.layman.data;
  const visualContent = loadedSections.visual.data;
  const realLifeContent = loadedSections.real_life.data;
  const technicalContent = loadedSections.technical.data;
  const codeContent = loadedSections.code.data;
  const practiceContent = loadedSections.practice.data;
  const assignmentContent = loadedSections.assignment.data;
  const projectContent = loadedSections.project.data;
  const quizContent = loadedSections.quiz.data;
  const summaryContent = loadedSections.summary.data;
  const interviewContent = loadedSections.interview.data;
  const aiTutorContent = loadedSections.ai_tutor.data;
  const progressSnapshot = calculateTutorialProgress({ completedSections: [] });

  return {
    sectionErrors,
    sectionRecordIds,
    nav: {
      courseLabel: 'Course',
      lessonLabel: 'Lesson',
      dashboardCtaLabel: 'Dashboard',
      streak: 7,
      xpPoints: 2450,
      learnerInitials: 'JD'
    },
    leftSidebar: {
      title: 'Learning Path',
      items: [
        { id: 'overview', label: 'Overview', status: 'completed', icon: 'LayoutDashboard' },
        { id: 'notes', label: 'Full Notes', status: 'active', icon: 'FileText' },
        { id: 'layman', label: 'Layman Explanation', status: 'pending', icon: 'Lightbulb' },
        { id: 'real-life', label: 'Real Life Examples', status: 'pending', icon: 'Globe' },
        { id: 'technical-deep-dive', label: 'Technical Deep Dive', status: 'pending', icon: 'Palette' },
        { id: 'code-example', label: 'Code Example', status: 'pending', icon: 'Monitor' },
        { id: 'visual-explanation', label: 'Visual Explanation', status: 'pending', icon: 'Eye' },
        { id: 'practice-test', label: 'Practice Test', status: 'pending', icon: 'Pencil' },
        { id: 'assignments', label: 'Assignments', status: 'pending', icon: 'ClipboardList' },
        { id: 'project', label: 'Projects', status: 'pending', icon: 'Rocket' },
        { id: 'quiz', label: 'Quiz', status: 'pending', icon: 'HelpCircle' },
        { id: 'summary', label: 'Summary', status: 'pending', icon: 'FileCheck' },
        { id: 'interview', label: 'Interview Prep', status: 'pending', icon: 'MessagesSquare' },
        { id: 'ai-tutor', label: brand.tutorLabel || 'AI Tutor', status: 'pending', icon: 'Bot' },
        { id: 'progress', label: 'Progress', status: 'pending', icon: 'TrendingUp' }
      ],
      progress: {
        percentage: progressSnapshot.completionPercent,
        message: `${progressSnapshot.completionPercent}% Complete`
      }
    },
    mainContent: {
      breadcrumbs: ['Home', subtopicInfo.topic, 'Components', subtopicInfo.title],
      title: subtopicInfo.title,
      meta: {
        readTime: '10 min read',
        level: subtopicInfo.level,
        xp: 50
      },
      simpleWords: notesContent?.concept_card?.heroSubtitle ?? '',
      definitionBlock: notesContent?.definition_block,
      sections: notesContent?.concept_card ? [notesContent.concept_card] : [],
      componentGrid: notesContent?.component_grid,
      examplePanel: notesContent?.example_panel,
      practiceCard: notesContent?.practice_card,
      warningFaq: notesContent?.warning_faq,
      summaryCard: notesContent?.summary_card,
      syntaxBlock: notesContent?.syntax_block,

      laymanExplanation: laymanContent,
      realLifeExamples: realLifeContent,
      technicalDeepDive: technicalContent,
      codeExample: codeContent,

      // Keep existing full Visual Explanation tab as-is.
      visualExplanation: visualContent,

      practiceTest: practiceContent,
      assignment: assignmentContent,
      project: projectContent,
      quiz: quizContent,
      summary: summaryContent,
      interview: interviewContent,
      aiTutorContent
    } as any,
    rightSidebar: {
      aiTutor: {
        title: `${brand.tutorLabel || 'Tutor'} (Ask Anything)`,
        messages: (aiTutorContent?.qaPairs ?? []).slice(0, 3).flatMap((pair) => [
          { text: firstText(pair.question), time: '2:30 PM', sender: 'user' as const },
          { text: firstText(pair.answer), time: '2:31 PM', sender: 'bot' as const }
        ]),
        inputPlaceholder: 'Ask a follow-up...'
      },
      courseProgress: {
        percentage: progressSnapshot.completionPercent,
        courseName: subtopicInfo.topic,
        label: `${progressSnapshot.completionPercent}% Completed`
      },
      xpStats: {
        earned: 50,
        total: 2450
      },
      relatedSubtopics: [
      ],
      laymanSidebar: {
        quickSummary: notesContent?.summary_card?.keyTakeaways ?? [],
        keyTerms: [],
        readingTime: '',
        thinkAboutIt: ''
      },
      deepDiveSidebar: {
        onThisPage: [
          { id: 'anatomy', label: 'Component Anatomy' },
          { id: 'reconciliation', label: 'Reconciliation' },
          { id: 'resolution', label: 'Component Resolution' }
        ],
        quickLinks: [
          { id: 'ql1', label: 'Documentation', icon: 'ExternalLink' },
          { id: 'ql2', label: 'Best Practices', icon: 'BookOpen' },
          { id: 'ql3', label: 'Code Examples', icon: 'Code2' }
        ]
      }
    }
  };
}

export async function loadSubtopicNotesDataFromAPI(
  brand: BrandConfig,
  subtopicId: string = 'component-architecture',
  apiBaseUrl?: string
): Promise<SubtopicNotesViewData> {
  if (!subtopicId) {
    subtopicId = 'component-architecture';
  }

  const baseUrl = apiBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const apiUrl = `${baseUrl}/api/tutorial/sections/${subtopicId}`;

  try {
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('[loadSubtopicNotesDataFromAPI] API Error:', {
        status: response.status,
        statusText: response.statusText,
        url: apiUrl,
        error: errorData
      });
      throw new Error(`Failed to fetch content: ${response.statusText} (${response.status}). ${errorData.error || ''}`);
    }

    const data = await response.json();
    return buildSubtopicNotesDataFromSectionsResponse(brand, subtopicId, data);
  } catch (error) {
    console.error('[loadSubtopicNotesDataFromAPI] Error:', error);
    throw new Error(`Failed to load content for subtopic: ${subtopicId}. ${error}`);
  }
}

/**
 * Helper function to submit quiz answer
 */
export async function submitQuizAnswer(
  _userId: string,
  sectionId: string,
  questionId: string,
  selectedAnswer: string,
  correctAnswer: string,
  timeSpent: number = 0
) {
  const response = await fetch('/api/tutorial/interactions/quiz', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sectionId,
      questionId,
      selectedAnswer,
      correctAnswer,
      timeSpent
    })
  });

  if (!response.ok) {
    throw new Error('Failed to submit quiz answer');
  }

  return response.json();
}

/**
 * Helper function to submit practice test answer
 */
export async function submitPracticeAnswer(
  _userId: string,
  sectionId: string,
  questionId: string,
  selectedAnswer: string,
  correctAnswer: string,
  timeSpent: number = 0,
  feedbackViewed: boolean = false
) {
  const response = await fetch('/api/tutorial/interactions/practice', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sectionId,
      questionId,
      selectedAnswer,
      correctAnswer,
      timeSpent,
      feedbackViewed
    })
  });

  if (!response.ok) {
    throw new Error('Failed to submit practice answer');
  }

  return response.json();
}

/**
 * Helper function to track code interaction
 */
export async function trackCodeInteraction(
  _userId: string,
  sectionId: string,
  codeExampleId: string,
  userCode: string,
  executed: boolean = false,
  executionResult?: { success: boolean; output?: string; error?: string },
  timeSpent: number = 0
) {
  const response = await fetch('/api/tutorial/interactions/code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sectionId,
      codeExampleId,
      userCode,
      executed,
      executionResult,
      timeSpent
    })
  });

  if (!response.ok) {
    throw new Error('Failed to track code interaction');
  }

  return response.json();
}

/**
 * Helper function to track visual interaction
 */
export async function trackVisualInteraction(
  _userId: string,
  sectionId: string,
  componentId: string,
  interactionType: 'view' | 'expand' | 'navigate' | 'interact',
  interactionData?: any,
  timeSpent: number = 0
) {
  const response = await fetch('/api/tutorial/interactions/visual', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sectionId,
      componentId,
      interactionType,
      interactionData,
      timeSpent
    })
  });

  if (!response.ok) {
    throw new Error('Failed to track visual interaction');
  }

  return response.json();
}

/**
 * Helper function to mark section as completed
 */
export async function markSectionComplete(
  _userId: string,
  sectionId: string,
  subsectionId?: string,
  timeSpent: number = 0,
  score?: number
) {
  const response = await fetch('/api/tutorial/interactions/completion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sectionId,
      subsectionId,
      timeSpent,
      score
    })
  });

  if (!response.ok) {
    throw new Error('Failed to mark section as complete');
  }

  return response.json();
}
