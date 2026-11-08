import { describe, expect, it, vi } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import { BlockTelemetryEventRepository } from '../block-telemetry-event.repository';
import { blockTelemetryEvents } from '../../schema';

describe('event repository isolated query contract', () => {
  it('claims once on event-id conflict and queries the requested event', async () => {
    const rows = new Map<string, any>();
    const onConflict = vi.fn((options: any) => ({ returning: async () => {
      const row = pending; if (rows.has(row.eventId)) return []; rows.set(row.eventId, row); return [row];
    } }));
    let pending: any;
    const values = vi.fn((row: any) => { pending = row; return { onConflictDoNothing: onConflict }; });
    const where = vi.fn((clause: any) => ({ limit: async () => { const params = new PgDialect().sqlToQuery(clause).params; return [...rows.values()].filter(row => params.includes(row.eventId)); } }));
    const db = { insert: () => ({ values }), select: () => ({ from: () => ({ where }) }) };
    const repository = new BlockTelemetryEventRepository(db as never);
    const data = { eventId: 'event', userId: 'owner', navigationNodeId: 'node', blockId: 'block', blockVersion: 'D1', activeTimeSec: 30 };
    expect(await repository.claimEvent(data)).toMatchObject(data);
    expect(await repository.claimEvent(data)).toBeNull();
    expect(onConflict).toHaveBeenCalledWith({ target: blockTelemetryEvents.eventId });
    expect(await repository.findByEventId('event')).toMatchObject(data);
    expect(await repository.findByEventId('other')).toBeNull();
  });
});
