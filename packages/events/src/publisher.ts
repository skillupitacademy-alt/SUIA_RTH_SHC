import { createHash, randomUUID } from 'node:crypto';
import { Client } from '@upstash/qstash';

import { createEventEnvelope, type EventEnvelope, type PlatformEventPayloadMap, type PlatformEventType } from './types';

export interface PublishEventOptions {
  id?: string;
  tenantId?: string;
  destinationUrl?: string;
  correlationId?: string;
  source?: string;
  occurredAt?: string;
  version?: number;
  headers?: Record<string, string>;
  retries?: number;
  envelope?: EventEnvelope<any, any>;
}

const DOMAIN_TIMESTAMP_KEYS = [
  'occurredAt',
  'issuedAt',
  'completedAt',
  'enrolledAt',
  'createdAt',
  'registeredAt',
  'paidAt',
  'detectedAt',
  'scheduledAt',
  'coveredAt',
  'markedAt',
  'admittedAt',
  'submittedAt',
  'upgradedAt',
  'acceptedAt',
  'requestedAt',
  'publishedAt',
] as const;

function deriveDeterministicUuid(seed: string): string {
  const bytes = Buffer.from(createHash('sha256').update(seed).digest().subarray(0, 16));
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = bytes.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}

function canonicalizePayloadJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  if (Array.isArray(value)) {
    return `[${value.map((item) => canonicalizePayloadJson(item)).join(',')}]`;
  }
  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => a.localeCompare(b));
  return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalizePayloadJson(v)}`).join(',')}}`;
}

function resolvePayloadTimestamp(payload: unknown): string | undefined {
  if (payload === null || typeof payload !== 'object' || Array.isArray(payload)) {
    return undefined;
  }
  const record = payload as Record<string, unknown>;
  for (const key of DOMAIN_TIMESTAMP_KEYS) {
    const candidate = record[key];
    if (typeof candidate === 'string' && candidate.trim().length > 0 && !Number.isNaN(Date.parse(candidate))) {
      return candidate.trim();
    }
  }
  return undefined;
}

interface StoredPublishedEnvelopeEntry {
  tenantScope: string;
  payloadCanonical: string;
  envelope: EventEnvelope<PlatformEventType, unknown>;
}

const GLOBAL_PUBLISHER_LEDGER_KEY = Symbol.for('quiz.events.publisher.ledger');
type PublisherLedgerMap = Map<string, StoredPublishedEnvelopeEntry>;

function getPublisherLedger(): PublisherLedgerMap {
  const g = globalThis as unknown as Record<symbol, PublisherLedgerMap>;
  if (!g[GLOBAL_PUBLISHER_LEDGER_KEY]) {
    g[GLOBAL_PUBLISHER_LEDGER_KEY] = new Map();
  }
  return g[GLOBAL_PUBLISHER_LEDGER_KEY];
}

export function clearPublisherEnvelopeLedgerForTests(): void {
  getPublisherLedger().clear();
}

const getQStashClient = () => {
  const token = process.env.QSTASH_TOKEN;
  if (token === undefined || token.trim().length === 0) {
    throw new Error('QSTASH_TOKEN is required to publish events');
  }

  return new Client({ token });
};

