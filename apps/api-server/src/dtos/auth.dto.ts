export interface UserSummaryDTO {
  id: string;
  email: string;
  name: string;
  isVerified: boolean;
  createdAt: Date;
  onboarded: boolean;
  onboardingCompleted: boolean; // 🔥 Add for backward compatibility
  role: string;
  roles: string[]; // 🔥 CRITICAL: Add roles array for consistency
  isAdmin: boolean;
}

export interface LoginResponseDTO {
  expiresIn: number;
  user: UserSummaryDTO;
}

export interface SignupResponseDTO {
  id: string;
  email: string;
  message: string;
}

type Maybe<T> = T | null | undefined;
type AuthUserInput = {
  id: string;
  email: string;
  createdAt: Date;
  emailVerified?: boolean;
  isOnboarded?: boolean;
  profile?: {
    name?: string | null;
    professionalStatus?: string | null;
    educationLevel?: string | null;
  } | null;
};

const hasValue = (value: Maybe<string>) => value !== undefined && value !== null && value !== '';

/**
 * Mappers
 */
export function toUserSummaryDTO(user: AuthUserInput, isAdmin: boolean = false): UserSummaryDTO {
  // CRITICAL FIX: Use DB isOnboarded field as single source of truth
  // Remove fallback logic that can override DB value
  const onboarded = user.isOnboarded === true;
  // 🔥 ROLE STANDARDIZATION: Use 'student' instead of 'user' (unified across RTH and SkillUp)
  const role = isAdmin ? 'admin' : 'student';

  return {
    id: user.id,
    email: user.email,
    name: hasValue(user.profile?.name) ? user.profile!.name! : 'Unknown',
    isVerified: user.emailVerified === true,
    createdAt: user.createdAt,
    onboarded,
    onboardingCompleted: onboarded, // 🔥 Add for backward compatibility
    role,
    roles: [role], // 🔥 CRITICAL: Always provide roles as array (now returns 'student')
    isAdmin
  };
}

export function toLoginResponseDTO(user: AuthUserInput, tokens: { expiresIn: number }, isAdmin: boolean = false): LoginResponseDTO {
  return {
    expiresIn: tokens.expiresIn,
    user: toUserSummaryDTO(user, isAdmin),
  };
}
