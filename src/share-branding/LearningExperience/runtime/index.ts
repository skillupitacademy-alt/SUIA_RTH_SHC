/**
 * Tutorial V2 Runtime Foundation
 *
 * Universal learner-side runtime context and services.
 *
 * IMPORTANT:
 * - This is SEPARATE from authoring-side (TutorialPromptContext)
 * - This is SEPARATE from block content schemas (D1/C1/S1)
 * - This provides universal capabilities for all blocks
 */

export type {
  TutorialRuntimeContext,
  TutorialBlockRuntimeContext,
  TutorialTrackingEvent,
  TutorialProgressState,
  TutorialPageLoadingState,
} from './TutorialRuntimeContext';

export {
  trackTutorialEvent,
  getTutorialProgress,
  markBlockComplete,
  calculatePageProgress,
} from './tutorialTrackingService';

export {
  resolveRuntimeContext,
  extractLearnerIdFromHeaders,
} from './tutorialRuntimeResolver';

export type {
  ResolveRuntimeContextParams,
  ResolveRuntimeContextResult,
} from './tutorialRuntimeResolver';

export {
  getOrCreateTutorialLearningSessionId,
  readTutorialLearningSessionId,
  generateSessionId,
  isValidSessionId,
  TUTORIAL_LEARNING_SESSION_KEY,
} from './tutorialSessionService';
