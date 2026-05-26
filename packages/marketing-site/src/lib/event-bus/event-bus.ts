import { pushDeadLetterEvent } from "./dead-letter-queue";
import { getEventPriority, type EventTopic } from "./event-router";
import { withRetry } from "./retry-manager";

type EventPayload = Record<string, unknown>;
type Consumer = (payload: EventPayload) => Promise<void> | void;

const consumers = new Map<EventTopic, Consumer[]>();
const replayLog: Array<{ topic: EventTopic; payload: EventPayload; publishedAt: string }> = [];

export function subscribe(topic: EventTopic, consumer: Consumer) {
  const current = consumers.get(topic) ?? [];
  consumers.set(topic, [...current, consumer]);
}

export async function publish(topic: EventTopic, payload: EventPayload) {
  replayLog.push({ topic, payload, publishedAt: new Date().toISOString() });
  const handlers = consumers.get(topic) ?? [];

  await Promise.all(
    handlers.map(async (handler, index) => {
      try {
        await withRetry(async () => {
          await handler(payload);
        });
      } catch (error) {
        pushDeadLetterEvent({
          id: `${topic}_${index}_${Date.now().toString(36)}`,
          topic,
          payload,
          reason: error instanceof Error ? error.message : "unknown_consumer_error",
          failedAt: new Date().toISOString(),
          attempts: 3,
        });
      }
    }),
  );

  return { priority: getEventPriority(topic), consumerCount: handlers.length };
}

export function replayEvents(topic?: EventTopic) {
  return replayLog.filter((entry) => !topic || entry.topic === topic);
}

