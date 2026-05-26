import { subscribe } from "./event-bus";
import type { EventTopic } from "./event-router";

export function registerConsumer(topic: EventTopic, consumer: (payload: Record<string, unknown>) => Promise<void> | void) {
  subscribe(topic, consumer);
}

