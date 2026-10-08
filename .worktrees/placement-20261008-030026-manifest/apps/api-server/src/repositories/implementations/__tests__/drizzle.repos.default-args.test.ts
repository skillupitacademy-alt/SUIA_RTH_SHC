import { describe, expect, it, vi } from 'vitest';

vi.mock('@quiz/db', () => ({
  db: { __mock: true },
  auditLogs: { id: 'auditLogs.id' },
  sessions: { id: 'sessions.id' }
}));

import { DrizzleAuditRepository } from '../drizzle-audit.repository';
import { DrizzleSessionRepository } from '../drizzle-session.repository';

describe('Drizzle repositories default args', () => {
  it('uses default db in DrizzleAuditRepository constructor', () => {
    const repo = new DrizzleAuditRepository();
    expect(repo).toBeInstanceOf(DrizzleAuditRepository);
  });

  it('uses default db in DrizzleSessionRepository constructor', () => {
    const repo = new DrizzleSessionRepository();
    expect(repo).toBeInstanceOf(DrizzleSessionRepository);
  });
});
