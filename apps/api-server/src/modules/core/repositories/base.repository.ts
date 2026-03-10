import type { db } from '@quiz/db';
import { eq } from 'drizzle-orm';
import type { AnyPgColumn, AnyPgTable } from 'drizzle-orm/pg-core';

export abstract class BaseRepository<Row, TableType extends AnyPgTable & { id: AnyPgColumn }> {
  protected abstract table: TableType;

  constructor(protected dbInstance: typeof db) {}

  /**
   * Returns a new instance of the repository using the specified database client.
   */
  abstract withDb(dbClient: typeof db): this;

  async findById(id: string): Promise<Row | undefined> {
    const table = this.table as AnyPgTable & { id: AnyPgColumn };
    const dbAny = this.dbInstance as unknown as {
      select?: () => { from: (tbl: AnyPgTable) => { where: (cond: unknown) => Promise<Row[]> } };
      query?: { exams?: { findFirst?: (args: unknown) => Promise<Row | undefined> } };
    };

    if (typeof dbAny.select === 'function') {
      const results = await dbAny.select().from(table).where(eq(table.id, id));
      return results?.[0] as Row | undefined;
    }

    if (typeof dbAny?.query?.exams?.findFirst === 'function') {
      const row = await dbAny.query.exams.findFirst({ where: eq(table.id, id) });
      return row as Row | undefined;
    }

    return undefined;
  }

  async delete(id: string): Promise<Row | void> {
    const table = this.table as AnyPgTable & { id: AnyPgColumn };
    const dbDelete = this.dbInstance as unknown as {
      delete: (tbl: AnyPgTable) => { where: (cond: unknown) => { returning: () => Promise<Row[]> } };
    };
    const result = await dbDelete
      .delete(table)
      .where(eq(table.id, id))
      .returning();
    return result[0] as Row | undefined;
  }
}
