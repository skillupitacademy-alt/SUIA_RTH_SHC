import type { db } from '@quiz/db';
import { eq } from 'drizzle-orm';
import type { AnyPgColumn, AnyPgTable } from 'drizzle-orm/pg-core';

export abstract class BaseRepository<Row, TableType extends AnyPgTable & { id: AnyPgColumn }> {
  protected abstract table: TableType;

  constructor(protected readonly dbInstance: typeof db) {}

  async findById(id: string): Promise<Row | undefined> {
    const table = this.table as AnyPgTable & { id: AnyPgColumn };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dbAny = this.dbInstance as any;
    if (typeof dbAny.select === 'function') {
      const results = await dbAny.select().from(table).where(eq(table.id, id));
      return results[0] as Row | undefined;
    }
    if (dbAny?.query?.exams?.findFirst) {
      const row = await dbAny.query.exams.findFirst({ where: eq(table.id, id) });
      return row as Row | undefined;
    }
    return undefined;
  }

  async delete(id: string): Promise<void> {
    const table = this.table as AnyPgTable & { id: AnyPgColumn };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (this.dbInstance as any)
      .delete(table)
      .where(eq(table.id, id));
  }
}
