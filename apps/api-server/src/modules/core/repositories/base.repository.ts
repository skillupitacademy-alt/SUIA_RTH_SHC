import type { db } from '@quiz/db';
import { eq } from 'drizzle-orm';
import type { AnyPgColumn, AnyPgTable } from 'drizzle-orm/pg-core';

export abstract class BaseRepository<Row, TableType extends AnyPgTable & { id: AnyPgColumn }> {
  protected abstract table: TableType;

  constructor(protected readonly dbInstance: typeof db) {}

  async findById(id: string): Promise<Row | undefined> {
    const table = this.table as AnyPgTable & { id: AnyPgColumn };
    const results = await (this.dbInstance as any)
      .select()
      .from(table)
      .where(eq(table.id, id));
    return results[0] as Row | undefined;
  }

  async delete(id: string): Promise<void> {
    const table = this.table as AnyPgTable & { id: AnyPgColumn };
    await (this.dbInstance as any)
      .delete(table)
      .where(eq(table.id, id));
  }
}
