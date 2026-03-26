import { index, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { users } from './users';

export const ssoSessions = pgTable('sso_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  jwtFamily: text('jwt_family').notNull(),
  platform: text('platform').notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true, mode: 'date' }),
  deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
}, (table) => ({
  idxSsoSessionsFamily: index('idx_sso_sessions_family').on(table.jwtFamily, table.revokedAt),
}));
