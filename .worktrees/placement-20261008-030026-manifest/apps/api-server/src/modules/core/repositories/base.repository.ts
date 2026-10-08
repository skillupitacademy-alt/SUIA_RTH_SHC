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

  async findById(_id: string): Promise<Row | undefined> {
    throw new Error('❌ DO NOT USE BASE REPOSITORY findById - Each repository must implement its own findById method with proper query API');
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
