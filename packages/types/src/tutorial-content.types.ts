export interface TutorialContentJSON {
  notes: {
    markdown: string;
  };
  layman: {
    simpleExplanation: string;
    analogyOrStory: string;
    example1: { company: string; content: string };
    example2: { company: string; content: string };
  };
  real_life: {
    title: string;
    scenario: string;
    bullets: Array<{ label: string; detail: string }>;
    tip: string;
  };
  technical: {
    markdown: string;
    bullets: Array<{ term: string; detail: string }>;
    tip: string;
  };
  code: {
    language: 'javascript' | 'typescript' | 'python' | 'sql' | 'scala' | 'java' | 'bash';
    intro: string;
    code: string;
    steps: string[];
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
