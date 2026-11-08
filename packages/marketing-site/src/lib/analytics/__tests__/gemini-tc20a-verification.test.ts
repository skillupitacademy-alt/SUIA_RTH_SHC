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

import { getFeatures, upsertFeatures } from "../../ai-features/feature-store";
import { getTouchpoints, recordTouchpoint } from "../attribution/touchpoint-tracker";
import { normalizeAnalyticsEvent } from "../events";
import { evaluateFunnelProgress, getFunnelState } from "../funnel";
import { resolveIdentity } from "../identity/identity-resolver";
import {
  findIdentityNode,
  getIdentityNode,
  listIdentityNodes,
  saveIdentityNode,
} from "../identity/identity-store";
import { addJourneyEvent, buildSankeyExport } from "../journey/journey-builder";
import { getLeadScores, updateLeadScore } from "../lead-scoring";
import { ingestAnalyticsEvent } from "../server/pipeline";
import { endSession, updateSession } from "../session/session-manager";
import { getSessionTimeline, recordSessionInteraction } from "../session/session-timeline";

describe("Gemini Independent TC20-A Security & Boundary Verification", () => {
  const sharedAnon = "gemini-iso-anon-999";
  const sharedSession = "gemini-iso-sess-999";
  const sharedUser = "gemini-iso-user-999";
  const sharedEmail = "gemini.tester@example.com";
  const sharedPhone = "+919988776655";

  describe("1. Downstream Store Rigorous Cross-Brand Isolation", () => {
    it("strictly isolates identity resolution and graph lookups between realtutorialhub and skillupitacademy", () => {
      // Resolve identity for realtutorialhub
      const rthIdentity = resolveIdentity({
        brandId: "realtutorialhub",
        anonymousId: sharedAnon,
        sessionId: sharedSession,
        userId: sharedUser,
        email: sharedEmail,
        phone: sharedPhone,
      });

      // Resolve identity with identical identifiers for skillupitacademy
      const suiaIdentity = resolveIdentity({
        brandId: "skillupitacademy",
        anonymousId: sharedAnon,
        sessionId: sharedSession,
        userId: sharedUser,
        email: sharedEmail,
        phone: sharedPhone,
      });

      // Node IDs must be brand-prefixed and distinct
      expect(rthIdentity.node.id.startsWith("identity:realtutorialhub:")).toBe(true);
      expect(suiaIdentity.node.id.startsWith("identity:skillupitacademy:")).toBe(true);
      expect(rthIdentity.node.id).not.toBe(suiaIdentity.node.id);

      // Store lookups by key must only return the node within that brand
      const rthLookup = findIdentityNode("realtutorialhub", "anonymous_id", sharedAnon);
      const suiaLookup = findIdentityNode("skillupitacademy", "anonymous_id", sharedAnon);

      expect(rthLookup).toBeDefined();
      expect(rthLookup?.id).toBe(rthIdentity.node.id);
      expect(rthLookup?.brandId).toBe("realtutorialhub");

      expect(suiaLookup).toBeDefined();
      expect(suiaLookup?.id).toBe(suiaIdentity.node.id);
      expect(suiaLookup?.brandId).toBe("skillupitacademy");

      // Cross-lookup using opposite brandId must not leak
      const crossLookup = getIdentityNode("realtutorialhub", suiaIdentity.node.id);
      expect(crossLookup).toBeUndefined();

      // Node listings per brand are disjoint
      const rthNodes = listIdentityNodes("realtutorialhub");
      const suiaNodes = listIdentityNodes("skillupitacademy");
      expect(rthNodes.some((n) => n.id === suiaIdentity.node.id)).toBe(false);
      expect(suiaNodes.some((n) => n.id === rthIdentity.node.id)).toBe(false);
    });

    it("strictly isolates session timelines, depths, and quality scores across brands", () => {
      // Record initial page for RTH
      const rthSess1 = updateSession({
        brandId: "realtutorialhub",
        sessionId: sharedSession,
        at: "2026-07-01T10:00:00.000Z",
        type: "page",
        path: "/courses",
      });
      // Record conversion for RTH
      const rthSess2 = updateSession({
        brandId: "realtutorialhub",
        sessionId: sharedSession,
        at: "2026-07-01T10:05:00.000Z",
        type: "conversion",
        path: "/courses/sql/enroll",
      });

      expect(rthSess1.sessionDepth).toBe(1);
      expect(rthSess2.sessionDepth).toBe(2);

      // Now record a single page for SUIA with the SAME sessionId
      const suiaSess1 = updateSession({
        brandId: "skillupitacademy",
        sessionId: sharedSession,
        at: "2026-07-01T11:00:00.000Z",
        type: "page",
        path: "/certifications",
      });

      // SUIA session depth must be 1, NOT 3 (proving zero leakage of RTH events)
      expect(suiaSess1.sessionDepth).toBe(1);
      expect(suiaSess1.brandId).toBe("skillupitacademy");

      const rthTimeline = getSessionTimeline("realtutorialhub", sharedSession);
      const suiaTimeline = getSessionTimeline("skillupitacademy", sharedSession);

      expect(rthTimeline).toBeDefined();
      expect(rthTimeline?.interactions.length).toBe(2);
      expect(suiaTimeline).toBeDefined();
      expect(suiaTimeline?.interactions.length).toBe(1);
      expect(suiaTimeline?.interactions[0].path).toBe("/certifications");

      // Ending session on SUIA returns closed snapshot and does not mutate RTH session snapshot
      const suiaClosed = endSession("skillupitacademy", sharedSession);
      expect(suiaClosed).toBeDefined();
      expect(suiaClosed?.active).toBe(false);
      expect(suiaClosed?.brandId).toBe("skillupitacademy");

      // RTH timeline remains intact and untouched
      const rthUntouched = getSessionTimeline("realtutorialhub", sharedSession);
      expect(rthUntouched?.interactions.length).toBe(2);
    });

    it("strictly isolates lead scores and qualification segments between brands", () => {
      const envelopeRTH = normalizeAnalyticsEvent({
        name: "education.payment_completed",
        payload: {
          checkoutId: "chk_gemini_1",
          paymentId: "pay_gemini_1",
          paymentProvider: "razorpay",
          courseSlug: "sql-mastery",
          courseName: "SQL Mastery",
          value: 4999,
          currency: "INR",
        },
        context: {
          brandId: "realtutorialhub",
          schemaVersion: 1,
          user: { anonymousId: sharedAnon, loggedInState: "anonymous" },
          session: { sessionId: sharedSession, requestId: "req-gemini-rth", occurredAt: "2026-07-01T12:00:00.000Z" },
          metadata: {},
        },
      });

      // Update lead score on RTH (+50 points)
      const rthScore = updateLeadScore(envelopeRTH);
      expect(rthScore.score).toBeGreaterThanOrEqual(50);
      expect(rthScore.brandId).toBe("realtutorialhub");

      // SUIA with same anonymousId and sessionId must have NO score records
      const suiaScores = getLeadScores("skillupitacademy");
      const suiaScoreMatch = suiaScores.find((s) => s.anonymousId === sharedAnon || s.sessionId === sharedSession);
      expect(suiaScoreMatch).toBeUndefined();

      // Now add a low-value event on SUIA (+2 points)
      const envelopeSUIA = normalizeAnalyticsEvent({
        name: "education.page_viewed",
        payload: {},
        context: {
          brandId: "skillupitacademy",
          schemaVersion: 1,
          user: { anonymousId: sharedAnon, loggedInState: "anonymous" },
          session: { sessionId: sharedSession, requestId: "req-gemini-suia", occurredAt: "2026-07-01T12:01:00.000Z" },
          metadata: {},
        },
      });

      const suiaScore = updateLeadScore(envelopeSUIA);
      expect(suiaScore.score).toBe(2);
      expect(suiaScore.brandId).toBe("skillupitacademy");

      // Ensure RTH score was not modified by the SUIA event
      const rthScores = getLeadScores("realtutorialhub");
      const rthScoreMatch = rthScores.find((s) => s.anonymousId === sharedAnon);
      expect(rthScoreMatch?.score).toBe(rthScore.score);
    });

    it("strictly isolates funnel states across brands for colliding sessions", () => {
      // Progress funnel on RTH
      const rthFunnelEvent = normalizeAnalyticsEvent({
        name: "education.course_enroll_clicked",
        payload: {
          courseSlug: "full-stack-dev",
          courseName: "Full Stack Development",
          buttonLocation: "hero_cta",
        },
        context: {
          brandId: "realtutorialhub",
          schemaVersion: 1,
          user: { anonymousId: sharedAnon, loggedInState: "anonymous" },
          session: { sessionId: sharedSession, requestId: "req-funnel-rth", occurredAt: "2026-07-01T13:00:00.000Z" },
          metadata: {},
        },
      });

      const rthActiveFunnels = evaluateFunnelProgress(rthFunnelEvent);
      expect(rthActiveFunnels.length).toBeGreaterThan(0);

      // Verify SUIA has no funnel progress for sharedSession
      const suiaFunnels = getFunnelState("skillupitacademy");
      const suiaFunnelMatch = suiaFunnels.find(
        (f) => f.sessionId === sharedSession && f.funnelId === "instagram_landing_course_whatsapp_payment"
      );
      expect(suiaFunnelMatch).toBeUndefined();
    });

    it("strictly isolates journey builder, attribution, and AI feature stores via brand-scoped identities", () => {
      const rthIdentityId = `identity:realtutorialhub:anon:${sharedAnon}`;
      const suiaIdentityId = `identity:skillupitacademy:anon:${sharedAnon}`;

      // Upsert independent features
      upsertFeatures(rthIdentityId, { intentScore: 92, segment: "enterprise" });
      upsertFeatures(suiaIdentityId, { intentScore: 14, segment: "casual" });

      const rthFeatures = getFeatures(rthIdentityId);
      const suiaFeatures = getFeatures(suiaIdentityId);

      expect(rthFeatures.intentScore).toBe(92);
      expect(rthFeatures.segment).toBe("enterprise");
      expect(suiaFeatures.intentScore).toBe(14);
      expect(suiaFeatures.segment).toBe("casual");

      // Record independent touchpoints
      recordTouchpoint(rthIdentityId, {
        source: "instagram",
        medium: "social",
        campaign: "rth-campaign",
        occurredAt: "2026-07-01T10:00:00.000Z",
      });
      recordTouchpoint(suiaIdentityId, {
        source: "google",
        medium: "search",
        campaign: "suia-campaign",
        occurredAt: "2026-07-01T11:00:00.000Z",
      });

      const rthTouchpoints = getTouchpoints(rthIdentityId);
      const suiaTouchpoints = getTouchpoints(suiaIdentityId);

      expect(rthTouchpoints.some((tp) => tp.campaign === "rth-campaign")).toBe(true);
      expect(rthTouchpoints.some((tp) => tp.campaign === "suia-campaign")).toBe(false);
      expect(suiaTouchpoints.some((tp) => tp.campaign === "suia-campaign")).toBe(true);
      expect(suiaTouchpoints.some((tp) => tp.campaign === "rth-campaign")).toBe(false);

      // Journey events
      const dummyEvent = normalizeAnalyticsEvent({
        name: "education.page_viewed",
        payload: {},
        context: {
          brandId: "realtutorialhub",
          schemaVersion: 1,
          user: { anonymousId: sharedAnon, loggedInState: "anonymous" },
          session: { sessionId: sharedSession, requestId: "req-j-1", occurredAt: "2026-07-01T10:00:00.000Z" },
          metadata: {},
        },
      });
      addJourneyEvent(rthIdentityId, dummyEvent);

      const rthSankey = buildSankeyExport(rthIdentityId);
      const suiaSankey = buildSankeyExport(suiaIdentityId);

      expect(rthSankey.path.length).toBeGreaterThan(0);
      expect(suiaSankey.path.length).toBe(0);
    });
  });

  describe("2. Fail-Closed Security Boundary Checks", () => {
    const invalidBrands = [
      undefined,
      null,
      "",
      "rogue-brand",
      "shc",
      "realtutorialhub; DROP TABLE analytics;",
      "__proto__",
    ];

    it("rejects invalid/untrusted brandId in resolveIdentity with zero mutation", () => {
      for (const invalidBrand of invalidBrands) {
        expect(() => {
          resolveIdentity({
            brandId: invalidBrand as any,
            anonymousId: "anon-invalid",
            sessionId: "sess-invalid",
          });
        }).toThrow("invalid_analytics_brand");
      }
    });

    it("rejects invalid/untrusted brandId in identity-store methods", () => {
      for (const invalidBrand of invalidBrands) {
        expect(() => {
          findIdentityNode(invalidBrand as any, "anonymous_id", "anon-invalid");
        }).toThrow("invalid_analytics_brand");

        expect(() => {
          getIdentityNode(invalidBrand as any, "node-1");
        }).toThrow("invalid_analytics_brand");

        expect(() => {
          listIdentityNodes(invalidBrand as any);
        }).toThrow("invalid_analytics_brand");

        expect(() => {
          saveIdentityNode({
            brandId: invalidBrand as any,
            id: "node-invalid",
            identifiers: {},
            confidence: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        }).toThrow("invalid_analytics_brand");
      }
    });

    it("rejects invalid/untrusted brandId in session manager and session timeline", () => {
      for (const invalidBrand of invalidBrands) {
        expect(() => {
          updateSession({
            brandId: invalidBrand as any,
            sessionId: "sess-invalid",
            at: "2026-07-01T14:00:00.000Z",
            type: "page",
          });
        }).toThrow("invalid_analytics_brand");

        expect(() => {
          endSession(invalidBrand as any, "sess-invalid");
        }).toThrow("invalid_analytics_brand");

        expect(() => {
          recordSessionInteraction(invalidBrand as any, "sess-invalid", {
            at: "2026-07-01T14:00:00.000Z",
            type: "page",
          });
        }).toThrow("invalid_analytics_brand");

        expect(() => {
          getSessionTimeline(invalidBrand as any, "sess-invalid");
        }).toThrow("invalid_analytics_brand");
      }
    });

    it("rejects invalid/untrusted brandId in lead scoring and funnel", () => {
      for (const invalidBrand of invalidBrands) {
        expect(() => {
          getLeadScores(invalidBrand as any);
        }).toThrow("invalid_analytics_brand");

        expect(() => {
          getFunnelState(invalidBrand as any);
        }).toThrow("invalid_analytics_brand");
      }
    });
  });

  describe("3. End-to-End Pipeline Ingestion Isolation & Deduplication", () => {
    it("deduplicates only within the same brand while allowing independent processing in parallel brand", async () => {
      const collisionBody = {
        name: "education.course_viewed",
        payload: { courseSlug: "gemini-verified-python", courseName: "Python Mastery" },
        context: {
          brandId: "realtutorialhub",
          schemaVersion: 1,
          user: { anonymousId: "gemini-pipe-anon", loggedInState: "anonymous" },
          session: {
            sessionId: "gemini-pipe-session",
            requestId: "gemini-pipe-req-1",
            occurredAt: "2026-07-01T15:00:00.000Z",
          },
          metadata: {},
        },
      };

      // Ingest into RealTutorialHub
      const rthResult1 = await ingestAnalyticsEvent({
        body: collisionBody,
        ipAddress: "127.0.0.1",
        brandId: "realtutorialhub",
      });
      expect(rthResult1.accepted).toBe(true);
      expect(rthResult1.deduped).toBe(false);

      // Retry identical event in RealTutorialHub -> must be deduped
      const rthRetry = await ingestAnalyticsEvent({
        body: collisionBody,
        ipAddress: "127.0.0.1",
        brandId: "realtutorialhub",
      });
      expect(rthRetry.accepted).toBe(true);
      expect(rthRetry.deduped).toBe(true);

      // Ingest identical body into SkillUpITAcademy -> must NOT be deduped across brands
      const suiaResult = await ingestAnalyticsEvent({
        body: {
          ...collisionBody,
          context: {
            ...collisionBody.context,
            brandId: "skillupitacademy",
          },
        },
        ipAddress: "127.0.0.1",
        brandId: "skillupitacademy",
      });
      expect(suiaResult.accepted).toBe(true);
      expect(suiaResult.deduped).toBe(false);
    });

    it("rejects pipeline event when context brand does not match valid analytics brands", async () => {
      const invalidEvent = {
        name: "education.page_viewed",
        payload: {},
        context: {
          brandId: "unapproved-brand",
          schemaVersion: 1,
          user: { anonymousId: "anon-unapproved" },
          session: { sessionId: "sess-unapproved", occurredAt: new Date().toISOString() },
        },
      };

      await expect(
        ingestAnalyticsEvent({
          body: invalidEvent,
          ipAddress: "127.0.0.1",
          brandId: "unapproved-brand" as any,
        })
      ).rejects.toThrow();
    });
  });
});
