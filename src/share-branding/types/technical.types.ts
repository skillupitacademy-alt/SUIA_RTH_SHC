export interface TechnicalSectionPattern {
  title: string;
  badge: string;
  intro: string;
  sections: Array<{
    id: string;
    title: string;
    content: string;
    diagram?: {
      type: 'anatomy' | 'flow' | 'chain';
      data: any;
    };
    code?: {
      language: string;
      code: string;
      output?: string;
    };
    keyPoints?: string[];
    steps?: { id: string; text: string }[];
    highlight?: string;
  }>;
}
