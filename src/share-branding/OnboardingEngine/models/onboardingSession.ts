import {
  EDUCATION_LEVEL_OPTIONS,
  TIME_COMMITMENT_OPTIONS,
  GOAL_OPTIONS,
  DOMAIN_OPTIONS,
  SUB_DOMAIN_MAPPINGS
} from '../constants/fieldMappings';

export interface OnboardingData {
  fullName: string;
  educationLevel: string;
  status: 'student' | 'professional';
  primaryGoal: string;
  domain: string;
  subDomain?: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  timeCommitment: string;
}

export interface GoalCard {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface DomainCard {
  id: string;
  title: string;
  subDomains?: string[];
}

export const goalCards: GoalCard[] = [
  {
    id: 'learn-skills',
    title: 'Learn Skills',
    description: 'Gain practical knowledge, master new tools, and advance your career path.',
    icon: 'BookOpen'
  },
  {
    id: 'crack-exams',
    title: 'Crack Exams',
    description: 'Prepare effectively with practice tests, structured courses, and expert guidance.',
    icon: 'Award'
  },
  {
    id: 'get-job-ready',
    title: 'Get Job Ready',
    description: 'Build portfolio projects, master interviews, and land your dream role.',
    icon: 'Briefcase'
  },
  {
    id: 'switch-career',
    title: 'Switch Career',
    description: 'Transition smoothly with guided learning paths and industry-relevant skills.',
    icon: 'TrendingUp'
  }
];

export const domainCards: DomainCard[] = [
  {
    id: 'web-dev',
    title: 'Web Development',
    subDomains: SUB_DOMAIN_MAPPINGS['Web Development'] || ['React', 'Vue', 'Angular']
  },
  {
    id: 'data-science',
    title: 'Data Science',
    subDomains: SUB_DOMAIN_MAPPINGS['Data Science'] || ['Machine Learning', 'Data Analysis', 'Statistics']
  },
  {
    id: 'ai-ml',
    title: 'AI/ML',
    subDomains: SUB_DOMAIN_MAPPINGS['AI/ML'] || ['Natural Language Processing', 'Computer Vision', 'Deep Learning']
  },
  {
    id: 'mobile-dev',
    title: 'Mobile Development',
    subDomains: SUB_DOMAIN_MAPPINGS['Mobile Development'] || ['React Native', 'Flutter', 'iOS', 'Android']
  },
  {
    id: 'devops',
    title: 'DevOps',
    subDomains: SUB_DOMAIN_MAPPINGS['DevOps'] || ['CI/CD', 'Cloud', 'Containers', 'Kubernetes']
  },
  {
    id: 'cybersecurity',
    title: 'Cybersecurity',
    subDomains: SUB_DOMAIN_MAPPINGS['Cybersecurity'] || ['Ethical Hacking', 'Network Security', 'Cloud Security']
  }
];

// Use consistent options from field mappings
export const educationLevels = [...EDUCATION_LEVEL_OPTIONS];
export const timeCommitments = [...TIME_COMMITMENT_OPTIONS];
