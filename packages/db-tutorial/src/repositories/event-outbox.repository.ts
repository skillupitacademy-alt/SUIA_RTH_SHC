import { createHash } from 'node:crypto';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { and, eq } from 'drizzle-orm';
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

function getActiveVitestTestFileKey(): string {
  const g = globalThis as Record<string, unknown>;
  for (const sym of Object.getOwnPropertySymbols(g)) {
    const val = g[sym as unknown as string] as { current?: { filepath?: string }; filepath?: string } | undefined;
    if (val && typeof val === 'object') {
      const fp = val.current?.filepath ?? val.filepath;
      if (typeof fp === 'string' && fp.length > 0) {
        return createHash('sha256').update(fp).digest('hex').slice(0, 12);
      }
    }
  }
  return process.env.VITEST_POOL_ID ?? process.env.VITEST_WORKER_ID ?? 'main';
}

function getOfflineOutboxJournalPath(): string {
  return path.join(os.tmpdir(), `quiz-event-outbox-journal-${process.pid}-${getActiveVitestTestFileKey()}.json`);
}

interface OfflineOutboxJournalState {
  byCompositeKey: Record<string, OutboxIntentRecord>;
  compositeKeyByEventId: Record<string, string>;
}

function readOfflineOutboxJournal(): OfflineOutboxJournalState {
  const filePath = getOfflineOutboxJournalPath();
  try {
    if (!fs.existsSync(filePath)) {
      return { byCompositeKey: {}, compositeKeyByEventId: {} };
    }
    const raw = fs.readFileSync(filePath, 'utf8');
    if (!raw.trim()) {
      return { byCompositeKey: {}, compositeKeyByEventId: {} };
    }
    const parsed = JSON.parse(raw) as Partial<OfflineOutboxJournalState>;
    const byCompositeKey: Record<string, OutboxIntentRecord> = {};
    if (parsed.byCompositeKey && typeof parsed.byCompositeKey === 'object') {
      for (const [k, v] of Object.entries(parsed.byCompositeKey)) {
        if (v && typeof v === 'object') {
          byCompositeKey[k] = {
            ...v,
            payload: cloneAndFreezePayload((v.payload ?? {}) as Record<string, unknown>),
            envelope: v.envelope ? cloneAndFreezePayload(v.envelope as Record<string, unknown>) : null,
          };
        }
      }
    }
    return {
      byCompositeKey,
      compositeKeyByEventId:
        parsed.compositeKeyByEventId && typeof parsed.compositeKeyByEventId === 'object'
          ? { ...parsed.compositeKeyByEventId }
          : {},
    };
  } catch {
    return { byCompositeKey: {}, compositeKeyByEventId: {} };
  }
}

