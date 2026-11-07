import { createHash } from 'node:crypto';
import { and, eq, lte, or, sql } from 'drizzle-orm';
import type { TutorialDbClientLike } from '@quiz/types';

import { db } from '../db';
import { eventOutbox, type EventOutboxRow } from '../schema/event-outbox';
import { TutorialRepositoryBase } from './base.repository';

export type OutboxRecordStatus = 'pending' | 'publishing' | 'published' | 'failed';

export interface OutboxIntentRecord {
  id: string;
  tenantId: string;
  eventType: string;
  eventId: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  envelope: Record<string, unknown> | null;
  status: OutboxRecordStatus;
  attemptCount: number;
  ownerToken: string | null;
  leaseExpiresAt: string | null;
  publishedAt: string | null;
  lastError: string | null;
}

const DEFAULT_OUTBOX_CLAIM_LEASE_MS = 300_000;

export function deriveOutboxDeterministicUuid(seed: string): string {
  const bytes = Buffer.from(createHash('sha256').update(seed).digest().subarray(0, 16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

export function canonicalizeOutboxJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalizeOutboxJson(item)).join(',')}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalizeOutboxJson(v)}`).join(',')}}`;
}

export function cloneAndFreezePayload<T extends Record<string, unknown>>(payload: T): T {
  const cloned = JSON.parse(JSON.stringify(payload)) as T;
  return deepFreezeObject(cloned);
}

function deepFreezeObject<T>(obj: T): T {
  if (obj !== null && typeof obj === 'object') {
    Object.freeze(obj);
    for (const value of Object.values(obj as Record<string, unknown>)) {
      if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
        deepFreezeObject(value);
      }
    }
  }
  return obj;
}

function mapRowToRecord(row: EventOutboxRow): OutboxIntentRecord {
  const frozenPayload = cloneAndFreezePayload((row.payload ?? {}) as Record<string, unknown>);
  const frozenEnvelope = row.envelope
    ? cloneAndFreezePayload(row.envelope as Record<string, unknown>)
    : null;
  const record: OutboxIntentRecord = {
    id: row.id,
    tenantId: row.tenantId,
    eventType: row.eventType,
    eventId: row.eventId,
    aggregateId: row.aggregateId,
    payload: frozenPayload,
    envelope: frozenEnvelope,
    status: (row.status as OutboxRecordStatus) ?? 'pending',
    attemptCount: row.attemptCount ?? 0,
    ownerToken: row.ownerToken ?? null,
    leaseExpiresAt:
      row.leaseExpiresAt instanceof Date
        ? row.leaseExpiresAt.toISOString()
        : typeof row.leaseExpiresAt === 'string'
          ? row.leaseExpiresAt
          : null,
    publishedAt:
      row.publishedAt instanceof Date
        ? row.publishedAt.toISOString()
        : typeof row.publishedAt === 'string'
          ? row.publishedAt
          : null,
    lastError: row.lastError ?? null,
  };
  Object.defineProperty(record, 'payload', {
    value: frozenPayload,
    writable: false,
    configurable: false,
    enumerable: true,
  });
  return record;
}

/**
 * Authoritative SQL repository for transactional event outbox persistence (`event_outbox`).
 * All runtime reads and writes execute against `this.dbInstance` (database or transaction handle `tx`)
 * and fail closed on any SQL error or zero-row mutation.
 */
export class EventOutboxRepository extends TutorialRepositoryBase {
  withDb(dbClient: TutorialDbClientLike): this {
    return new EventOutboxRepository(dbClient as unknown as typeof db) as this;
  }

  async findIntent(
    tenantId: string,
    eventType: string,
    aggregateId: string
  ): Promise<OutboxIntentRecord | undefined> {
    const normalizedTenant = tenantId.trim().toLowerCase();
    const normalizedType = eventType.trim();
    const normalizedAggregate = aggregateId.trim();

    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(eventOutbox)
        .where(
          and(
            eq(eventOutbox.tenantId, normalizedTenant),
            eq(eventOutbox.eventType, normalizedType),
            eq(eventOutbox.aggregateId, normalizedAggregate)
          )
        ),
      'eventOutbox.findIntent'
    );

