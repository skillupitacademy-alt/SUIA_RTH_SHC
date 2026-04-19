/**
 * 🔄 FIELD MAPPINGS
 * 
 * Centralized mapping between database values and UI display values.
 * This ensures consistency across the entire application.
 */

// Education Level Mappings
export const EDUCATION_LEVEL_MAPPINGS = {
  // Database values -> UI display values
  'bachelors': "Bachelor's Degree",
  'bachelor': "Bachelor's Degree",
  'undergraduate': "Bachelor's Degree",
  'masters': "Master's Degree", 
  'master': "Master's Degree",
  'graduate': "Master's Degree",
  'postgraduate': "Master's Degree",
  'phd': 'PhD',
  'doctorate': 'PhD',
  'high_school': 'High School',
  'highschool': 'High School',
  'high school': 'High School',
  'self_taught': 'Self-Taught',
  'selftaught': 'Self-Taught',
  'self-taught': 'Self-Taught',
  'other': 'Other',
  'unknown': 'Not Specified',
  '': 'Not Specified',
  null: 'Not Specified',
  undefined: 'Not Specified'
} as const;

// Reverse mapping: UI display values -> database values
export const EDUCATION_LEVEL_REVERSE_MAPPINGS = {
  "Bachelor's Degree": 'bachelors',
  "Master's Degree": 'masters',
  'PhD': 'phd',
  'High School': 'high_school',
  'Self-Taught': 'self_taught',
  'Other': 'other',
  'Not Specified': 'unknown'
} as const;

// UI dropdown options (what users see)
export const EDUCATION_LEVEL_OPTIONS = [
  'High School',
  "Bachelor's Degree", 
  "Master's Degree",
  'PhD',
  'Self-Taught',
  'Other'
] as const;

// Professional Status Mappings
export const STATUS_MAPPINGS = {
  'student': 'Student',
  'professional': 'Professional',
  'career_changer': 'Career Changer',
  'hobbyist': 'Hobbyist',
  'employed': 'Professional',
  'unemployed': 'Student',
  'freelancer': 'Professional',
  '': 'Student',
  null: 'Student',
  undefined: 'Student'
} as const;

export const STATUS_REVERSE_MAPPINGS = {
  'Student': 'student',
  'Professional': 'professional', 
  'Career Changer': 'career_changer',
  'Hobbyist': 'hobbyist'
} as const;

export const STATUS_OPTIONS = [
  'Student',
  'Professional',
  'Career Changer', 
  'Hobbyist'
] as const;

// Primary Goal Mappings
export const GOAL_MAPPINGS = {
  'career_advancement': 'Career Advancement',
  'skill_building': 'Skill Building',
  'certification': 'Certification',
  'personal_growth': 'Personal Growth',
  'learn_skills': 'Skill Building',
  'crack_exams': 'Certification',
  'get_job_ready': 'Career Advancement',
  'switch_career': 'Career Advancement',
  'job': 'Career Advancement',
  'learning': 'Skill Building',
  '': 'Skill Building',
  null: 'Skill Building',
  undefined: 'Skill Building'
} as const;

export const GOAL_REVERSE_MAPPINGS = {
  'Career Advancement': 'career_advancement',
  'Skill Building': 'skill_building',
  'Certification': 'certification',
  'Personal Growth': 'personal_growth'
} as const;

export const GOAL_OPTIONS = [
  'Career Advancement',
  'Skill Building', 
  'Certification',
  'Personal Growth'
] as const;

// Domain Mappings
export const DOMAIN_MAPPINGS = {
  'web': 'Web Development',
  'web_dev': 'Web Development',
  'web-dev': 'Web Development',
  'software_development': 'Software Development',
  'data_science': 'Data Science',
  'ai_ml': 'AI/ML',
  'mobile_dev': 'Mobile Development',
  'devops': 'DevOps',
  'cybersecurity': 'Cybersecurity',
  'technology': 'Software Development',
  'general': 'Software Development',
  '': 'Software Development',
  null: 'Software Development',
  undefined: 'Software Development'
} as const;

export const DOMAIN_REVERSE_MAPPINGS = {
  'Web Development': 'web',
  'Software Development': 'software_development',
  'Data Science': 'data_science',
  'AI/ML': 'ai_ml',
  'Mobile Development': 'mobile_dev',
  'DevOps': 'devops',
  'Cybersecurity': 'cybersecurity'
} as const;

export const DOMAIN_OPTIONS = [
  'Software Development',
  'Web Development',
  'Data Science', 
  'AI/ML',
  'Mobile Development',
  'DevOps',
  'Cybersecurity'
] as const;

// Sub-domain mappings
export const SUB_DOMAIN_MAPPINGS: Record<string, string[]> = {
  'Software Development': ['Frontend Development', 'Backend Development', 'Full Stack', 'Desktop Applications'],
  'Web Development': ['React', 'Vue', 'Angular', 'Next.js', 'Node.js'],
  'Data Science': ['Machine Learning', 'Data Analysis', 'Statistics', 'Python', 'R'],
  'AI/ML': ['Natural Language Processing', 'Computer Vision', 'Deep Learning', 'Reinforcement Learning'],
  'Mobile Development': ['iOS', 'Android', 'React Native', 'Flutter'],
  'DevOps': ['CI/CD', 'Cloud', 'Containers', 'Kubernetes', 'AWS'],
  'Cybersecurity': ['Ethical Hacking', 'Network Security', 'Cloud Security', 'Penetration Testing']
};