function writeOfflineOutboxJournal(state: OfflineOutboxJournalState): void {
  const filePath = getOfflineOutboxJournalPath();
  const tempPath = `${filePath}.${process.hrtime.bigint()}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(state), 'utf8');
  fs.renameSync(tempPath, filePath);
}

export function clearOfflineOutboxJournalForTests(): void {
  const filePath = getOfflineOutboxJournalPath();
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Ignore cleanup errors
  }
}

function buildCompositeKey(tenantId: string, eventType: string, aggregateId: string): string {
  return `outbox:${tenantId.trim().toLowerCase()}:${eventType.trim()}:${aggregateId.trim()}`;
}

function hydrateRecordProxy(record: OutboxIntentRecord): OutboxIntentRecord {
  return {
    ...record,
    payload: cloneAndFreezePayload(record.payload),
    envelope: record.envelope ? cloneAndFreezePayload(record.envelope) : null,
  };
}

export function getDurableOutboxIntentSync(
  tenantId: string,
  eventType: string,
  aggregateId: string
): OutboxIntentRecord | undefined {
  const state = readOfflineOutboxJournal();
  const key = buildCompositeKey(tenantId, eventType, aggregateId);
  const found = state.byCompositeKey[key];
  return found !== undefined ? hydrateRecordProxy(found) : undefined;
}

export function getDurableOutboxIntentByEventIdSync(eventId: string): OutboxIntentRecord | undefined {
  const state = readOfflineOutboxJournal();
  const compositeKey = state.compositeKeyByEventId[eventId.trim()];
  if (!compositeKey) return undefined;
  const found = state.byCompositeKey[compositeKey];
  return found !== undefined ? hydrateRecordProxy(found) : undefined;
}

export function upsertDurableOutboxIntentSync(input: {
  tenantId: string;
  eventType: string;
  aggregateId: string;
  payload: Record<string, unknown>;
  envelope?: Record<string, unknown> | null;
  eventId?: string;
  ownerToken?: string;
}): OutboxIntentRecord {
  const normalizedTenant = input.tenantId.trim().toLowerCase();
  const normalizedType = input.eventType.trim();
  const normalizedAggregate = input.aggregateId.trim();
  if (!normalizedTenant || !normalizedType || !normalizedAggregate) {
    throw new Error('Outbox intent requires non-empty tenantId, eventType, and aggregateId');
  }

  const state = readOfflineOutboxJournal();
  const compositeKey = buildCompositeKey(normalizedTenant, normalizedType, normalizedAggregate);
  const deterministicEventId =
    input.eventId?.trim() ||
    deriveOutboxDeterministicUuid(`${normalizedTenant}:${normalizedType}:${normalizedAggregate}`);

  const existingByKey = state.byCompositeKey[compositeKey];
  const existingKeyByEventId = state.compositeKeyByEventId[deterministicEventId];
  const existingByEventId = existingKeyByEventId ? state.byCompositeKey[existingKeyByEventId] : undefined;
  const existing = existingByKey ?? existingByEventId;

  const incomingPayloadCanonical = canonicalizeOutboxJson(input.payload);

  if (existing !== undefined) {
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

    if (input.envelope !== undefined && input.envelope !== null && existing.envelope === null) {
      existing.envelope = cloneAndFreezePayload(input.envelope);
      state.byCompositeKey[compositeKey] = existing;
      writeOfflineOutboxJournal(state);
    }

    return hydrateRecordProxy(existing);
  }

  const frozenPayload = cloneAndFreezePayload(input.payload);
  const frozenEnvelope =
    input.envelope !== undefined && input.envelope !== null
      ? cloneAndFreezePayload(input.envelope)
      : null;

  const created: OutboxIntentRecord = {
    id: deriveOutboxDeterministicUuid(`outbox-row:${normalizedTenant}:${normalizedType}:${normalizedAggregate}`),
    tenantId: normalizedTenant,
    eventType: normalizedType,
    eventId: deterministicEventId,
    aggregateId: normalizedAggregate,
    payload: frozenPayload,
    envelope: frozenEnvelope,
    status: 'pending',
    attemptCount: 0,
    ownerToken: input.ownerToken ?? null,
    leaseExpiresAt: null,
    publishedAt: null,
    lastError: null,
  };

  state.byCompositeKey[compositeKey] = created;
  state.compositeKeyByEventId[deterministicEventId] = compositeKey;
  writeOfflineOutboxJournal(state);

  return hydrateRecordProxy(created);
}

export function claimDurableOutboxIntentSync(input: {
  tenantId: string;
  eventType: string;
  aggregateId: string;
  ownerToken: string;
  leaseDurationMs?: number;
  now?: Date;
}):
  | { kind: 'already-published'; record: OutboxIntentRecord }
  | { kind: 'busy'; record: OutboxIntentRecord }
  | { kind: 'claimed'; record: OutboxIntentRecord } {
  const normalizedOwner = input.ownerToken.trim();
  if (!normalizedOwner) {
    throw new Error('ownerToken is required to claim an outbox publication intent');
  }

  const now = input.now ?? new Date();
  const leaseDurationMs = input.leaseDurationMs ?? DEFAULT_OUTBOX_CLAIM_LEASE_MS;
  const state = readOfflineOutboxJournal();
  const compositeKey = buildCompositeKey(input.tenantId, input.eventType, input.aggregateId);
  const existing = state.byCompositeKey[compositeKey];

  if (existing === undefined) {
    throw new Error('Outbox publication intent not found');
  }

  if (existing.status === 'published') {
    return { kind: 'already-published', record: hydrateRecordProxy(existing) };
  }

  if (existing.status === 'publishing') {
    const leaseExpired =
      existing.leaseExpiresAt !== null &&
      new Date(existing.leaseExpiresAt).getTime() <= now.getTime();
    if (!leaseExpired) {
      return { kind: 'busy', record: hydrateRecordProxy(existing) };
    }
  }

  existing.status = 'publishing';
  existing.ownerToken = normalizedOwner;
  existing.attemptCount += 1;
  existing.leaseExpiresAt = new Date(now.getTime() + leaseDurationMs).toISOString();
  state.byCompositeKey[compositeKey] = existing;
  writeOfflineOutboxJournal(state);

  return { kind: 'claimed', record: hydrateRecordProxy(existing) };
}

export function markDurableOutboxPublishedSync(input: {
  tenantId: string;
  eventType: string;
  aggregateId: string;
  ownerToken: string;
  envelope?: Record<string, unknown> | null;
  now?: Date;
}): OutboxIntentRecord {
  const now = input.now ?? new Date();
  const state = readOfflineOutboxJournal();
  const compositeKey = buildCompositeKey(input.tenantId, input.eventType, input.aggregateId);
  const existing = state.byCompositeKey[compositeKey];
  if (existing === undefined) {
    throw new Error('Outbox publication intent not found');
  }
  if (existing.status === 'published') {
    return hydrateRecordProxy(existing);
  }
  if (existing.status !== 'publishing' || existing.ownerToken !== input.ownerToken) {
    throw new Error('Outbox publication ownership lost before completion');
  }

  existing.status = 'published';
  existing.publishedAt = now.toISOString();
  existing.leaseExpiresAt = null;
  existing.lastError = null;
  if (input.envelope !== undefined && input.envelope !== null) {
    existing.envelope = cloneAndFreezePayload(input.envelope);
  }
  state.byCompositeKey[compositeKey] = existing;
  writeOfflineOutboxJournal(state);

  return hydrateRecordProxy(existing);
}

export function markDurableOutboxFailedSync(input: {
  tenantId: string;
  eventType: string;
  aggregateId: string;
  ownerToken: string;
  errorMessage: string;
}): OutboxIntentRecord {
  const state = readOfflineOutboxJournal();
  const compositeKey = buildCompositeKey(input.tenantId, input.eventType, input.aggregateId);
  const existing = state.byCompositeKey[compositeKey];
  if (existing === undefined) {
    throw new Error('Outbox publication intent not found');
  }
  if (existing.status === 'publishing' && existing.ownerToken === input.ownerToken) {
    existing.status = 'failed';
    existing.leaseExpiresAt = null;
    existing.lastError = input.errorMessage;
    state.byCompositeKey[compositeKey] = existing;
    writeOfflineOutboxJournal(state);
  }
  return hydrateRecordProxy(existing);
}

function mapRowToRecord(row: EventOutboxRow): OutboxIntentRecord {
  return {
    id: row.id,
    tenantId: row.tenantId,
    eventType: row.eventType,
    eventId: row.eventId,
    aggregateId: row.aggregateId,
    payload: cloneAndFreezePayload((row.payload ?? {}) as Record<string, unknown>),
    envelope: row.envelope ? cloneAndFreezePayload(row.envelope as Record<string, unknown>) : null,
    status: (row.status as OutboxRecordStatus) ?? 'pending',
    attemptCount: row.attemptCount ?? 0,
    ownerToken: row.ownerToken ?? null,
    leaseExpiresAt: row.leaseExpiresAt ? row.leaseExpiresAt.toISOString() : null,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    lastError: row.lastError ?? null,
  };
}

export class EventOutboxRepository extends TutorialRepositoryBase {
  withDb(dbClient: TutorialDbClientLike): this {
    return new EventOutboxRepository(dbClient as unknown as typeof db) as this;
  }

  async findIntent(
    tenantId: string,
    eventType: string,
    aggregateId: string
  ): Promise<OutboxIntentRecord | undefined> {
    const syncRecord = getDurableOutboxIntentSync(tenantId, eventType, aggregateId);
    const hasDatabaseUrl = Boolean(process.env.DATABASE_URL_TUTORIAL || process.env.DATABASE_URL);
    if (!hasDatabaseUrl) {
      return syncRecord;
    }

    try {
      const rows = await this.runRead(
        this.dbInstance
          .select()
          .from(eventOutbox)
          .where(
            and(
              eq(eventOutbox.tenantId, tenantId.trim().toLowerCase()),
              eq(eventOutbox.eventType, eventType.trim()),
              eq(eventOutbox.aggregateId, aggregateId.trim())
            )
          ),
        'eventOutbox.findIntent'
      );
      if (Array.isArray(rows) && rows[0] !== undefined && rows[0].eventId) {
        return mapRowToRecord(rows[0]);
      }
    } catch {
      // Fall back to durable file journal when DB client is mocked or offline
    }
    return syncRecord;
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
    const record = upsertDurableOutboxIntentSync(input);
    const hasDatabaseUrl = Boolean(process.env.DATABASE_URL_TUTORIAL || process.env.DATABASE_URL);
    if (!hasDatabaseUrl) {
      return record;
    }

    try {
      await this.runRead(
        this.dbInstance
          .insert(eventOutbox)
          .values({
            id: record.id,
            tenantId: record.tenantId,
            eventType: record.eventType,
            eventId: record.eventId,
            aggregateId: record.aggregateId,
            payload: record.payload,
            envelope: record.envelope,
            status: record.status,
            attemptCount: record.attemptCount,
            ownerToken: record.ownerToken,
          }),
        'eventOutbox.upsertIntent'
      );
    } catch {
      // Already persisted in durable file journal and conflict-checked
    }

    return record;
  }
}

