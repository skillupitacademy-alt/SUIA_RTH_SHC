import type { AttributionTouchpoint } from "./attribution-models";

const touchpoints = new Map<string, AttributionTouchpoint[]>();

export function recordTouchpoint(identityId: string, touchpoint: AttributionTouchpoint) {
  const current = touchpoints.get(identityId) ?? [];
  touchpoints.set(identityId, [...current, touchpoint]);
  return touchpoints.get(identityId)!;
}

export function getTouchpoints(identityId: string) {
  return touchpoints.get(identityId) ?? [];
}

