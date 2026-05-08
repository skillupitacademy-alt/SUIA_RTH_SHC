/**
 * Tutorial Engine Module
 * 
 * Centralized tutorial orchestration following the same pattern as exam-engine.
 * Provides shared resources with brand-specific customizations.
 * 
 * @module tutorial-engine
 */

export type {
  BlockType,
  TutorialBrand,
  TutorialContent,
  TutorialContentOptions,
  TutorialProgressOptions} from './tutorial.engine';
export { TutorialEngine } from './tutorial.engine';
export type {
  GetContentRequest,
  ServiceResponse,
  TrackProgressRequest} from './tutorial.service';
export { TutorialService } from './tutorial.service';
export type { TutorialDifficulty } from '@quiz/types';
