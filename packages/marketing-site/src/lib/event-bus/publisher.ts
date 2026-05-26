import { publish } from "./event-bus";
import type { EventTopic } from "./event-router";

export function publishEvent(topic: EventTopic, payload: Record<string, unknown>) {
  return publish(topic, payload);
}

