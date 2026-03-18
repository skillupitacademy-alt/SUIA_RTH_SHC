export const DEFAULT_API_URL = "https://quiz-api-server-581488566988.asia-south1.run.app";

export const stageProfiles = {
  mini: { stages: [{ duration: "1m", target: 3 }] },
  load: { stages: [{ duration: "5m", target: 50 }] },
  stress: { stages: [{ duration: "10m", target: 100 }] },
  spike: { stages: [{ duration: "2m", target: 200 }] },
};

export function resolveProfile(profileName) {
  return stageProfiles[profileName] ?? stageProfiles.mini;
}

export function normalizeApiUrl(value) {
  const base = (value ?? DEFAULT_API_URL).trim().replace(/\/+$/, "");
  return base.length > 0 ? base : DEFAULT_API_URL;
}

