import { describe, expect, it } from "vitest";

import { assignExperiment } from "../../feature-flags/experiment-engine";
import { isFeatureEnabled } from "../../feature-flags/rollout-manager";
import { resolveIdentity } from "../identity/identity-resolver";
import { updateSession } from "../session/session-manager";
import { getConsentState } from "../../privacy/consent-manager";
import { defaultConsentState } from "../../privacy/privacy-flags";

describe("marketing phase 2 systems", () => {
  it("resolves and stitches identity with deterministic identifiers", () => {
    const resolved = resolveIdentity({
      anonymousId: "anon_a",
      sessionId: "sess_a",
      userId: "user_1",
      email: "user@example.com",
      phone: "+911234567890",
      campaignId: "camp_1",
    });

    expect(resolved.node.identifiers.user_id).toBe("user_1");
    expect(resolved.node.confidence).toBeGreaterThan(0.3);
  });

  it("computes advanced session quality", () => {
    const first = updateSession({
      sessionId: "sess_quality",
      at: "2026-05-26T10:00:00.000Z",
      type: "page",
      path: "/",
    });
    const second = updateSession({
      sessionId: "sess_quality",
      at: "2026-05-26T10:03:00.000Z",
      type: "conversion",
      path: "/checkout",
    });

    expect(first.sessionDepth).toBe(1);
    expect(second.qualityScore).toBeGreaterThan(0);
  });

  it("supports experimentation rollout targeting", () => {
    const enabled = isFeatureEnabled("analytics_sdk_v2", {
      brandId: "realtutorialhub",
      environment: "production",
      anonymousId: "anon_rollout",
    });
    const assignment = assignExperiment("hero_cta_test", "anon_rollout");

    expect(enabled).toBe(true);
    expect(["control", "variant_a", "variant_b"]).toContain(assignment.variant);
  });

  it("keeps privacy defaults restrictive before opt-in", () => {
    const consent = getConsentState();

    expect(consent.categories.analytics).toBe(defaultConsentState.categories.analytics);
    expect(consent.categories.advertising).toBe(defaultConsentState.categories.advertising);
  });
});

