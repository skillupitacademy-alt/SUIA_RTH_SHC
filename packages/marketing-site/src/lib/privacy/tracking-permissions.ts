import type { ConsentCategory, ConsentState } from "./privacy-flags";

export function hasTrackingPermission(state: ConsentState, category: ConsentCategory) {
  if (category === "functional") {
    return true;
  }

  if (state.expiresAt && Date.parse(state.expiresAt) < Date.now()) {
    return false;
  }

  return Boolean(state.categories[category]);
}

