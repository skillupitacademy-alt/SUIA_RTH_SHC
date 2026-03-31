import { boolean, index, integer, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

import { platformEnum, userRoleEnum } from './enums';

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    role: userRoleEnum('role').notNull().default('student'),
    platform: platformEnum('platform').notNull().default('realtutorialhub'),
    isActive: boolean('is_active').notNull().default(true),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    externalId: uuid('external_id'),
    externalBrand: text('external_brand'),
  },
  (table) => ({
    idxUsersEmailPlatform: index('idx_users_email_platform')
      .on(table.email, table.platform)
      .where(sql`${table.deletedAt} IS NULL`),
    idxUsersExternalIdPlatform: uniqueIndex('idx_users_external_id_platform')
      .on(table.externalId, table.platform)
      .where(sql`${table.externalId} IS NOT NULL`),
  })
);