// Skill Level Mappings
export const SKILL_LEVEL_MAPPINGS = {
  'beginner': 'Beginner',
  'intermediate': 'Intermediate', 
  'advanced': 'Advanced',
  'expert': 'Expert',
  '': 'Beginner',
  null: 'Beginner',
  undefined: 'Beginner'
} as const;

export const SKILL_LEVEL_REVERSE_MAPPINGS = {
  'Beginner': 'beginner',
  'Intermediate': 'intermediate',
  'Advanced': 'advanced', 
  'Expert': 'expert'
} as const;

export const SKILL_LEVEL_OPTIONS = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Expert'
] as const;

// Time Commitment Mappings
export const TIME_COMMITMENT_MAPPINGS = {
  '5-10': '5-10 hours/week',
  '10-15': '10-15 hours/week',
  '15-20': '15-20 hours/week',
  '20+': '20+ hours/week',
  '30 min/day': '30 min/day',
  '1 hr/day': '1 hr/day',
  '2 hrs/day': '2 hrs/day',
  'weekends only': 'Weekends only',
  'flexible': 'Flexible',
  '': 'Flexible',
  null: 'Flexible',
  undefined: 'Flexible'
} as const;

export const TIME_COMMITMENT_REVERSE_MAPPINGS = {
  '5-10 hours/week': '5-10',
  '10-15 hours/week': '10-15',
  '15-20 hours/week': '15-20',
  '20+ hours/week': '20+',
  '30 min/day': '30 min/day',
  '1 hr/day': '1 hr/day', 
  '2 hrs/day': '2 hrs/day',
  'Weekends only': 'weekends only',
  'Flexible': 'flexible'
} as const;

export const TIME_COMMITMENT_OPTIONS = [
  '5-10 hours/week',
  '10-15 hours/week',
  '15-20 hours/week', 
  '20+ hours/week',
  '30 min/day',
  '1 hr/day',
  '2 hrs/day',
  'Weekends only',
  'Flexible'
] as const;

// Helper functions
export function mapEducationLevelToUI(dbValue: string | null | undefined): string {
  const key = (dbValue || '').toLowerCase().trim();
  return EDUCATION_LEVEL_MAPPINGS[key as keyof typeof EDUCATION_LEVEL_MAPPINGS] || 'Not Specified';
}

export function mapEducationLevelToDB(uiValue: string): string {
  return EDUCATION_LEVEL_REVERSE_MAPPINGS[uiValue as keyof typeof EDUCATION_LEVEL_REVERSE_MAPPINGS] || 'unknown';
}

export function mapStatusToUI(dbValue: string | null | undefined): string {
  const key = (dbValue || '').toLowerCase().trim();
  return STATUS_MAPPINGS[key as keyof typeof STATUS_MAPPINGS] || 'Student';
}

export function mapStatusToDB(uiValue: string): string {
  return STATUS_REVERSE_MAPPINGS[uiValue as keyof typeof STATUS_REVERSE_MAPPINGS] || 'student';
}

export function mapGoalToUI(dbValue: string | null | undefined): string {
  const key = (dbValue || '').toLowerCase().trim();
  return GOAL_MAPPINGS[key as keyof typeof GOAL_MAPPINGS] || 'Skill Building';
}

export function mapGoalToDB(uiValue: string): string {
  return GOAL_REVERSE_MAPPINGS[uiValue as keyof typeof GOAL_REVERSE_MAPPINGS] || 'skill_building';
}

export function mapDomainToUI(dbValue: string | null | undefined): string {
  const key = (dbValue || '').toLowerCase().trim();
  return DOMAIN_MAPPINGS[key as keyof typeof DOMAIN_MAPPINGS] || 'Software Development';
}

export function mapDomainToDB(uiValue: string): string {
  return DOMAIN_REVERSE_MAPPINGS[uiValue as keyof typeof DOMAIN_REVERSE_MAPPINGS] || 'software_development';
}

export function mapSkillLevelToUI(dbValue: string | null | undefined): string {
  const key = (dbValue || '').toLowerCase().trim();
  return SKILL_LEVEL_MAPPINGS[key as keyof typeof SKILL_LEVEL_MAPPINGS] || 'Beginner';
}

export function mapSkillLevelToDB(uiValue: string): string {
  return SKILL_LEVEL_REVERSE_MAPPINGS[uiValue as keyof typeof SKILL_LEVEL_REVERSE_MAPPINGS] || 'beginner';
}

export function mapTimeCommitmentToUI(dbValue: string | null | undefined): string {
  const key = (dbValue || '').toLowerCase().trim();
  return TIME_COMMITMENT_MAPPINGS[key as keyof typeof TIME_COMMITMENT_MAPPINGS] || 'Flexible';
}

export function mapTimeCommitmentToDB(uiValue: string): string {
  return TIME_COMMITMENT_REVERSE_MAPPINGS[uiValue as keyof typeof TIME_COMMITMENT_REVERSE_MAPPINGS] || 'flexible';
}

export function getSubDomainOptions(domain: string): string[] {
  return SUB_DOMAIN_MAPPINGS[domain] || ['Foundations'];
}