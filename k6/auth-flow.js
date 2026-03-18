import http from "k6/http";
import { check, fail } from "k6";
import { normalizeApiUrl, resolveProfile } from "./config.js";

const API_URL = normalizeApiUrl(__ENV.API_URL);
const TEST_EMAIL = __ENV.TEST_EMAIL || "k6-test@loadtest.example.com";
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "";
const LOCKOUT_EMAIL = __ENV.LOCKOUT_EMAIL || "k6-lockout@loadtest.example.com";
const PROFILE = __ENV.STAGE_PROFILE || "mini";

export const options = {
  stages: resolveProfile(PROFILE).stages,
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<1500"],
  },
};

function randomPassword() {
  return `Wrong-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

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

function login(email, password) {
  const res = http.post(`${API_URL}/api/auth/login`, JSON.stringify({ email, password }), {
    headers: {
      "Content-Type": "application/json",
    },
  });

  return {
    res,
    cookies: collectCookies(res),
  };
}

export default function () {
  if (TEST_PASSWORD === "") {
    fail("TEST_PASSWORD is required");
  }

  const success = login(TEST_EMAIL, TEST_PASSWORD);
  check(success.res, {
    "valid login returns 200": (r) => r.status === 200,
    "valid login sets cookies": (r) => Object.keys(r.cookies || {}).length > 0,
  });

  const wrong = login(TEST_EMAIL, randomPassword());
  check(wrong.res, {
    "wrong password returns 401": (r) => r.status === 401,
  });

  let lockoutSeen = false;
  for (let i = 0; i < 6; i += 1) {
    const attempt = login(LOCKOUT_EMAIL, randomPassword());
    if (attempt.res.status === 423) {
      lockoutSeen = true;
      const csrfToken = attempt.cookies.csrfToken || "";
      check(attempt.res, {
        "lockout returns 423": (r) => r.status === 423,
      });
      if (csrfToken) {
        check({ csrfToken }, {
          "lockout response includes csrf token cookie": (r) => typeof r.csrfToken === "string" && r.csrfToken.length > 0,
        });
      }
      break;
    }
    check(attempt.res, {
      "pre-lock login attempt is unauthorized": (r) => r.status === 401,
    });
  }

  if (!lockoutSeen) {
    fail("lockout response was not observed within 6 attempts");
  }
}

