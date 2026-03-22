export type PlatformName = 'realtutorialhub' | 'skillup' | 'both';
export type UserRole = 'student' | 'faculty' | 'admin' | 'super_admin';
export type SubscriptionPlan = 'free' | 'pro' | 'enterprise';

export interface AccessTokenPayload {
  sub: string;
  roles: UserRole[];
  subscriptions: string[];
  platforms?: PlatformName[];
  iat: number;
  exp: number;
  iss: 'skillhubcore.in';
}

export interface RefreshTokenPayload {
  sub: string;
  family: string;
  iat: number;
  exp: number;
  iss: 'skillhubcore.in';
}

export interface RegisterInput {
  email: string;
  password: string;
  platform: PlatformName;
  role?: Exclude<UserRole, 'super_admin'>;
}

export interface LoginInput {
  email: string;
  password: string;
  platform: PlatformName;
  ipAddress?: string;
}

export interface AuthUserDTO {
  id: string;
  email: string;
  roles: UserRole[];
  platforms: PlatformName[];
  subscriptions: string[];
}

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDTO;
}
