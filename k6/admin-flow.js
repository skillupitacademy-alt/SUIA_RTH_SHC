import http from "k6/http";
import { check, fail } from "k6";
import { normalizeAdminUrl, normalizeApiUrl, resolveProfile } from "./config.js";

const API_URL = normalizeApiUrl(__ENV.API_URL);
const ADMIN_URL = normalizeAdminUrl(__ENV.ADMIN_URL || __ENV.NEXT_PUBLIC_ADMIN_URL);
const ADMIN_EMAIL = __ENV.ADMIN_EMAIL || "";
const ADMIN_PASSWORD = __ENV.ADMIN_PASSWORD || "";
const PROFILE = __ENV.STAGE_PROFILE || "mini";

export const options = {
  stages: resolveProfile(PROFILE).stages,
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<2000"],
  },
};

function collectCookies(res) {
  const cookies = {};
  for (const [name, values] of Object.entries(res.cookies || {})) {
    if (Array.isArray(values) && values.length > 0 && values[0]?.value !== undefined) {
      cookies[name] = values[0].value;
    }
  }
  return cookies;
}

function cookieHeaderFrom(cookies) {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

function login() {
  const res = http.post(
    `${API_URL}/api/admin/auth/login`,
    JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  check(res, {
    "admin login returned 200": (r) => r.status === 200,
  });

  if (res.status !== 200) {
    throw new Error(`Admin login failed: ${res.status} ${res.body}`);
  }

  const cookies = collectCookies(res);
  return {
    cookies,
    csrfToken: cookies.csrfToken || "",
    cookieHeader: cookieHeaderFrom(cookies),
  };
}

function getWithSession(baseUrl, path, session) {
  return http.get(`${baseUrl}${path}`, {
    headers: {
      Cookie: session.cookieHeader,
    },
  });
}

export default function () {
  if (ADMIN_EMAIL === "") {
    fail("ADMIN_EMAIL is required");
  }
  if (ADMIN_PASSWORD === "") {
    fail("ADMIN_PASSWORD is required");
  }

  const session = login();

  const usersRes = getWithSession(API_URL, "/api/admin/users?page=1&limit=20", session);
  check(usersRes, {
    "admin users returned 200": (r) => r.status === 200,
  });
  if (usersRes.status !== 200) {
    throw new Error(`Admin users fetch failed: ${usersRes.status} ${usersRes.body}`);
  }

  const questionsRes = getWithSession(API_URL, "/api/admin/questions?page=1&limit=20", session);
  check(questionsRes, {
    "admin questions returned 200": (r) => r.status === 200,
  });
  if (questionsRes.status !== 200) {
    throw new Error(`Admin questions fetch failed: ${questionsRes.status} ${questionsRes.body}`);
  }

  const summaryRes = getWithSession(ADMIN_URL, "/api/bff/dashboard-summary", session);
  check(summaryRes, {
    "dashboard summary returned 200": (r) => r.status === 200,
  });
  if (summaryRes.status !== 200) {
    throw new Error(`Dashboard summary failed: ${summaryRes.status} ${summaryRes.body}`);
  }

  const healthRes = http.get(`${API_URL}/api/health/live`);
  check(healthRes, {
    "health live returned 200": (r) => r.status === 200,
  });
  if (healthRes.status !== 200) {
    throw new Error(`Health check failed: ${healthRes.status} ${healthRes.body}`);
  }
}
