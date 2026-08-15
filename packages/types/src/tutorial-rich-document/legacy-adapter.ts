/**
 * Legacy Content Adapter - TYPE BOUNDARY ONLY
 * 
 * DO NOT IMPLEMENT YET
 * 
 * This file defines the interface for adapting legacy tutorial content
 * to the new rich document model. Implementation will come later.
 */

import { TutorialDocument } from './document';

/**
 * Legacy Notes Content (markdown-based)
 */
export type LegacyNotesContent = {
  markdown: string;
  image?: {
    type: 'svg_standard' | 'r2_custom';
    svgKey: string | null;
    url: string | null;
    alt: string;
    caption: string | null;
    position: 'right' | 'bottom' | 'inline';
    width: number;
  };
};

/**
 * Legacy Code Content
 */
export type LegacyCodeContent = {
  language: 'javascript' | 'typescript' | 'python' | 'sql' | 'scala' | 'java' | 'bash';
  intro: string;
  code: string;
  steps: string[];
  image?: LegacyNotesContent['image'];
};

/**
 * Legacy Layman Content
 */
export type LegacyLaymanContent = {
  simpleExplanation: string;
  analogyOrStory: string;
  example1: { company: string; content: string };
  example2: { company: string; content: string };
  image?: LegacyNotesContent['image'];
};

/**
 * Legacy Real Life Content
 */
export type LegacyRealLifeContent = {
  title: string;
  scenario: string;
  bullets: Array<{ label: string; detail: string }>;
  tip: string;
  image?: LegacyNotesContent['image'];
};

/**
 * Legacy Technical Content
 */
export type LegacyTechnicalContent = {
  markdown: string;
  bullets: Array<{ term: string; detail: string }>;
  tip: string;
  image?: LegacyNotesContent['image'];
};

/**
 * Legacy AI Tutor Content
 */
export type LegacyAITutorContent = {
  greeting: string;
  qa_pairs: Array<{ question: string; answer: string }>;
};

/**
 * Union of all legacy content types
 */
export type LegacyContent =
  | LegacyNotesContent
  | LegacyCodeContent
  | LegacyLaymanContent
  | LegacyRealLifeContent
  | LegacyTechnicalContent
  | LegacyAITutorContent;

/**
 * Legacy Content Adapter Interface
 * 
 * DO NOT IMPLEMENT YET - This is a design boundary only
 */
export interface LegacyContentAdapter {
  /**
   * Check if content can be adapted
   */
  canAdapt(content: unknown): boolean;

  /**
   * Convert legacy content to rich document
   * 
   * IMPLEMENTATION PENDING
   */
  toRichDocument(content: LegacyContent): TutorialDocument;

  /**
   * Convert rich document back to legacy format (if needed)
   * 
   * IMPLEMENTATION PENDING
   */
  toLegacyContent?(document: TutorialDocument): LegacyContent;
}

/**
 * Placeholder for future adapter implementation
 */
export class LegacyContentAdapterImpl implements LegacyContentAdapter {
  canAdapt(content: unknown): boolean {
    throw new Error('LegacyContentAdapter not implemented yet');
  }

  toRichDocument(content: LegacyContent): TutorialDocument {
    throw new Error('LegacyContentAdapter.toRichDocument not implemented yet');
  }

  toLegacyContent(document: TutorialDocument): LegacyContent {
    throw new Error('LegacyContentAdapter.toLegacyContent not implemented yet');
  }
}
