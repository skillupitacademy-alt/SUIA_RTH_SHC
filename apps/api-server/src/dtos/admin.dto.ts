export interface AdminUserDTO {
  id: string;
  email: string;
  name: string;
  roles: string[];
  isVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date | null;
  examCount: number;
}

export interface AdminQuestionDTO {
  id: string;
  text: string;
  type: string;
  difficulty: string;
  topic?: string;
  skills?: string[];
  createdAt: Date;
  usageCount: number;
}

export interface AdminDashboardDTO {
  userCount: number;
  examCount: number;
  questionCount: number;
  recentActivity: unknown[];
}

type Maybe<T> = T | null | undefined;
type AdminUserInput = {
  id: string;
  email: string;
  createdAt?: Date;
  lastActiveAt?: Date | null;
  emailVerified?: boolean;
  profile?: { name?: string | null } | null;
  userRoles?: Array<{ role: { name: string } }> | null;
  exams?: unknown[] | null;
};

type AdminQuestionInput = {
  id: string;
  text?: string;
  questionText?: string;
  type: string;
  difficulty?: string;
  createdAt?: Date;
  topic?: { name?: string | null } | null;
  questionSkills?: Array<{ skill: { name: string } }> | null;
  examQuestions?: unknown[] | null;
};

const getNameOrUnknown = (name: Maybe<string>) => (name !== undefined && name !== null && name !== '' ? name : 'Unknown');

/**
 * Mappers
 */
export function toAdminUserDTO(user: AdminUserInput): AdminUserDTO {
  return {
    id: user.id,
    email: user.email,
    name: getNameOrUnknown(user.profile?.name),
    roles: user.userRoles?.map((ur) => ur.role.name) ?? [],
    isVerified: user.emailVerified === true,
    createdAt: user.createdAt ?? new Date(0),
    lastLoginAt: user.lastActiveAt ?? null,
    examCount: user.exams?.length ?? 0
  };
}

export function toAdminQuestionDTO(q: AdminQuestionInput): AdminQuestionDTO {
  return {
    id: q.id,
    text: q.text ?? q.questionText ?? '',
    type: q.type,
    difficulty: q.difficulty ?? 'intermediate',
    topic: q.topic?.name ?? undefined,
    skills: q.questionSkills?.map((qs) => qs.skill.name) ?? [],
    createdAt: q.createdAt ?? new Date(0),
    usageCount: q.examQuestions?.length ?? 0
  };
}
