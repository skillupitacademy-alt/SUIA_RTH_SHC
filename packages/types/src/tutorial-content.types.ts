// This file contains legacy types and shared interfaces.
// The main TutorialContentJSON type is now derived from Zod in tutorial-content.schema.ts

import { TutorialContentJSON } from './tutorial-content.schema';

// Do NOT export TutorialContentJSON from here to avoid conflict with schema.ts export

export type ContentBlockType = keyof TutorialContentJSON;

export type LaymanContent = TutorialContentJSON['layman'];
export type RealLifeContent = TutorialContentJSON['real_life'];
export type TechnicalContent = TutorialContentJSON['technical'];
export type CodeContent = TutorialContentJSON['code'];
export type AITutorContent = TutorialContentJSON['ai_tutor'];
export type NotesContent = TutorialContentJSON['notes'];

export type TutorialContentAuditAction =
  | 'created'
  | 'updated'
  | 'published'
  | 'unpublished'
  | 'restored';

export interface TutorialContentVersionRecord {
  id: string;
  contentId: string;
  version: number;
  content: TutorialContentJSON;
  savedBy: string;
  createdAt: Date;
}

export interface TutorialContentVersionCreateInput {
  contentId: string;
  version: number;
  content: TutorialContentJSON;
  savedBy: string;
}

export interface TutorialContentAuditRecord {
  id: string;
  contentId: string;
  userId: string;
  action: TutorialContentAuditAction;
  diff: Record<string, unknown> | null;
  createdAt: Date;
}

export interface TutorialContentAuditCreateInput {
  contentId: string;
  userId: string;
  action: TutorialContentAuditAction;
  diff?: Record<string, unknown> | null;
}
