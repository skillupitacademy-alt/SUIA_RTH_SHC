export type EventTopic =
  | "analytics.raw"
  | "analytics.validated"
  | "automation.trigger"
  | "crm.sync"
  | "notifications.outbound"
  | "ai.features";

export function getEventPriority(topic: EventTopic) {
  if (topic === "analytics.validated" || topic === "automation.trigger") {
    return "high";
  }
  if (topic === "crm.sync" || topic === "notifications.outbound") {
    return "medium";
  }
  return "low";
}

