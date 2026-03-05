import type { db } from '@quiz/db';
import { eq } from 'drizzle-orm';
import type { AnyPgColumn, AnyPgTable } from 'drizzle-orm/pg-core';

type IdColumn<TableType extends AnyPgTable> = TableType['_']['columns'] extends { id: AnyPgColumn }
  ? TableType['_']['columns']['id']
  : never;

export abstract class BaseRepository<Row, TableType extends AnyPgTable> {
  protected abstract table: TableType;

  constructor(protected readonly dbInstance: typeof db) {}

  async findById(id: string): Promise<Row | undefined> {
    const results = await this.dbInstance.select().from(this.table).where(eq(this.table.id as IdColumn<TableType>, id));
    return results[0] as Row | undefined;
  }

  async delete(id: string): Promise<void> {
    await this.dbInstance.delete(this.table).where(eq(this.table.id as IdColumn<TableType>, id));
  }
}
