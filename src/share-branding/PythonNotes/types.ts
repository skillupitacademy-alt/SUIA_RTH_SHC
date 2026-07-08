export type Section = 
  | { type: 'heading2'; content: string }
  | { type: 'heading3'; content: string }
  | { type: 'paragraph'; content: string }
  | { type: 'code'; content: string; language?: string; output?: string }
  | { type: 'info-box'; title: string; content: string }
  | { type: 'warning-box'; title: string; content: string }
  | { type: 'interview-tip'; content: string }
  | { type: 'best-practice'; content: string }
  | { type: 'ascii-diagram'; title?: string; content: string };

export interface Chapter {
  id: string;
  title: string;
  sections: Section[];
}