export async function publishEvent<TType extends PlatformEventType>(
  type: TType,
  payload: PlatformEventPayloadMap[TType],
  options: PublishEventOptions = {}
): Promise<{ messageId: string; envelope: EventEnvelope<TType, PlatformEventPayloadMap[TType]> }> {
  const explicitId = typeof options.id === 'string' && options.id.trim().length > 0 ? options.id.trim() : undefined;
  const tenantScope = typeof options.tenantId === 'string' ? options.tenantId.trim().toLowerCase() : '';
  const source = options.source ?? (tenantScope.length > 0 ? tenantScope : 'quiz-platform');
  const version = options.version ?? 1;

  let envelope: EventEnvelope<TType, PlatformEventPayloadMap[TType]>;

  if (options.envelope !== undefined && options.envelope !== null) {
    const providedEnvelope = options.envelope as EventEnvelope<TType, PlatformEventPayloadMap[TType]>;
    const incomingPayloadCanonical = canonicalizePayloadJson(payload);
    const envelopePayloadCanonical = canonicalizePayloadJson(providedEnvelope.data);

    if (
      providedEnvelope.type !== type ||
      (explicitId !== undefined && providedEnvelope.id !== explicitId) ||
      envelopePayloadCanonical !== incomingPayloadCanonical
    ) {
      throw new Error(
        `Conflicting publication envelope or payload for existing event id ${explicitId ?? providedEnvelope.id}`
      );
    }

    const ledgerKey = explicitId ?? providedEnvelope.id;
    if (typeof ledgerKey === 'string' && ledgerKey.trim().length > 0) {
      const ledger = getPublisherLedger();
      const existing = ledger.get(ledgerKey);
      if (
        existing !== undefined &&
        (existing.envelope.type !== type ||
          existing.tenantScope !== tenantScope ||
          existing.payloadCanonical !== incomingPayloadCanonical)
      ) {
        throw new Error(`Conflicting publication envelope or payload for existing event id ${ledgerKey}`);
      }
      ledger.set(ledgerKey, {
        tenantScope,
        payloadCanonical: incomingPayloadCanonical,
        envelope: providedEnvelope,
      });
    }
    envelope = providedEnvelope;
  } else if (explicitId !== undefined) {
    const ledger = getPublisherLedger();
    const existing = ledger.get(explicitId);
    const incomingPayloadCanonical = canonicalizePayloadJson(payload);

    if (existing !== undefined) {
      if (
        existing.envelope.type !== type ||
        existing.tenantScope !== tenantScope ||
        existing.payloadCanonical !== incomingPayloadCanonical ||
        (options.source !== undefined && existing.envelope.source !== options.source) ||
        (options.version !== undefined && existing.envelope.version !== options.version) ||
        (options.correlationId !== undefined && existing.envelope.correlationId !== options.correlationId) ||
        (options.occurredAt !== undefined && existing.envelope.occurredAt !== options.occurredAt)
      ) {
        throw new Error(`Conflicting publication envelope or payload for existing event id ${explicitId}`);
      }
      envelope = existing.envelope as EventEnvelope<TType, PlatformEventPayloadMap[TType]>;
    } else {
      const deterministicCorrelationId =
        options.correlationId ??
        deriveDeterministicUuid(`correlation:${tenantScope}:${type}:${explicitId}`);
      const canonicalOccurredAt =
        options.occurredAt ??
        resolvePayloadTimestamp(payload) ??
        new Date().toISOString();

      envelope = createEventEnvelope(type, payload, {
        id: explicitId,
        correlationId: deterministicCorrelationId,
        source,
        occurredAt: canonicalOccurredAt,
        version,
      });

      ledger.set(explicitId, {
        tenantScope,
        payloadCanonical: incomingPayloadCanonical,
        envelope,
      });
    }
  } else {
    envelope = createEventEnvelope(type, payload, {
      id: randomUUID(),
      correlationId: options.correlationId ?? randomUUID(),
      source,
      occurredAt: options.occurredAt ?? new Date().toISOString(),
      version,
    });
  }

  const destinationUrl = options.destinationUrl;
  if (destinationUrl === undefined || destinationUrl.trim().length === 0) {
    throw new Error('destinationUrl is required to publish an event');
  }

  const client = getQStashClient();
  const result = await client.publishJSON({
    url: destinationUrl,
    body: envelope,
    retries: options.retries ?? 3,
    headers: {
      'content-type': 'application/json',
      'x-event-type': type,
      'x-correlation-id': envelope.correlationId,
      ...(options.headers ?? {}),
    },
  });

  return {
    messageId: result.messageId,
    envelope,
  };
}
