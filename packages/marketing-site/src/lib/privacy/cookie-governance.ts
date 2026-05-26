import type { ConsentCategory } from "./privacy-flags";

const categoryCookies: Record<ConsentCategory, string[]> = {
  functional: ["quiz.analytics.consent"],
  analytics: ["_ga", "_gid", "_ga_*"],
  marketing: ["_hjSessionUser_*"],
  advertising: ["_fbp", "_fbc"],
};

export function getGovernedCookies(category: ConsentCategory) {
  return categoryCookies[category];
}

