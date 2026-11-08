import { describe, expect, it, vi } from "vitest";

vi.mock("../../../config/analytics", () => ({
  getAnalyticsRuntimeConfig: ({ brandId }: { brandId: string }) => ({
    rateLimitPerMinute: 100,
    dedupeWindowMs: 60000,
    requestTimeoutMs: 1000,
    brand: { brandId },
  }),
}));

vi.mock("../../event-bus/publisher", () => ({
  publishEvent: vi.fn(async () => undefined),
}));

import { getFeatures } from "../../ai-features/feature-store";
import { getTouchpoints } from "../attribution/touchpoint-tracker";
import { normalizeAnalyticsEvent } from "../events";
import { evaluateFunnelProgress, getFunnelState } from "../funnel";
import { resolveIdentity } from "../identity/identity-resolver";
import {
  findIdentityNode,
  getIdentityNode,
  listIdentityNodes,
  saveIdentityNode,
} from "../identity/identity-store";
import { buildSankeyExport } from "../journey/journey-builder";
import { getLeadScores, updateLeadScore } from "../lead-scoring";
import { ingestAnalyticsEvent } from "../server/pipeline";
import { endSession, updateSession } from "../session/session-manager";
import { getSessionTimeline, recordSessionInteraction } from "../session/session-timeline";

