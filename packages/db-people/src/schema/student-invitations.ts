import { index, pgTable, timestamp, uniqueIndex, uuid, varchar } from 'drizzle-orm/pg-core';

import { platformEnum } from './enums';
import { users } from './users';

export const studentInvitations = pgTable(
  'student_invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    email: varchar('email', { length: 255 }).notNull(),
    platform: platformEnum('platform').notNull().default('skillup'),
    tokenHash: varchar('token_hash', { length: 64 }).notNull(),
    status: varchar('status', { length: 32 }).notNull().default('pending'),
    claimOwnerToken: varchar('claim_owner_token', { length: 120 }),
    claimExpiresAt: timestamp('claim_expires_at'),
    issuedAt: timestamp('issued_at').defaultNow().notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    redeemedAt: timestamp('redeemed_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    tokenHashUnq: uniqueIndex('student_invitations_token_hash_unq').on(table.tokenHash),
    userPlatformStatusIdx: index('student_invitations_user_platform_status_idx').on(
      table.userId,
      table.platform,
      table.status
    ),
  })
);

export type StudentInvitationRow = typeof studentInvitations.$inferSelect;
export type NewStudentInvitationRow = typeof studentInvitations.$inferInsert;

