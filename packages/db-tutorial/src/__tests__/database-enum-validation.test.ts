/**
 * Database Enum Validation Test
 * Verifies tutorial_difficulty enum accepts correct values and rejects incorrect ones
 */
import { describe, it, expect } from 'vitest';
import { db } from '../db';
import { sql } from 'drizzle-orm';

describe('Database Enum Verification - tutorial_difficulty', () => {
  it('should accept valid tutorial_difficulty values: simple, mixed, intermediate, expert', async () => {
    const validValues = ['simple', 'mixed', 'intermediate', 'expert'];
    
    for (const value of validValues) {
      const result = await db.execute(
        sql.raw(`SELECT '${value}'::tutorial_difficulty as difficulty`)
      );
      expect(result.rows[0].difficulty).toBe(value);
    }
  });

  it('should reject invalid tutorial_difficulty values: beginner, advanced', async () => {
    const invalidValues = ['beginner', 'advanced'];
    
    for (const value of invalidValues) {
      await expect(
        db.execute(sql.raw(`SELECT '${value}'::tutorial_difficulty as difficulty`))
      ).rejects.toThrow(); // Just verify it throws, error format varies
    }
  });
});
