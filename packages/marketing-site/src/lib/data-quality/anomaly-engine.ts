import { detectAnomaly } from "../observability/anomaly-detection";

export function detectVolumeAnomaly(currentCount: number, baselineCount: number) {
  return detectAnomaly({ current: currentCount, baseline: baselineCount, tolerance: 0.4 });
}

