export type SkillupProgram = {
  id: string;
  slug: string;
  name: string;
  duration: string;
  description: string;
  audience: string;
  summary: string;
  highlights: string[];
};

export type SkillupProgramCurriculumSection = {
  title: string;
  items: string[];
};

export type SkillupProgramDetail = SkillupProgram & {
  curriculum: SkillupProgramCurriculumSection[];
};

export type SkillupSession = {
  id: string;
  date: string;
  title: string;
  mode: 'online' | 'offline' | 'hybrid';
  status: 'completed' | 'upcoming' | 'cancelled';
  recording?: string;
};

export type SkillupInstallment = {
  id: string;
  label: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'due' | 'overdue';
  paymentRef?: string;
};

export type SkillupJobMatch = {
  id: string;
  company: string;
  title: string;
  location: string;
  match: number;
};

export type SkillupFacultyMember = {
  name: string;
  title: string;
  description: string;
};
