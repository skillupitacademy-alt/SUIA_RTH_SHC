export interface AssignmentSectionPattern {
  title: string;
  description: string;
  xp: number;
  duration: string;
  task: {
    title: string;
    description: string;
    requirements: string[];
  };
  objectives: string[];
  starterCode: string;
  submissionGuidelines: string[];
}