    if (Array.isArray(rows) && rows.length > 0 && rows[0] !== undefined && rows[0].eventId) {
      return mapRowToRecord(rows[0]);
    }
    return undefined;
  }

  async findIntentByEventId(eventId: string): Promise<OutboxIntentRecord | undefined> {
    const normalizedEventId = eventId.trim();
    if (!normalizedEventId) return undefined;

    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(eventOutbox)
        .where(eq(eventOutbox.eventId, normalizedEventId)),
      'eventOutbox.findIntentByEventId'
    );

    if (Array.isArray(rows) && rows.length > 0 && rows[0] !== undefined && rows[0].eventId) {
      return mapRowToRecord(rows[0]);
    }
    return undefined;
  }

  async upsertIntent(input: {
    tenantId: string;
    eventType: string;
    aggregateId: string;
    payload: Record<string, unknown>;
    envelope?: Record<string, unknown> | null;
    eventId?: string;
    ownerToken?: string;
  }): Promise<OutboxIntentRecord> {
    const normalizedTenant = input.tenantId.trim().toLowerCase();
    const normalizedType = input.eventType.trim();
    const normalizedAggregate = input.aggregateId.trim();
    if (!normalizedTenant || !normalizedType || !normalizedAggregate) {
      throw new Error('Outbox intent requires non-empty tenantId, eventType, and aggregateId');
    }

    const deterministicEventId =
      input.eventId?.trim() ||
      deriveOutboxDeterministicUuid(`${normalizedTenant}:${normalizedType}:${normalizedAggregate}`);

    const existingRows = await this.runRead(
      this.dbInstance
        .select()
        .from(eventOutbox)
        .where(
          or(
            and(
              eq(eventOutbox.tenantId, normalizedTenant),
              eq(eventOutbox.eventType, normalizedType),
              eq(eventOutbox.aggregateId, normalizedAggregate)
            ),
            eq(eventOutbox.eventId, deterministicEventId)
          )
        ),
      'eventOutbox.findExisting'
    );

    const incomingPayloadCanonical = canonicalizeOutboxJson(input.payload);

    if (Array.isArray(existingRows) && existingRows.length > 0 && existingRows[0] !== undefined) {
      const existing = existingRows[0];
      const storedPayloadCanonical = canonicalizeOutboxJson(existing.payload);
      if (
        existing.tenantId !== normalizedTenant ||
        existing.eventType !== normalizedType ||
        existing.aggregateId !== normalizedAggregate ||
        existing.eventId !== deterministicEventId ||
        storedPayloadCanonical !== incomingPayloadCanonical
      ) {
        throw new Error('Conflicting outbox payload for existing event identity');
      }

      if (existing.envelope && input.envelope) {
        const storedEnvelopeCanonical = canonicalizeOutboxJson(existing.envelope);
        const incomingEnvelopeCanonical = canonicalizeOutboxJson(input.envelope);
        if (storedEnvelopeCanonical !== incomingEnvelopeCanonical) {
          throw new Error('Conflicting outbox envelope for existing event identity');
        }
      }

      if (input.envelope !== undefined && input.envelope !== null && !existing.envelope) {
        const updatedRows = await this.runRead(
          this.dbInstance
            .update(eventOutbox)
            .set({
              envelope: cloneAndFreezePayload(input.envelope) as any,
              updatedAt: new Date(),
            })
            .where(eq(eventOutbox.id, existing.id))
            .returning(),
          'eventOutbox.updateEnvelope'
        );
        if (!Array.isArray(updatedRows) || updatedRows.length === 0 || updatedRows[0] === undefined) {
          throw new Error('Failed to update outbox envelope: zero affected rows');
        }
        return mapRowToRecord(updatedRows[0]);
      }

      return mapRowToRecord(existing);
    }

    const frozenPayload = cloneAndFreezePayload(input.payload);
    const frozenEnvelope =
      input.envelope !== undefined && input.envelope !== null
        ? cloneAndFreezePayload(input.envelope)
        : null;

    const now = new Date();
    const insertedRows = await this.runRead(
      this.dbInstance
        .insert(eventOutbox)
        .values({
          id: deriveOutboxDeterministicUuid(
            `outbox-row:${normalizedTenant}:${normalizedType}:${normalizedAggregate}`
          ),
          tenantId: normalizedTenant,
          eventType: normalizedType,
          eventId: deterministicEventId,
          aggregateId: normalizedAggregate,
          payload: frozenPayload,
          envelope: frozenEnvelope as any,
          status: 'pending',
          attemptCount: 0,
          ownerToken: input.ownerToken ?? null,
          leaseExpiresAt: null,
          publishedAt: null,
          lastError: null,
          createdAt: now,
          updatedAt: now,
        })
        .returning(),
      'eventOutbox.insert'
    );

    if (!Array.isArray(insertedRows) || insertedRows.length === 0 || insertedRows[0] === undefined) {
      throw new Error('Failed to persist event outbox intent: zero affected rows');
    }

    return mapRowToRecord(insertedRows[0]);
  }

  async claimIntent(input: {
    tenantId: string;
    eventType: string;
    aggregateId: string;
    ownerToken: string;
    leaseDurationMs?: number;
    now?: Date;
  }): Promise<
    | { kind: 'already-published'; record: OutboxIntentRecord }
    | { kind: 'busy'; record: OutboxIntentRecord }
    | { kind: 'claimed'; record: OutboxIntentRecord }
  > {
    const normalizedOwner = input.ownerToken.trim();
    if (!normalizedOwner) {
      throw new Error('ownerToken is required to claim an outbox publication intent');
    }
    const normalizedTenant = input.tenantId.trim().toLowerCase();
    const normalizedType = input.eventType.trim();
    const normalizedAggregate = input.aggregateId.trim();
    const now = input.now ?? new Date();
    const leaseDurationMs = input.leaseDurationMs ?? DEFAULT_OUTBOX_CLAIM_LEASE_MS;
    const leaseExpiresAt = new Date(now.getTime() + leaseDurationMs);

    const updatedRows = await this.runRead(
      this.dbInstance
        .update(eventOutbox)
        .set({
          status: 'publishing',
          ownerToken: normalizedOwner,
          attemptCount: sql`${eventOutbox.attemptCount} + 1`,
          leaseExpiresAt,
          updatedAt: now,
        })
        .where(
          and(
            eq(eventOutbox.tenantId, normalizedTenant),
            eq(eventOutbox.eventType, normalizedType),
            eq(eventOutbox.aggregateId, normalizedAggregate),
            or(
              eq(eventOutbox.status, 'pending'),
              eq(eventOutbox.status, 'failed'),
              and(
                eq(eventOutbox.status, 'publishing'),
                lte(eventOutbox.leaseExpiresAt, now)
              )
            )
          )
        )
        .returning(),
      'eventOutbox.claimIntent'
    );

    if (Array.isArray(updatedRows) && updatedRows.length > 0 && updatedRows[0] !== undefined) {
      return { kind: 'claimed', record: mapRowToRecord(updatedRows[0]) };
    }

    const existing = await this.findIntent(normalizedTenant, normalizedType, normalizedAggregate);
    if (!existing) {
      throw new Error('Outbox publication intent not found');
    }
    if (existing.status === 'published') {
      return { kind: 'already-published', record: existing };
    }
    if (existing.status === 'publishing') {
      return { kind: 'busy', record: existing };
    }
    throw new Error('Outbox publication intent could not be claimed');
  }

  async markPublished(input: {
    tenantId: string;
    eventType: string;
    aggregateId: string;
    ownerToken: string;
    envelope?: Record<string, unknown> | null;
    now?: Date;
  }): Promise<OutboxIntentRecord> {
    const normalizedTenant = input.tenantId.trim().toLowerCase();
    const normalizedType = input.eventType.trim();
    const normalizedAggregate = input.aggregateId.trim();
    const normalizedOwner = input.ownerToken.trim();
    if (!normalizedOwner) {
      throw new Error('ownerToken is required to complete an outbox publication intent');
    }

    const now = input.now ?? new Date();
    const updatedRows = await this.runRead(
      this.dbInstance
        .update(eventOutbox)
        .set({
          status: 'published',
          publishedAt: now,
          leaseExpiresAt: null,
          lastError: null,
          ...(input.envelope ? { envelope: cloneAndFreezePayload(input.envelope) as any } : {}),
          updatedAt: now,
        })
        .where(
          and(
            eq(eventOutbox.tenantId, normalizedTenant),
            eq(eventOutbox.eventType, normalizedType),
            eq(eventOutbox.aggregateId, normalizedAggregate),
            eq(eventOutbox.status, 'publishing'),
            eq(eventOutbox.ownerToken, normalizedOwner)
          )
        )
        .returning(),
      'eventOutbox.markPublished'
    );

    if (Array.isArray(updatedRows) && updatedRows.length > 0 && updatedRows[0] !== undefined) {
      return mapRowToRecord(updatedRows[0]);
    }

    const existing = await this.findIntent(normalizedTenant, normalizedType, normalizedAggregate);
    if (existing?.status === 'published' && existing.ownerToken === normalizedOwner) {
      return existing;
    }
    throw new Error('Outbox publication ownership lost before completion');
  }

  async markFailed(input: {
    tenantId: string;
    eventType: string;
    aggregateId: string;
    ownerToken: string;
    errorMessage: string;
  }): Promise<OutboxIntentRecord> {
    const normalizedTenant = input.tenantId.trim().toLowerCase();
    const normalizedType = input.eventType.trim();
    const normalizedAggregate = input.aggregateId.trim();
    const normalizedOwner = input.ownerToken.trim();
    if (!normalizedOwner) {
      throw new Error('ownerToken is required to mark an outbox intent as failed');
    }

    const updatedRows = await this.runRead(
      this.dbInstance
        .update(eventOutbox)
        .set({
          status: 'failed',
          leaseExpiresAt: null,
          lastError: input.errorMessage,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(eventOutbox.tenantId, normalizedTenant),
            eq(eventOutbox.eventType, normalizedType),
            eq(eventOutbox.aggregateId, normalizedAggregate),
            eq(eventOutbox.status, 'publishing'),
            eq(eventOutbox.ownerToken, normalizedOwner)
          )
        )
        .returning(),
      'eventOutbox.markFailed'
    );

    if (Array.isArray(updatedRows) && updatedRows.length > 0 && updatedRows[0] !== undefined) {
      return mapRowToRecord(updatedRows[0]);
    }

    throw new Error('Outbox publication ownership lost before failure recording');
  }

  async listPendingIntents(
    tenantId: string,
    limit = 50,
    now = new Date()
  ): Promise<OutboxIntentRecord[]> {
    const normalizedTenant = tenantId.trim().toLowerCase();
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(eventOutbox)
        .where(
          and(
            eq(eventOutbox.tenantId, normalizedTenant),
            or(
              eq(eventOutbox.status, 'pending'),
              eq(eventOutbox.status, 'failed'),
              and(
                eq(eventOutbox.status, 'publishing'),
                lte(eventOutbox.leaseExpiresAt, now)
              )
            )
          )
        )
        .limit(limit),
      'eventOutbox.listPending'
    );
    return Array.isArray(rows) ? rows.map(mapRowToRecord) : [];
  }
}
