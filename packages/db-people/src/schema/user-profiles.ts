import { pgTable, text, timestamp, uuid, uniqueIndex } from 'drizzle-orm/pg-core';

import { users } from './users';

export const userProfiles = pgTable(
  'user_profiles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => ({
    userUnique: uniqueIndex('user_profiles_user_id_unique').on(table.userId),
  })
);
