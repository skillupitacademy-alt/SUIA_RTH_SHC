import { attributeRevenue } from "./revenue-attribution";
import { recordTouchpoint } from "./touchpoint-tracker";

export function processAttributionEvent(input: {
  identityId: string;
  source?: string;
  medium?: string;
  campaign?: string;
  occurredAt: string;
  revenue?: number;
}) {
  if (input.source) {
    recordTouchpoint(input.identityId, {
      source: input.source,
      medium: input.medium,
      campaign: input.campaign,
      occurredAt: input.occurredAt,
    });
  }

  if (typeof input.revenue === "number") {
    return {
      firstTouch: attributeRevenue(input.identityId, input.revenue, "first_touch"),
      lastTouch: attributeRevenue(input.identityId, input.revenue, "last_touch"),
      linear: attributeRevenue(input.identityId, input.revenue, "linear"),
    };
  }

  return undefined;
}

