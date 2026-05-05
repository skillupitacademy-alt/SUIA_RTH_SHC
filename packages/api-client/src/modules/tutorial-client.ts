import { FetchClient, TIMEOUTS } from '@quiz/api-client/core/fetch-client';

export type TutorialDifficulty = 'simple' | 'mixed' | 'intermediate' | 'expert';
export type BlockType = 'notes' | 'layman' | 'real_life' | 'technical' | 'code' | 'ai_tutor';

export interface TutorialContent {
  id: string;
  subtopicId: string;
  brandId: string;
  difficulty: TutorialDifficulty;
  content: any;
  brandCustomizations?: any;
  progress?: {
    blocksCompleted: string[];
    completionPercent: number;
    assignmentUnlocked: boolean;
  };
}

export interface TutorialProgress {
  blocksCompleted: BlockType[];
  completionPercent: number;
  assignmentUnlocked: boolean;
}

export interface AssignmentState {
  id: string;
  status: 'not_started' | 'in_progress' | 'self_completed' | 'faculty_completed';
  difficulty: TutorialDifficulty;
  unlockedTiers: TutorialDifficulty[];
  currentTier?: TutorialDifficulty;
}

export interface ProjectSubmission {
  id: string;
  projectId: string;
  status: 'pending' | 'approved' | 'revision_requested';
  submittedAt: string;
  reviewedAt?: string;
  feedback?: string;
}

export interface LiveSessionRequest {
  id: string;
  topic: string;
  preferredDate: string;
  status: 'pending' | 'accepted' | 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
}

export interface RemediationPlan {
  examResultId: string;
  weakTopics: Array<{
    topicId: string;
    topicName: string;
    score: number;
    recommendedSubtopics: string[];
  }>;
  suggestedPath: string[];
}

/**
 * Tutorial Client
 * 
 * Provides typed interface to centralized Tutorial Engine API.
 * Follows the same pattern as QuizClient for consistency.
 * 
 * All methods call the centralized API server endpoints which
 * handle brand filtering and user context automatically.
 */
export class TutorialClient {
  private client: FetchClient;

  constructor(client: FetchClient) {
    this.client = client;
  }

  // ==================== CORE TUTORIAL CONTENT ====================

  /**
   * Get tutorial content for a subtopic
   * 
   * @param subtopicId - The subtopic ID
   * @param difficulty - Content difficulty level (default: 'simple')
   */
  async getContent(subtopicId: string, difficulty: TutorialDifficulty = 'simple') {
    return this.client.get<{ data: TutorialContent }>(
      `/tutorial/content/${subtopicId}?difficulty=${difficulty}`,
      { timeout: TIMEOUTS.STANDARD }
    );
  }

  /**
   * Get user progress for a subtopic
   * 
   * @param subtopicId - The subtopic ID
   */
  async getProgress(subtopicId: string) {
    return this.client.get<{ data: TutorialProgress }>(
      `/tutorial/progress?subtopicId=${subtopicId}`,
      { timeout: TIMEOUTS.QUICK }
    );
  }

  /**
   * Track progress by marking a block as viewed
   * 
   * @param subtopicId - The subtopic ID
   * @param blockType - The type of block viewed
   */
  async trackProgress(subtopicId: string, blockType: BlockType) {
    return this.client.post<
      { data: TutorialProgress },
      { subtopicId: string; blockType: BlockType; status: 'viewed' }
    >(
      '/tutorial/progress',
      { subtopicId, blockType, status: 'viewed' },
      { timeout: TIMEOUTS.STANDARD }
    );
  }

  // ==================== ASSIGNMENTS ====================

  /**
   * Get assignment state for a subtopic
   * 
   * @param subtopicId - The subtopic ID
   * @param difficulty - Assignment difficulty (default: 'simple')
   */
  async getAssignmentState(subtopicId: string, difficulty: TutorialDifficulty = 'simple') {
    return this.client.get<{ data: AssignmentState }>(
      `/tutorial/assignments/${subtopicId}?difficulty=${difficulty}`,
      { timeout: TIMEOUTS.STANDARD }
    );
  }

