export interface ContentImage {
  type: 'svg_standard' | 'r2_custom';
  svgKey: string | null;
  url: string | null;
  alt: string;
  caption: string | null;
  position: 'right' | 'bottom' | 'inline';
  width: number;
}

export interface TutorialContentJSON {
  notes: {
    markdown: string;
    image?: ContentImage | null;
  };
  layman: {
    simpleExplanation: string;
    analogyOrStory: string;
    example1: { company: string; content: string };
    example2: { company: string; content: string };
    image?: ContentImage | null;
  };
  real_life: {
    title: string;
    scenario: string;
    bullets: Array<{ label: string; detail: string }>;
    tip: string;
    image?: ContentImage | null;
  };
  technical: {
    markdown: string;
    bullets: Array<{ term: string; detail: string }>;
    tip: string;
    image?: ContentImage | null;
  };
  code: {
    language: 'javascript' | 'typescript' | 'python' | 'sql' | 'scala' | 'java' | 'bash';
    intro: string;
    code: string;
    steps: string[];
    image?: ContentImage | null;
  };
  ai_tutor: {
    greeting: string;
    qa_pairs: Array<{ question: string; answer: string }>;
  };
}

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
