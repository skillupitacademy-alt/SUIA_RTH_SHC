import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@neondatabase/serverless', () => ({
  neon: vi.fn((url) => ({ url })),
}));

describe('db.ts branch coverage', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
  });

  it('uses placeholder when DATABASE_URL is missing/empty (Line 8)', async () => {
    process.env.DATABASE_URL = '';
    const { sql } = await import('../db');
    expect((sql as any).url).toContain('placeholder');
  });

  it('uses DATABASE_URL when provided (Line 10)', async () => {
    process.env.DATABASE_URL = 'postgresql://real:real@ep-real.neon.tech/db';
    const { sql } = await import('../db');
    expect((sql as any).url).toBe('postgresql://real:real@ep-real.neon.tech/db');
  });

  it('falls back to sql when DATABASE_URL_REPLICA is missing (Line 24)', async () => {
    process.env.DATABASE_URL = 'postgresql://primary@host/db';
    delete process.env.DATABASE_URL_REPLICA;
    const { sql, sqlReplica } = await import('../db');
    expect(sqlReplica).toBe(sql);
  });

  it('uses DATABASE_URL_REPLICA when provided (Line 23)', async () => {
    process.env.DATABASE_URL = 'postgresql://primary@host/db';
    process.env.DATABASE_URL_REPLICA = 'postgresql://replica@host/db';
    const { sql, sqlReplica } = await import('../db');
    expect(sqlReplica).not.toBe(sql);
    expect((sqlReplica as any).url).toBe('postgresql://replica@host/db');
  });

  it('handles null/undefined DATABASE_URL (Line 8)', async () => {
    delete process.env.DATABASE_URL;
    const { sql } = await import('../db');
    expect((sql as any).url).toContain('placeholder');
  });
});