describe("TC20-A downstream analytics brand isolation", () => {
  it("isolates funnel, identity, journey, attribution, and AI features across brands while preserving same-brand continuity", async () => {
    const logSpy = vi.spyOn(console, "info");

    const sharedAnon = "tc20a-shared-anon";
    const sharedSession = "tc20a-shared-session";
    const sharedUser = "tc20a-shared-user";
    const sharedEmail = "student@example.com";
    const sharedPhone = "+919876543210";

    // 1. RealTutorialHub: landing page view + course view
    await ingestAnalyticsEvent({
      brandId: "realtutorialhub",
      ipAddress: "127.0.0.1",
      body: {
        name: "education.page_viewed",
        payload: {},
        context: {
          brandId: "realtutorialhub",
          schemaVersion: 1,
          attribution: { source: "instagram", medium: "social", campaign: "rth-launch" },
          user: { anonymousId: sharedAnon, userId: sharedUser, loggedInState: "authenticated" },
          session: { sessionId: sharedSession, requestId: "req-rth-1", occurredAt: "2026-06-01T10:00:00.000Z" },
          metadata: { hashed_email: sharedEmail, hashed_phone: sharedPhone },
        },
      },
    });

    await ingestAnalyticsEvent({
      brandId: "realtutorialhub",
      ipAddress: "127.0.0.1",
      body: {
        name: "education.course_viewed",
        payload: { courseSlug: "sql-mastery", courseName: "SQL Mastery" },
        context: {
          brandId: "realtutorialhub",
          schemaVersion: 1,
          attribution: { source: "instagram", medium: "social", campaign: "rth-launch" },
          user: { anonymousId: sharedAnon, userId: sharedUser, loggedInState: "authenticated" },
          session: { sessionId: sharedSession, requestId: "req-rth-2", occurredAt: "2026-06-01T10:02:00.000Z" },
          metadata: { hashed_email: sharedEmail, hashed_phone: sharedPhone },
        },
      },
    });

    // 2. SkillUp: identical identifiers, email, phone, and userId on a single page_viewed event
    await ingestAnalyticsEvent({
      brandId: "skillupitacademy",
      ipAddress: "127.0.0.1",
      body: {
        name: "education.page_viewed",
        payload: {},
        context: {
          brandId: "skillupitacademy",
          schemaVersion: 1,
          attribution: { source: "youtube", medium: "video", campaign: "suia-launch" },
          user: { anonymousId: sharedAnon, userId: sharedUser, loggedInState: "authenticated" },
          session: { sessionId: sharedSession, requestId: "req-suia-1", occurredAt: "2026-06-01T10:03:00.000Z" },
          metadata: { hashed_email: sharedEmail, hashed_phone: sharedPhone },
        },
      },
    });

    // Verify Lead Score isolation & same-brand continuity
    const rthScores = getLeadScores("realtutorialhub").filter((s) => s.anonymousId === sharedAnon);
    const suiaScores = getLeadScores("skillupitacademy").filter((s) => s.anonymousId === sharedAnon);
    expect(rthScores).toHaveLength(1);
    expect(rthScores[0].score).toBe(7); // page_viewed (2) + course_viewed (5)
    expect(suiaScores).toHaveLength(1);
    expect(suiaScores[0].score).toBe(2); // page_viewed (2) only

    // Verify Session Timeline isolation & same-brand continuity
    const rthTimeline = getSessionTimeline("realtutorialhub", sharedSession);
    const suiaTimeline = getSessionTimeline("skillupitacademy", sharedSession);
    expect(rthTimeline?.interactions).toHaveLength(2);
    expect(suiaTimeline?.interactions).toHaveLength(1);

    // Verify Funnel progress isolation & same-brand continuity
    const rthFunnels = getFunnelState("realtutorialhub").filter((f) => f.sessionId === sharedSession);
    const suiaFunnels = getFunnelState("skillupitacademy").filter((f) => f.sessionId === sharedSession);
    const rthIgFunnel = rthFunnels.find((f) => f.funnelId === "instagram_landing_course_whatsapp_payment");
    const suiaIgFunnel = suiaFunnels.find((f) => f.funnelId === "instagram_landing_course_whatsapp_payment");
    expect(rthIgFunnel?.completedSteps).toEqual(["landing", "course"]);
    expect(suiaIgFunnel?.completedSteps).toEqual(["landing"]);

    // Verify Identity isolation across matching userId, email, phone, and anonymousId
    const rthIdentity = findIdentityNode("realtutorialhub", "user_id", sharedUser);
    const suiaIdentity = findIdentityNode("skillupitacademy", "user_id", sharedUser);
    expect(rthIdentity).toBeDefined();
    expect(suiaIdentity).toBeDefined();
    expect(rthIdentity!.id).not.toBe(suiaIdentity!.id);
    expect(rthIdentity!.brandId).toBe("realtutorialhub");
    expect(suiaIdentity!.brandId).toBe("skillupitacademy");

    // Verify Journey, Attribution, and AI Features inherit isolation via brand-scoped identity IDs
    const rthJourney = buildSankeyExport(rthIdentity!.id);
    const suiaJourney = buildSankeyExport(suiaIdentity!.id);
    expect(rthJourney.path).toEqual(["education.page_viewed", "education.course_viewed"]);
    expect(suiaJourney.path).toEqual(["education.page_viewed"]);

    const rthTouchpoints = getTouchpoints(rthIdentity!.id);
    const suiaTouchpoints = getTouchpoints(suiaIdentity!.id);
    expect(rthTouchpoints).toHaveLength(2);
    expect(rthTouchpoints[0].source).toBe("instagram");
    expect(suiaTouchpoints).toHaveLength(1);
    expect(suiaTouchpoints[0].source).toBe("youtube");

    const rthFeatures = getFeatures(rthIdentity!.id);
    const suiaFeatures = getFeatures(suiaIdentity!.id);
    expect(rthFeatures.retention_session_depth).toBe(2);
    expect(rthFeatures.recommendation_lead_score).toBe(7);
    expect(suiaFeatures.retention_session_depth).toBe(1);
    expect(suiaFeatures.recommendation_lead_score).toBe(2);

    logSpy.mockRestore();
  });

  it("fails closed and mutates zero state when brandId is missing or unknown across all entry points", () => {
    const rthScoresBefore = getLeadScores("realtutorialhub").length;
    const suiaScoresBefore = getLeadScores("skillupitacademy").length;
    const rthFunnelsBefore = getFunnelState("realtutorialhub").length;
    const suiaFunnelsBefore = getFunnelState("skillupitacademy").length;
    const rthNodesBefore = listIdentityNodes("realtutorialhub").length;
    const suiaNodesBefore = listIdentityNodes("skillupitacademy").length;

    const baseValidEvent = normalizeAnalyticsEvent({
      name: "education.page_viewed",
      payload: {},
      context: {
        brandId: "realtutorialhub",
        schemaVersion: 1,
        user: { anonymousId: "unscoped-anon", loggedInState: "anonymous" },
        session: { sessionId: "unscoped-sess", requestId: "req-unscoped", occurredAt: "2026-06-01T11:00:00.000Z" },
        metadata: {},
      },
    });

    const missingBrandEvent = {
      ...baseValidEvent,
      context: { ...baseValidEvent.context, brandId: undefined as unknown as "realtutorialhub" },
    };
    const unknownBrandEvent = {
      ...baseValidEvent,
      context: { ...baseValidEvent.context, brandId: "skillhubcore" as unknown as "realtutorialhub" },
    };

    // Lead scoring entry points
    expect(() => updateLeadScore(missingBrandEvent)).toThrow("invalid_analytics_brand");
    expect(() => updateLeadScore(unknownBrandEvent)).toThrow("invalid_analytics_brand");
    expect(() => getLeadScores(undefined as unknown as "realtutorialhub")).toThrow("invalid_analytics_brand");
    expect(() => getLeadScores("unknown" as unknown as "realtutorialhub")).toThrow("invalid_analytics_brand");

    // Funnel entry points
    expect(() => evaluateFunnelProgress(missingBrandEvent)).toThrow("invalid_analytics_brand");
    expect(() => evaluateFunnelProgress(unknownBrandEvent)).toThrow("invalid_analytics_brand");
    expect(() => getFunnelState(undefined as unknown as "realtutorialhub")).toThrow("invalid_analytics_brand");
    expect(() => getFunnelState("unknown" as unknown as "realtutorialhub")).toThrow("invalid_analytics_brand");

    // Session timeline & manager entry points
    expect(() =>
      recordSessionInteraction(undefined as unknown as "realtutorialhub", "unscoped-sess", {
        at: "2026-06-01T11:00:00.000Z",
        type: "page",
      }),
    ).toThrow("invalid_analytics_brand");
    expect(() =>
      recordSessionInteraction("unknown" as unknown as "realtutorialhub", "unscoped-sess", {
        at: "2026-06-01T11:00:00.000Z",
        type: "page",
      }),
    ).toThrow("invalid_analytics_brand");
    expect(() => getSessionTimeline(undefined as unknown as "realtutorialhub", "unscoped-sess")).toThrow(
      "invalid_analytics_brand",
    );
    expect(() => getSessionTimeline("unknown" as unknown as "realtutorialhub", "unscoped-sess")).toThrow(
      "invalid_analytics_brand",
    );
    expect(() =>
      updateSession({
        sessionId: "unscoped-sess",
        at: "2026-06-01T11:00:00.000Z",
        type: "page",
      }),
    ).toThrow("invalid_analytics_brand");
    expect(() =>
      updateSession({
        brandId: "unknown" as unknown as "realtutorialhub",
        sessionId: "unscoped-sess",
        at: "2026-06-01T11:00:00.000Z",
        type: "page",
      }),
    ).toThrow("invalid_analytics_brand");
    expect(() => endSession(undefined as unknown as "realtutorialhub", "unscoped-sess")).toThrow(
      "invalid_analytics_brand",
    );
    expect(() => endSession("unknown" as unknown as "realtutorialhub", "unscoped-sess")).toThrow(
      "invalid_analytics_brand",
    );

    // Identity store & resolver entry points
    expect(() =>
      saveIdentityNode({
        id: "identity_unscoped",
        identifiers: { anonymous_id: "unscoped-anon" },
        confidence: 0.5,
        createdAt: "2026-06-01T11:00:00.000Z",
        updatedAt: "2026-06-01T11:00:00.000Z",
      }),
    ).toThrow("invalid_analytics_brand");
    expect(() =>
      saveIdentityNode("unknown" as unknown as "realtutorialhub", {
        id: "identity_unscoped",
        identifiers: { anonymous_id: "unscoped-anon" },
        confidence: 0.5,
        createdAt: "2026-06-01T11:00:00.000Z",
        updatedAt: "2026-06-01T11:00:00.000Z",
      }),
    ).toThrow("invalid_analytics_brand");
    expect(() => findIdentityNode("anonymous_id", "unscoped-anon")).toThrow("invalid_analytics_brand");
    expect(() => findIdentityNode("unknown" as unknown as "realtutorialhub", "anonymous_id", "unscoped-anon")).toThrow(
      "invalid_analytics_brand",
    );
    expect(() => getIdentityNode("identity_unscoped")).toThrow("invalid_analytics_brand");
    expect(() => getIdentityNode("unknown" as unknown as "realtutorialhub", "identity_unscoped")).toThrow(
      "invalid_analytics_brand",
    );
    expect(() => listIdentityNodes(undefined as unknown as "realtutorialhub")).toThrow("invalid_analytics_brand");
    expect(() => listIdentityNodes("unknown" as unknown as "realtutorialhub")).toThrow("invalid_analytics_brand");
    expect(() =>
      resolveIdentity({
        anonymousId: "unscoped-anon",
        sessionId: "unscoped-sess",
      }),
    ).toThrow("invalid_analytics_brand");
    expect(() =>
      resolveIdentity({
        brandId: "unknown" as unknown as "realtutorialhub",
        anonymousId: "unscoped-anon",
        sessionId: "unscoped-sess",
      }),
    ).toThrow("invalid_analytics_brand");

    // Verify zero state mutation across both valid brands
    expect(getLeadScores("realtutorialhub")).toHaveLength(rthScoresBefore);
    expect(getLeadScores("skillupitacademy")).toHaveLength(suiaScoresBefore);
    expect(getFunnelState("realtutorialhub")).toHaveLength(rthFunnelsBefore);
    expect(getFunnelState("skillupitacademy")).toHaveLength(suiaFunnelsBefore);
    expect(listIdentityNodes("realtutorialhub")).toHaveLength(rthNodesBefore);
    expect(listIdentityNodes("skillupitacademy")).toHaveLength(suiaNodesBefore);
    expect(getSessionTimeline("realtutorialhub", "unscoped-sess")).toBeUndefined();
    expect(getSessionTimeline("skillupitacademy", "unscoped-sess")).toBeUndefined();
  });
});

