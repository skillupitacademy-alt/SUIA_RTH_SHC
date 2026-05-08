/**
 * API-Based Data Loading for Tutorial System
 * 
 * This replaces static file reads with database API calls
 * Fetches content from /api/tutorial/sections/:subtopicId
 */

import { BrandConfig } from './brandConfig';
import { SubtopicNotesViewData } from './subtopicNotesData';

/**
 * Load subtopic data from database via API
 * 
 * @param brand - Brand configuration
 * @param subtopicId - Subtopic slug (e.g., 'component-architecture')
 * @param apiBaseUrl - API base URL (default: current origin)
 * @returns Promise<SubtopicNotesViewData>
 */
export async function loadSubtopicNotesDataFromAPI(
  brand: BrandConfig,
  subtopicId: string = 'component-architecture',
  apiBaseUrl?: string
): Promise<SubtopicNotesViewData> {
  
  // Safety check for undefined subtopicId
  if (!subtopicId) {
    subtopicId = 'component-architecture';
  }

  // Determine API URL
  const baseUrl = apiBaseUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const apiUrl = `${baseUrl}/api/tutorial/sections/${subtopicId}`;

  try {
    // Fetch all sections for the subtopic from database
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include cookies for authentication (required for protected routes)
      cache: 'no-store' // Always get fresh data
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
    
    // Extract sections from API response
    const sections = data.sections || {};
    const subtopicName = data.subtopicName || subtopicId;
    
    // Map of subtopic metadata (can be enhanced with API data later)
    const subtopicInfo = {
      title: subtopicName,
      description: `Learn about ${subtopicName}`,
      level: 'Intermediate',
      topic: 'Programming Concepts'
    };

    // Get content from API response
    const notesContent = sections.notes || {};
    const laymanContent = sections.layman || {};
    const visualContent = sections.visual || {};
    const realLifeContent = sections.real_life || {};
    const technicalContent = sections.technical || {};
    const codeContent = sections.code || {};
    const practiceContent = sections.practice || {};
    const assignmentContent = sections.assignment || {};
    const projectContent = sections.project || {};
    const quizContent = sections.quiz || {};

    return {
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
          { id: 'ai-tutor', label: brand.tutorLabel || 'AI Tutor', status: 'pending', icon: 'Bot' },
          { id: 'progress', label: 'Progress', status: 'pending', icon: 'TrendingUp' }
        ],
        progress: {
          percentage: 65,
          message: '65% Complete'
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
        simpleWords: notesContent.simpleWords || '',
        definitionBlock: notesContent.definitionBlock,
        sections: notesContent.sections || [],
        componentGrid: notesContent.componentGrid,
        examplePanel: notesContent.examplePanel,
        practiceCard: notesContent.practiceCard,
        warningFaq: notesContent.warningFaq,
        summaryCard: notesContent.summaryCard,
        ...(laymanContent && Object.keys(laymanContent).length > 0 && { laymanExplanation: laymanContent }),
        ...(realLifeContent && Object.keys(realLifeContent).length > 0 && { realLifeExamples: realLifeContent }),
        ...(technicalContent && Object.keys(technicalContent).length > 0 && { technicalDeepDive: technicalContent }),
        ...(codeContent && Object.keys(codeContent).length > 0 && { codeExample: codeContent }),
        ...(visualContent && Object.keys(visualContent).length > 0 && { visualExplanation: visualContent }),
        ...(practiceContent && Object.keys(practiceContent).length > 0 && { practiceTest: practiceContent }),
        ...(assignmentContent && Object.keys(assignmentContent).length > 0 && { assignment: assignmentContent }),
        ...(projectContent && Object.keys(projectContent).length > 0 && { project: projectContent }),
        ...(quizContent && Object.keys(quizContent).length > 0 && { quiz: quizContent })
      },
      rightSidebar: {
        aiTutor: {
          title: `${brand.tutorLabel || 'Tutor'} (Ask Anything)`,
          messages: [
            { text: `What is ${subtopicInfo.title.toLowerCase()}?`, time: '2:30 PM', sender: 'user' },
            { text: `${notesContent.simpleWords?.substring(0, 100) || 'Let me explain'}... Would you like to see an example?`, time: '2:30 PM', sender: 'bot' }
          ],
          inputPlaceholder: 'Ask a follow-up...'
        },
        courseProgress: {
          percentage: 65,
          courseName: subtopicInfo.topic,
          label: '65% Completed'
        },
        xpStats: {
          earned: 50,
          total: 2450
        },
        relatedSubtopics: [
          { id: 'rs1', title: 'Props and State', status: 'next' },
          { id: 'rs2', title: 'Component Lifecycle', status: 'default' },
          { id: 'rs3', title: 'Hooks API', status: 'default' }
        ],
        laymanSidebar: {
          quickSummary: laymanContent?.simpleOverview?.quickSummary || [
            'Learn the basics',
            'Understand core concepts',
            'Apply in real projects'
          ],
          keyTerms: [
            { term: 'Component', definition: 'A reusable building block' },
            { term: 'Props', definition: 'Data passed into a component' },
            { term: 'State', definition: 'Internal data of a component' }
          ],
          readingTime: '5 - 7 minutes',
          thinkAboutIt: "Think about how you can apply these concepts in your own projects!"
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
    
  } catch (error) {
    console.error('[loadSubtopicNotesDataFromAPI] Error:', error);
    throw new Error(`Failed to load content for subtopic: ${subtopicId}. ${error}`);
  }
}

/**
 * Helper function to submit quiz answer
 */
export async function submitQuizAnswer(
  userId: string,
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
      userId,
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
  userId: string,
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
      userId,
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
  userId: string,
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
      userId,
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
  userId: string,
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
      userId,
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
  userId: string,
  sectionId: string,
  subsectionId?: string,
  timeSpent: number = 0,
  score?: number
) {
  const response = await fetch('/api/tutorial/interactions/completion', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
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
