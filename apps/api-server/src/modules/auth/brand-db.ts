import {
  db as defaultDb,
  loginAttempts as defaultLoginAttempts,
  passwordResetTokens as defaultPasswordResetTokens,
  refreshTokens as defaultRefreshTokens,
  roles as defaultRoles,
  userProfiles as defaultUserProfiles,
  userRoles as defaultUserRoles,
  users as defaultUsers,
  verificationTokens as defaultVerificationTokens,
} from '@quiz/db';
import {
  db as realtutorialhubDb,
  loginAttempts as realtutorialhubLoginAttempts,
  passwordResetTokens as realtutorialhubPasswordResetTokens,
  refreshTokens as realtutorialhubRefreshTokens,
  roles as realtutorialhubRoles,
  userProfiles as realtutorialhubUserProfiles,
  userRoles as realtutorialhubUserRoles,
  users as realtutorialhubUsers,
  verificationTokens as realtutorialhubVerificationTokens,
} from '@quiz/db-rth';
import {
  db as skillupDb,
  loginAttempts as skillupLoginAttempts,
  passwordResetTokens as skillupPasswordResetTokens,
  refreshTokens as skillupRefreshTokens,
  roles as skillupRoles,
  userProfiles as skillupUserProfiles,
  userRoles as skillupUserRoles,
  users as skillupUsers,
  verificationTokens as skillupVerificationTokens,
} from '@quiz/db-skillup';

import type { RequestBrand } from '@/lib/request-brand';

const defaultTables = {
  users: defaultUsers,
  userProfiles: defaultUserProfiles,
  roles: defaultRoles,
  userRoles: defaultUserRoles,
  verificationTokens: defaultVerificationTokens,
  passwordResetTokens: defaultPasswordResetTokens,
  refreshTokens: defaultRefreshTokens,
  loginAttempts: defaultLoginAttempts,
};

const realtutorialhubTables = {
  users: realtutorialhubUsers,
  userProfiles: realtutorialhubUserProfiles,
  roles: realtutorialhubRoles,
  userRoles: realtutorialhubUserRoles,
  verificationTokens: realtutorialhubVerificationTokens,
  passwordResetTokens: realtutorialhubPasswordResetTokens,
  refreshTokens: realtutorialhubRefreshTokens,
  loginAttempts: realtutorialhubLoginAttempts,
};

const skillupTables = {
  users: skillupUsers,
  userProfiles: skillupUserProfiles,
  roles: skillupRoles,
  userRoles: skillupUserRoles,
  verificationTokens: skillupVerificationTokens,
  passwordResetTokens: skillupPasswordResetTokens,
  refreshTokens: skillupRefreshTokens,
  loginAttempts: skillupLoginAttempts,
};

export type BrandAuthTables = typeof defaultTables;

export function getDefaultAuthContext() {
  return { db: defaultDb as any, tables: defaultTables as BrandAuthTables };
}

export function getAuthBrandContext(brand: RequestBrand = 'realtutorialhub') {
  if (brand === 'skillup') {
    return { db: skillupDb as any, tables: skillupTables as BrandAuthTables };
  }

  return { db: realtutorialhubDb as any, tables: realtutorialhubTables as BrandAuthTables };
}

export function shouldUseBrandBinding() {
  return !(process.env.NODE_ENV === 'test' || process.env.VITEST === 'true' || process.env.VITEST_WORKER_ID !== undefined);
}