  /**
   * Start an assignment tier
   * 
   * @param subtopicId - The subtopic ID
   * @param difficulty - Assignment difficulty
   */
  async startAssignment(subtopicId: string, difficulty: TutorialDifficulty) {
    return this.client.post<
      { data: { id: string; status: string } },
      { difficulty: TutorialDifficulty }
    >(
      `/tutorial/assignments/${subtopicId}/start`,
      { difficulty },
      { timeout: TIMEOUTS.STANDARD }
    );
  }

  /**
   * Complete an assignment tier
   * 
   * @param subtopicId - The subtopic ID
   * @param difficulty - Assignment difficulty
   */
  async completeAssignment(subtopicId: string, difficulty: TutorialDifficulty) {
    return this.client.post<
      { data: { nextUnlockedTier: TutorialDifficulty | null } },
      { difficulty: TutorialDifficulty }
    >(
      `/tutorial/assignments/${subtopicId}/complete`,
      { difficulty },
      { timeout: TIMEOUTS.STANDARD }
    );
  }

  /**
   * Request help for an assignment
   * 
   * @param subtopicId - The subtopic ID
   * @param assignmentId - The assignment ID
   * @param question - The help question
   */
  async requestAssignmentHelp(subtopicId: string, assignmentId: string, question: string) {
    return this.client.post<
      { data: { id: string } },
      { subtopicId: string; assignmentId: string; question: string }
    >(
      '/tutorial/assignments/help',
      { subtopicId, assignmentId, question },
      { timeout: TIMEOUTS.STANDARD }
    );
  }

  // ==================== PROJECTS ====================

  /**
   * Get project details
   * 
   * @param projectId - The project ID
   */
  async getProject(projectId: string) {
    return this.client.get<{ data: any }>(
      `/tutorial/projects/${projectId}`,
      { timeout: TIMEOUTS.STANDARD }
    );
  }

  /**
   * Get user's project submissions
   */
  async getMySubmissions() {
    return this.client.get<{ data: ProjectSubmission[] }>(
      '/tutorial/projects/submissions',
      { timeout: TIMEOUTS.STANDARD }
    );
  }

  /**
   * Submit a project
   * 
   * @param projectId - The project ID
   * @param submissionData - The submission data (repo URL, description, etc.)
   */
  async submitProject(projectId: string, submissionData: {
    repositoryUrl: string;
    description: string;
    deploymentUrl?: string;
  }) {
    return this.client.post<
      { data: { id: string; status: string } },
      typeof submissionData & { projectId: string }
    >(
      '/tutorial/projects/submit',
      { projectId, ...submissionData },
      { timeout: TIMEOUTS.STANDARD }
    );
  }

  // ==================== LIVE SESSIONS ====================

  /**
   * Request a live session with faculty
   * 
   * @param topic - The topic for the session
   * @param preferredDate - Preferred date/time
   * @param description - Additional details
   */
  async requestLiveSession(topic: string, preferredDate: string, description?: string) {
    return this.client.post<
      { data: { id: string } },
      { topic: string; preferredDate: string; description?: string }
    >(
      '/tutorial/sessions/request',
      { topic, preferredDate, description },
      { timeout: TIMEOUTS.STANDARD }
    );
  }

  /**
   * Get user's session requests
   */
  async getMySessionRequests() {
    return this.client.get<{ data: LiveSessionRequest[] }>(
      '/tutorial/sessions/my-requests',
      { timeout: TIMEOUTS.STANDARD }
    );
  }

  /**
   * Cancel a session request
   * 
   * @param requestId - The session request ID
   */
  async cancelSessionRequest(requestId: string) {
    return this.client.delete<{ success: boolean }>(
      `/tutorial/sessions/${requestId}`,
      { timeout: TIMEOUTS.STANDARD }
    );
  }

  // ==================== REMEDIATION ====================

  /**
   * Get remediation plans for the user
   */
  async getRemediationPlans() {
    return this.client.get<{ data: RemediationPlan[] }>(
      '/tutorial/remediation',
      { timeout: TIMEOUTS.STANDARD }
    );
  }

  /**
   * Get specific remediation plan by exam result
   * 
   * @param examResultId - The exam result ID
   */
  async getRemediationPlan(examResultId: string) {
    return this.client.get<{ data: RemediationPlan }>(
      `/tutorial/remediation/${examResultId}`,
      { timeout: TIMEOUTS.STANDARD }
    );
  }
}
