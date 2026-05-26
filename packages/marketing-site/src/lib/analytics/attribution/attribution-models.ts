export type AttributionModel = "first_touch" | "last_touch" | "linear" | "time_decay" | "position_based";

export interface AttributionTouchpoint {
  source: string;
  medium?: string;
  campaign?: string;
  occurredAt: string;
}

export function scoreAttribution(model: AttributionModel, touchpoints: AttributionTouchpoint[]) {
  if (touchpoints.length === 0) return [];

  if (model === "first_touch") {
    return [{ touchpoint: touchpoints[0], credit: 1 }];
  }

  if (model === "last_touch") {
    return [{ touchpoint: touchpoints[touchpoints.length - 1], credit: 1 }];
  }

  if (model === "linear") {
    return touchpoints.map((touchpoint) => ({ touchpoint, credit: 1 / touchpoints.length }));
  }

  if (model === "position_based") {
    return touchpoints.map((touchpoint, index) => ({
      touchpoint,
      credit:
        index === 0 || index === touchpoints.length - 1
          ? 0.4
          : touchpoints.length > 2
            ? 0.2 / (touchpoints.length - 2)
            : 0.1,
    }));
  }

  const now = Date.now();
  const weighted = touchpoints.map((touchpoint) => {
    const ageHours = Math.max(1, (now - Date.parse(touchpoint.occurredAt)) / 3600000);
    return { touchpoint, weight: 1 / ageHours };
  });
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  return weighted.map((item) => ({ touchpoint: item.touchpoint, credit: item.weight / total }));
}

