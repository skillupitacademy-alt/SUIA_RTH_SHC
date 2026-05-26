import type { AnalyticsEventEnvelope, AnalyticsEventName } from "./events";
import type { LeadScoreSnapshot } from "./lead-scoring";

export interface AutomationAction {
  channel: "email" | "whatsapp" | "crm" | "internal";
  template: string;
  delayMinutes: number;
}

export interface AutomationRule {
  id: string;
  name: string;
  triggerEvents: AnalyticsEventName[];
  minimumLeadScore?: number;
  actions: AutomationAction[];
}

export interface AutomationExecution {
  ruleId: string;
  anonymousId: string;
  scheduledActions: AutomationAction[];
  triggeredAt: string;
}

const automationRules: AutomationRule[] = [
  {
    id: "abandoned_checkout",
    name: "Abandoned Checkout Recovery",
    triggerEvents: ["education.checkout_started"],
    minimumLeadScore: 30,
    actions: [
      { channel: "whatsapp", template: "checkout-recovery-whatsapp", delayMinutes: 15 },
      { channel: "email", template: "checkout-recovery-email", delayMinutes: 60 },
    ],
  },
  {
    id: "inactive_student_recovery",
    name: "Inactive Student Recovery",
    triggerEvents: ["education.lesson_completed"],
    actions: [{ channel: "email", template: "lesson-followup", delayMinutes: 1440 }],
  },
  {
    id: "demo_follow_up",
    name: "Demo Follow-up",
    triggerEvents: ["education.demo_session_booked"],
    minimumLeadScore: 25,
    actions: [
      { channel: "crm", template: "demo-sales-task", delayMinutes: 5 },
      { channel: "email", template: "demo-confirmation", delayMinutes: 1 },
    ],
  },
  {
    id: "certificate_reminder",
    name: "Certification Reminder",
    triggerEvents: ["education.certificate_generated"],
    actions: [{ channel: "email", template: "certificate-share-reminder", delayMinutes: 1440 }],
  },
];

export function evaluateAutomationRules(
  event: AnalyticsEventEnvelope,
  leadScore: LeadScoreSnapshot,
): AutomationExecution[] {
  return automationRules
    .filter((rule) => rule.triggerEvents.includes(event.name))
    .filter((rule) => rule.minimumLeadScore === undefined || leadScore.score >= rule.minimumLeadScore)
    .map((rule) => ({
      ruleId: rule.id,
      anonymousId: event.context.user.anonymousId,
      scheduledActions: rule.actions,
      triggeredAt: event.context.session.occurredAt,
    }));
}

export function getAutomationRules() {
  return automationRules;
}

