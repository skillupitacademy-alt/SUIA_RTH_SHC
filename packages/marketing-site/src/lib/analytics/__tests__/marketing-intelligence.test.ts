import { describe, expect, it } from "vitest";

import { evaluateAutomationRules } from "../automation";
import { normalizeAnalyticsEvent } from "../events";
import { evaluateFunnelProgress } from "../funnel";
import { updateLeadScore } from "../lead-scoring";

function createEvent(name: "education.course_viewed" | "education.whatsapp_lead_started" | "education.checkout_started") {
  if (name === "education.course_viewed") {
    return normalizeAnalyticsEvent({
      name,
      payload: {
        courseSlug: "data-analyst",
        courseName: "Data Analyst",
      },
      context: {
        brandId: "realtutorialhub",
        schemaVersion: 1,
        page: {
          url: "https://www.realtutorialhub.com/courses/data-analyst",
          path: "/courses/data-analyst",
          hostname: "www.realtutorialhub.com",
        },
        attribution: {
          source: "instagram",
          medium: "social",
          campaign: "summer-bootcamp",
        },
        user: {
          anonymousId: "anon_1",
          loggedInState: "anonymous",
        },
        session: {
          sessionId: "sess_1",
          requestId: "req_1",
          occurredAt: "2026-05-26T12:00:00.000Z",
        },
        metadata: {},
      },
    });
  }

  if (name === "education.whatsapp_lead_started") {
    return normalizeAnalyticsEvent({
      name,
      payload: {
        courseName: "Data Analyst",
        buttonLocation: "Hero",
        leadChannel: "whatsapp",
      },
      context: {
        brandId: "realtutorialhub",
        schemaVersion: 1,
        user: {
          anonymousId: "anon_1",
          loggedInState: "anonymous",
        },
        session: {
          sessionId: "sess_1",
          requestId: "req_2",
          occurredAt: "2026-05-26T12:05:00.000Z",
        },
        metadata: {},
      },
    });
  }

  return normalizeAnalyticsEvent({
    name,
    payload: {
      checkoutId: "chk_1",
      courseSlug: "data-analyst",
      courseName: "Data Analyst",
      value: 9999,
      currency: "INR",
    },
    context: {
      brandId: "realtutorialhub",
      schemaVersion: 1,
      user: {
        anonymousId: "anon_1",
        loggedInState: "anonymous",
      },
      session: {
        sessionId: "sess_1",
        requestId: "req_3",
        occurredAt: "2026-05-26T12:10:00.000Z",
      },
      metadata: {},
    },
  });
}

describe("marketing intelligence lifecycle", () => {
  it("tracks funnel progress across the landing to lead journey", () => {
    const courseView = createEvent("education.course_viewed");
    const lead = createEvent("education.whatsapp_lead_started");

    const firstProgress = evaluateFunnelProgress(courseView);
    const secondProgress = evaluateFunnelProgress(lead);

    expect(firstProgress.some((item) => item.funnelId === "instagram_landing_course_whatsapp_payment")).toBe(true);
    expect(secondProgress.some((item) => item.completedSteps.includes("lead"))).toBe(true);
  });

  it("raises lead score and qualifies automation after checkout intent", () => {
    updateLeadScore(createEvent("education.course_viewed"));
    updateLeadScore(createEvent("education.whatsapp_lead_started"));
    const leadScore = updateLeadScore(createEvent("education.checkout_started"));
    const automations = evaluateAutomationRules(createEvent("education.checkout_started"), leadScore);

    expect(leadScore.score).toBeGreaterThanOrEqual(30);
    expect(leadScore.temperature).toBe("warm");
    expect(automations.some((item) => item.ruleId === "abandoned_checkout")).toBe(true);
  });
});

