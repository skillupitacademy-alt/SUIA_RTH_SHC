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
    subDomains: ['React.js', 'Node.js', 'Next.js', 'Vue.js', 'Angular']
  },
  {
    id: 'data-science',
    title: 'Data Science',
    subDomains: ['Python', 'Machine Learning', 'Deep Learning', 'Statistics']
  },
  {
    id: 'ai-ml',
    title: 'AI/ML',
    subDomains: ['Natural Language Processing', 'Computer Vision', 'Reinforcement Learning']
  },
  {
    id: 'mobile-dev',
    title: 'Mobile Development',
    subDomains: ['React Native', 'Flutter', 'Swift', 'Kotlin']
  },
  {
    id: 'devops',
    title: 'DevOps',
    subDomains: ['Docker', 'Kubernetes', 'CI/CD', 'AWS', 'Azure']
  },
  {
    id: 'cybersecurity',
    title: 'Cybersecurity',
    subDomains: ['Ethical Hacking', 'Network Security', 'Cloud Security']
  }
];

export const educationLevels = [
  'High School',
  'Undergraduate',
  'Graduate',
  'Postgraduate',
  'Other'
];

export const timeCommitments = [
  '30 min/day',
  '1 hr/day',
  '2 hrs/day',
  'Weekends only'
];
