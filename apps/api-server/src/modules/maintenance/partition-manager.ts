import { db } from '@quiz/db';
import { addMonths, format, startOfMonth } from 'date-fns';
import { sql } from 'drizzle-orm';

import { logger } from '@/lib/logger';

export class PartitionManager {
  /**
   * Ensures partitions exist for the exams table for the current month and next 3 months.
   */
  static async ensureExamsPartitions() {
    const now = new Date();
    const monthsToEnsure = [
      now,
      addMonths(now, 1),
      addMonths(now, 2),
      addMonths(now, 3)
    ];

    logger.info('[PartitionManager] Checking exam partitions');

    for (const date of monthsToEnsure) {
      const year = format(date, 'yyyy');
      const month = format(date, 'MM');
      const tableName = `exams_${year}_${month}`;
      
      const start = startOfMonth(date);
      const end = startOfMonth(addMonths(date, 1)); // End is exclusive

      const startStr = format(start, 'yyyy-MM-dd');
      const endStr = format(end, 'yyyy-MM-dd');

      try {
        // Raw SQL for partition creation as Drizzle doesn't have a direct helper for this yet
        // We use sql.raw because table names and partition bounds are dynamic here
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS ${sql.raw(tableName)} 
          PARTITION OF exams 
          FOR VALUES FROM (${startStr}) TO (${endStr})
        `);
        logger.debug({ tableName }, '[PartitionManager] Ensured partition exists');
      } catch (error) {
        logger.error({ error, tableName }, '[PartitionManager] Failed to create partition');
      }
    }
  }

  /**
   * Maintenance task to handle generic table partitioning setup.
   */
  static async runMaintenance() {
    await this.ensureExamsPartitions();
  }
}
