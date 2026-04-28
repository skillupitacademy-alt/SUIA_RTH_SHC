import { boolean, index, integer, pgEnum, pgTable, text, timestamp, uuid, primaryKey } from 'drizzle-orm/pg-core';

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  emailVerified: boolean("email_verified").notNull().default(false),
  isBlocked: boolean("is_blocked").notNull().default(false),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
  deletedAt: timestamp("deleted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  shadowUserId: uuid('shadow_user_id'),
  // Onboarding fields
  isOnboarded: boolean("is_onboarded").notNull().default(false),
  primaryGoal: text("primary_goal"),
  domain: text("domain"),
  subDomain: text("sub_domain"),
  timeCommitment: text("time_commitment"),
  journeyStatus: text("journey_status"),
}, (t) => ({
  idx_users_created_at: index("idx_users_created_at").on(t.createdAt),
}));

export const adaptiveLevelEnum = pgEnum("adaptive_level", ["beginner", "intermediate", "advanced", "expert"]);

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  educationLevel: text("education_level"),
  professionalStatus: text("professional_status"),
  ageGroup: text("age_group"),
  experienceYears: integer("experience_years"),
  domainInterest: text("domain_interest").array(),
  adaptiveLevel: adaptiveLevelEnum("adaptive_level").notNull().default("beginner"),
  primaryGoal: text("primary_goal"),
  domain: text("domain"),
  subDomain: text("sub_domain"),
  timeCommitment: text("time_commitment"),
  journeyStatus: text("journey_status"),
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const roles = pgTable("roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
});

export const userRoles = pgTable("user_roles", {
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  roleId: uuid("role_id")
    .notNull()
    .references(() => roles.id, { onDelete: "cascade" }),
}, (t) => ({
  pk: primaryKey({ columns: [t.userId, t.roleId] }),
}));

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  familyId: text("family_id"),
  ip: text("ip"),
  device: text("device"),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  revoked: boolean("revoked").notNull().default(false),
  lastActiveAt: timestamp("last_active_at").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // 🔐 Enterprise Auth Enhancements
  deviceId: text("device_id"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  deviceName: text("device_name"),
  lastUsedAt: timestamp("last_used_at").defaultNow(),
}, (t) => ({
  idx_refresh_tokens_user_id: index("idx_refresh_tokens_user_id").on(t.userId),
  idx_refresh_tokens_device_id: index("idx_refresh_tokens_device_id").on(t.deviceId),
  idx_refresh_tokens_user_device: index("idx_refresh_tokens_user_device").on(t.userId, t.deviceId),
  idx_refresh_tokens_ip: index("idx_refresh_tokens_ip").on(t.ipAddress),
}));

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(),
  ip: text("ip"),
  device: text("device"),
  metadata: text("metadata"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  idx_audit_logs_user_id: index("idx_audit_logs_user_id").on(t.userId),
  idx_audit_logs_action: index("idx_audit_logs_action").on(t.action),
  idx_audit_logs_created_at: index("idx_audit_logs_created_at").on(t.createdAt),
}));

export const loginAttempts = pgTable("login_attempts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  brand: text("brand").notNull().default('skillup'),
  ip: text("ip").notNull(),
  attempts: integer("attempts").notNull().default(0),
  lockedUntil: timestamp("locked_until"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
}, (t) => ({
  idx_login_attempts_brand_user_ip: index("idx_login_attempts_brand_user_ip").on(t.brand, t.userId, t.ip),
  idx_login_attempts_ip: index("idx_login_attempts_ip").on(t.ip),
  idx_login_attempts_user_id: index("idx_login_attempts_user_id").on(t.userId),
}));

export const revokedTokens = pgTable("revoked_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  tokenHash: text("token_hash").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const verificationTokens = pgTable("verification_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
