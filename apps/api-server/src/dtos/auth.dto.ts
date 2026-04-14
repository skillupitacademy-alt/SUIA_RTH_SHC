export interface UserSummaryDTO {
  id: string;
  email: string;
  name: string;
  isVerified: boolean;
  createdAt: Date;
  onboarded: boolean;
  role: string;
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
  const onboarded = Boolean(
    hasValue(user.profile?.professionalStatus) &&
    hasValue(user.profile?.educationLevel)
  );

  return {
    id: user.id,
    email: user.email,
    name: hasValue(user.profile?.name) ? user.profile!.name! : 'Unknown',
    isVerified: user.emailVerified === true,
    createdAt: user.createdAt,
    onboarded,
    role: isAdmin ? 'admin' : 'user',
    isAdmin
  };
}

export function toLoginResponseDTO(user: AuthUserInput, tokens: { expiresIn: number }, isAdmin: boolean = false): LoginResponseDTO {
  return {
    expiresIn: tokens.expiresIn,
    user: toUserSummaryDTO(user, isAdmin),
  };
}
