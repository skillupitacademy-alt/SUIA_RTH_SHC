/* istanbul ignore file */
import { index, pgTable, text, timestamp, uniqueIndex, uuid, integer } from 'drizzle-orm/pg-core';

import { tutorialProjectScopeEnum } from './enums';

export const certificates = pgTable('certificates', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull(),
  scope: tutorialProjectScopeEnum('scope').notNull(),
  parentId: uuid('parent_id').notNull(),
  parentName: text('parent_name').notNull(),
  verificationCode: text('verification_code').notNull(),
  pdfUrl: text('pdf_url'),
  issuedAt: timestamp('issued_at', { mode: 'date' }).notNull().defaultNow(),
  expiresAt: timestamp('expires_at', { mode: 'date' }),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
  deletedAt: timestamp('deleted_at', { mode: 'date' }),
}, (table) => ({
  idxCertificatesUser: index('idx_certificates_user').on(table.userId),
  idxCertificatesVerify: uniqueIndex('idx_certificates_verify').on(table.verificationCode),
}));
