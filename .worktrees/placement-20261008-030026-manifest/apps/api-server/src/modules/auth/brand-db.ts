import {
  auditLogs as defaultAuditLogs,
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
  auditLogs as realtutorialhubAuditLogs,
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
  auditLogs as skillupAuditLogs,
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
  auditLogs: defaultAuditLogs,
  verificationTokens: defaultVerificationTokens,
  passwordResetTokens: defaultPasswordResetTokens,
  refreshTokens: defaultRefreshTokens,
  loginAttempts: defaultLoginAttempts,
} as const;

const realtutorialhubTables = {
  users: realtutorialhubUsers,
  userProfiles: realtutorialhubUserProfiles,
  roles: realtutorialhubRoles,
  userRoles: realtutorialhubUserRoles,
  auditLogs: realtutorialhubAuditLogs,
  verificationTokens: realtutorialhubVerificationTokens,
  passwordResetTokens: realtutorialhubPasswordResetTokens,
  refreshTokens: realtutorialhubRefreshTokens,
  loginAttempts: realtutorialhubLoginAttempts,
} as const;

const skillupTables = {
  users: skillupUsers,
  userProfiles: skillupUserProfiles,
  roles: skillupRoles,
  userRoles: skillupUserRoles,
  auditLogs: skillupAuditLogs,
  verificationTokens: skillupVerificationTokens,
  passwordResetTokens: skillupPasswordResetTokens,
  refreshTokens: skillupRefreshTokens,
  loginAttempts: skillupLoginAttempts,
} as const;

export type BrandAuthTables = {
  users: typeof realtutorialhubUsers | typeof skillupUsers | typeof defaultUsers;
  userProfiles: typeof realtutorialhubUserProfiles | typeof skillupUserProfiles | typeof defaultUserProfiles;
  roles: typeof realtutorialhubRoles | typeof skillupRoles | typeof defaultRoles;
  userRoles: typeof realtutorialhubUserRoles | typeof skillupUserRoles | typeof defaultUserRoles;
  auditLogs: typeof realtutorialhubAuditLogs | typeof skillupAuditLogs | typeof defaultAuditLogs;
  verificationTokens: typeof realtutorialhubVerificationTokens | typeof skillupVerificationTokens | typeof defaultVerificationTokens;
  passwordResetTokens: typeof realtutorialhubPasswordResetTokens | typeof skillupPasswordResetTokens | typeof defaultPasswordResetTokens;
  refreshTokens: typeof realtutorialhubRefreshTokens | typeof skillupRefreshTokens | typeof defaultRefreshTokens;
  loginAttempts: typeof realtutorialhubLoginAttempts | typeof skillupLoginAttempts | typeof defaultLoginAttempts;
};

export function getDefaultAuthContext() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { db: defaultDb as any, tables: defaultTables as BrandAuthTables };
}

export function getAuthBrandContext(brand: RequestBrand = 'realtutorialhub') {
  if (brand === 'skillup') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { db: skillupDb as any, tables: skillupTables as BrandAuthTables };
  }

  if (brand === 'skillhubcore') {
    // SkillHub Core uses people_db (unified auth database)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { db: defaultDb as any, tables: defaultTables as BrandAuthTables };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { db: realtutorialhubDb as any, tables: realtutorialhubTables as BrandAuthTables };
}

export function shouldUseBrandBinding() {
  return !(process.env.NODE_ENV === 'test' || process.env.VITEST === 'true' || process.env.VITEST_WORKER_ID !== undefined);
}
