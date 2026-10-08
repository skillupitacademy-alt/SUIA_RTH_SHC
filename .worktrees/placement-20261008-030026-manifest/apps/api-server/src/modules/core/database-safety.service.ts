import { db } from '@quiz/db';
import type { AnyColumn, Table } from 'drizzle-orm';
import { eq, getTableName, sql } from 'drizzle-orm';

export class DatabaseSafetyService {
  /**
   * Checks the number of child records for a parent record across multiple tables.
   * Useful for guarding against accidental mass CASCADE DELETEs.
   */
  async checkChildCounts(
    parentId: string,
    config: Array<{ table: Table; column: AnyColumn }>
  ): Promise<Record<string, number>> {
    const results: Record<string, number> = {};

    for (const item of config) {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)` })
        .from(item.table)
        .where(eq(item.column, parentId));

      const tableName = getTableName(item.table);
      results[tableName] = Number(count ?? 0);
    }

    return results;
  }

  /**
   * Throws an error if child counts exceed a certain threshold.
   */
  async enforceSafetyLimits(
    parentId: string,
    config: Array<{ table: Table; column: AnyColumn }>,
    threshold: number = 100
  ) {
    const counts = await this.checkChildCounts(parentId, config);
    const total = Object.values(counts).reduce((acc, curr) => acc + curr, 0);

    if (total > threshold) {
      throw new Error(`CASCADE_SAFETY_LIMIT: This operation would delete ${total} child records (threshold: ${threshold}). Please delete child records manually first or use a forced delete.`);
    }
  }
}

export const databaseSafetyService = new DatabaseSafetyService();
