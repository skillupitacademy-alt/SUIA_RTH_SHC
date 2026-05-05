/**
 * Tutorial Engine Module
 * 
 * Centralized tutorial orchestration following the same pattern as exam-engine.
 * Provides shared resources with brand-specific customizations.
 * 
 * @module tutorial-engine
 */

export { TutorialEngine } from './tutorial.engine';
export { TutorialService } from './tutorial.service';

export type {
  TutorialBrand,
  BlockType,
  TutorialContentOptions,
  TutorialProgressOptions,
  TutorialContent
} from './tutorial.engine';

export type { TutorialDifficulty } from '@quiz/types';

export type {
  GetContentRequest,
  TrackProgressRequest,
  ServiceResponse
} from './tutorial.service';
