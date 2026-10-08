/**
 * TUTORIAL SYSTEM API ENDPOINTS
 * 
 * Complete API documentation for the tutorial system
 * All endpoints are in the API server (centralized)
 */

export const TUTORIAL_API_ENDPOINTS = {
  
  // ========================================
  // SECTION CONTENT APIs
  // ========================================
  
  /**
   * GET /api/tutorial/sections/:subtopicId
   * 
   * Get all sections for a subtopic from database
   * 
   * Query Parameters:
   * - sectionType (optional): Specific section type (overview, notes, layman, visual, etc.)
   * - difficulty (optional): Difficulty level (default: 'simple')
   * 
   * Response:
   * {
   *   subtopicId: string,
   *   subtopicName: string,
   *   difficulty: string,
   *   sections: {
   *     overview: {...},
   *     notes: {...},
   *     layman: {...},
   *     visual: {...},
   *     // ... all section types
   *   },
   *   totalSections: number
   * }
   */
  GET_SECTIONS: '/api/tutorial/sections/:subtopicId',
  
  /**
   * GET /api/tutorial/sections/:subtopicId?sectionType=visual
   * 
   * Get specific section type for a subtopic
   * 
   * Response:
   * {
   *   subtopicId: string,
   *   sectionType: string,
   *   difficulty: string,
   *   content: {...},
   *   version: number,
   *   language: string
   * }
   */
  GET_SPECIFIC_SECTION: '/api/tutorial/sections/:subtopicId?sectionType=:type',
  
  // ========================================
  // USER INTERACTION APIs
  // ========================================
  
  /**
   * POST /api/tutorial/interactions/quiz
   * 
   * Submit quiz answer
   * 
   * Body:
   * {
   *   userId: string,
   *   sectionId: string,
   *   questionId: string,
   *   selectedAnswer: string,
   *   correctAnswer: string,
   *   timeSpent: number (seconds)
   * }
   * 
   * Response:
   * {
   *   success: boolean,
   *   answerId: string,
   *   isCorrect: boolean,
   *   attemptNumber: number,
   *   message: string
   * }
   */
  SUBMIT_QUIZ_ANSWER: '/api/tutorial/interactions/quiz',
  
  /**
   * GET /api/tutorial/interactions/quiz?userId=xxx&sectionId=xxx
   * 
   * Get user's quiz answers and statistics
   * 
   * Response:
   * {
   *   answers: [...],
   *   statistics: {
   *     totalQuestions: number,
   *     correctAnswers: number,
   *     totalAttempts: number,
   *     score: number
   *   }
   * }
   */
  GET_QUIZ_ANSWERS: '/api/tutorial/interactions/quiz',
  
  /**
   * POST /api/tutorial/interactions/practice
   * 
   * Submit practice test answer
   * 
   * Body:
   * {
   *   userId: string,
   *   sectionId: string,
   *   questionId: string,
   *   selectedAnswer: string,
   *   correctAnswer: string,
   *   timeSpent: number,
   *   feedbackViewed: boolean
   * }
   * 
   * Response:
   * {
   *   success: boolean,
   *   answerId: string,
   *   isCorrect: boolean,
   *   attemptNumber: number,
   *   message: string
   * }
   */
  SUBMIT_PRACTICE_ANSWER: '/api/tutorial/interactions/practice',
  
  /**
   * GET /api/tutorial/interactions/practice?userId=xxx&sectionId=xxx
   * 
   * Get user's practice test answers and statistics
   */
  GET_PRACTICE_ANSWERS: '/api/tutorial/interactions/practice',
  
  /**
   * POST /api/tutorial/interactions/code
   * 
   * Track code example interaction
   * 
   * Body:
   * {
   *   userId: string,
   *   sectionId: string,
   *   codeExampleId: string,
   *   userCode: string,
   *   executed: boolean,
   *   executionResult: { success: boolean, output?: string, error?: string },
   *   timeSpent: number
   * }
   * 
   * Response:
   * {
   *   success: boolean,
   *   interactionId: string,
   *   message: string
   * }
   */
  TRACK_CODE_INTERACTION: '/api/tutorial/interactions/code',
  
  /**
   * GET /api/tutorial/interactions/code?userId=xxx&sectionId=xxx&codeExampleId=xxx
   * 
   * Get user's code interactions
   */
  GET_CODE_INTERACTIONS: '/api/tutorial/interactions/code',
  
  /**
   * POST /api/tutorial/interactions/visual
   * 
   * Track visual explanation interaction
   * 
   * Body:
   * {
   *   userId: string,
   *   sectionId: string,
   *   componentId: string,
   *   interactionType: 'view' | 'expand' | 'navigate' | 'interact',
   *   interactionData: {...},
   *   timeSpent: number
   * }
   * 
   * Response:
   * {
   *   success: boolean,
   *   interactionId: string,
   *   message: string
   * }
   */
  TRACK_VISUAL_INTERACTION: '/api/tutorial/interactions/visual',
  
  /**
   * GET /api/tutorial/interactions/visual?userId=xxx&sectionId=xxx&componentId=xxx
   * 
   * Get user's visual interactions
   */
  GET_VISUAL_INTERACTIONS: '/api/tutorial/interactions/visual',
  
  /**
   * POST /api/tutorial/interactions/completion
   * 
   * Mark section/subsection as completed
   * 
   * Body:
   * {
   *   userId: string,
   *   sectionId: string,
   *   subsectionId: string (optional),
   *   timeSpent: number,
   *   score: number (optional)
   * }
   * 
   * Response:
   * {
   *   success: boolean,
   *   completionId: string,
   *   message: string,
   *   alreadyCompleted: boolean
   * }
   */
  MARK_SECTION_COMPLETE: '/api/tutorial/interactions/completion',
  
  /**
   * GET /api/tutorial/interactions/completion?userId=xxx&sectionId=xxx
   * 
   * Get section completion status
   */
  GET_COMPLETION_STATUS: '/api/tutorial/interactions/completion',
  
} as const;

/**
 * USAGE EXAMPLES
 */

// Example 1: Get all sections for a subtopic
// GET /api/tutorial/sections/component-architecture

// Example 2: Get only visual section
// GET /api/tutorial/sections/component-architecture?sectionType=visual

// Example 3: Submit quiz answer
// POST /api/tutorial/interactions/quiz
// Body: { userId: "xxx", sectionId: "yyy", questionId: "q1", selectedAnswer: "A", correctAnswer: "A", timeSpent: 30 }

// Example 4: Track code execution
// POST /api/tutorial/interactions/code
// Body: { userId: "xxx", sectionId: "yyy", codeExampleId: "ex1", userCode: "console.log('hello')", executed: true, executionResult: { success: true, output: "hello" } }

// Example 5: Mark section as completed
// POST /api/tutorial/interactions/completion
// Body: { userId: "xxx", sectionId: "yyy", timeSpent: 300, score: 85 }
