import { trackPageView } from "../tracking";

export function trackFunnelLanding(path: string) {
  trackPageView(path);
}

