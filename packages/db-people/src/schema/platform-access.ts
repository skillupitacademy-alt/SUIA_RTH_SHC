import { pgTable, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';

import { platformEnum } from './enums';
import { users } from './users';

export const platformAccess = pgTable(
  'platform_access',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id),
    platform: platformEnum('platform').notNull(),
    grantedAt: timestamp('granted_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => ({
    userPlatformUnique: uniqueIndex('platform_access_user_platform_unique').on(table.userId, table.platform),
  })
);
