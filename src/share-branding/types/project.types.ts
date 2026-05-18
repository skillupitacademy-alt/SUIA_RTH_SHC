export interface ProjectSectionPattern {
  title: string;
  description: string;
  xp: number;
  deadline: string;
  hero: {
    badge: string;
    title: string;
    description: string;
    image: string;
  };
  realWorldUse: string;
  skills: string[];
  buildItems: string[];
  deliverables: string[];
}
