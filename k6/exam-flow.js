import http from "k6/http";
import { check, sleep } from "k6";
import { resolveProfile, normalizeApiUrl } from "./config.js";

const API_URL = normalizeApiUrl(__ENV.API_URL);
const TEST_EMAIL = __ENV.TEST_EMAIL || "k6-test@loadtest.example.com";
const TEST_PASSWORD = __ENV.TEST_PASSWORD || "";
const DOMAIN_ID = __ENV.DOMAIN_ID || "";
const DIFFICULTY = __ENV.DIFFICULTY || "simple";
const QUESTION_COUNT = Number.parseInt(__ENV.QUESTION_COUNT || "10", 10);
const PROFILE = __ENV.STAGE_PROFILE || "mini";

export const options = {
  stages: resolveProfile(PROFILE).stages,
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<3000"],
  },
};

function randomIdempotencyKey() {
  return `k6-${Date.now()}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`;
}

function buildCookieHeader(cookies) {
  return Object.entries(cookies)
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
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

function buildAuthSession(loginRes) {
  const cookies = collectCookies(loginRes);
  const csrfToken = cookies.csrfToken || "";
  return {
    cookies,
    csrfToken,
    cookieHeader: buildCookieHeader(cookies),
  };
}

function requestJson(method, path, body, session, headers = {}) {
  const url = `${API_URL}${path}`;
  const reqHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };
  if (session?.csrfToken) {
    reqHeaders["x-csrf-token"] = session.csrfToken;
  }
  if (session?.cookieHeader) {
    reqHeaders.Cookie = session.cookieHeader;
  }

  return http.request(method, url, body === undefined ? null : JSON.stringify(body), {
    headers: reqHeaders,
  });
}

function login(email, password) {
  const res = requestJson("POST", "/api/auth/login", { email, password }, null);
  check(res, {
    "login returned 200": (r) => r.status === 200,
  });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${email}: ${res.status} ${res.body}`);
  }
  return buildAuthSession(res);
}

function parseJson(res) {
  try {
    return res.json();
  } catch {
    return {};
  }
}

function chooseAnswer(question) {
  const options = Array.isArray(question?.options) ? question.options : [];
  const first = options[0];
  if (typeof first === "string") return first;
  if (first && typeof first === "object") {
    return first.text || first.label || first.id || "A";
  }
  return "A";
}

function answerQuestion(session, examId, questionId, answer) {
  const res = requestJson("POST", "/api/quiz/answer", { examId, questionId, answer }, session, {
    "Idempotency-Key": randomIdempotencyKey(),
  });
  check(res, {
    "answer returned 200": (r) => r.status === 200,
  });
  if (res.status !== 200) {
    throw new Error(`Answer failed for ${questionId}: ${res.status} ${res.body}`);
  }
}

function getExamState(session, examId) {
  const url = `${API_URL}/api/quiz/state?examId=${encodeURIComponent(examId)}`;
  const res = http.get(url, {
    headers: {
      Cookie: session.cookieHeader,
    },
  });
  check(res, {
    "state returned 200": (r) => r.status === 200,
  });
  if (res.status !== 200) {
    throw new Error(`State fetch failed: ${res.status} ${res.body}`);
  }
  return parseJson(res);
}

function submitExam(session, examId) {
  const res = requestJson("POST", "/api/quiz/submit", { examId }, session, {
    "Idempotency-Key": randomIdempotencyKey(),
  });
  check(res, {
    "submit returned 200 or 202": (r) => r.status === 200 || r.status === 202,
  });
  if (res.status !== 200 && res.status !== 202) {
    throw new Error(`Submit failed: ${res.status} ${res.body}`);
  }
}

function pollReportStatus(session, examId) {
  const deadline = Date.now() + 60_000;
  let lastStatus = null;

  while (Date.now() < deadline) {
    const url = `${API_URL}/api/report-status?attemptId=${encodeURIComponent(examId)}`;
    const res = http.get(url, {
      headers: {
        Cookie: session.cookieHeader,
      },
    });
    check(res, {
      "report status returned 200": (r) => r.status === 200 || r.status === 404,
    });

    if (res.status === 404) {
      lastStatus = "not_found";
      sleep(3);
      continue;
    }

    const data = parseJson(res);
    lastStatus = data.status;
    if (data.status === "ready" || data.status === "failed") {
      return data.status;
    }

    sleep(3);
  }

  return lastStatus || "timeout";
}

export default function () {
  if (TEST_PASSWORD === "") {
    throw new Error("TEST_PASSWORD is required");
  }
  if (DOMAIN_ID === "") {
    throw new Error("DOMAIN_ID is required");
  }
  if (!Number.isFinite(QUESTION_COUNT) || QUESTION_COUNT < 5) {
    throw new Error("QUESTION_COUNT must be a number >= 5");
  }

  const session = login(TEST_EMAIL, TEST_PASSWORD);

  const startRes = requestJson(
    "POST",
    "/api/quiz/start",
    {
      domainId: DOMAIN_ID,
      difficulty: DIFFICULTY,
      questionCount: QUESTION_COUNT,
    },
    session,
    {
      "Idempotency-Key": randomIdempotencyKey(),
    }
  );

  check(startRes, {
    "start returned 200": (r) => r.status === 200,
  });
  if (startRes.status !== 200) {
    throw new Error(`Start exam failed: ${startRes.status} ${startRes.body}`);
  }

  const startData = parseJson(startRes);
  const examId = startData.examId;
  const firstQuestion = startData.firstQuestion;
  const totalQuestions = startData.totalQuestions || QUESTION_COUNT;

  if (!examId) {
    throw new Error("start exam did not return examId");
  }
  if (!firstQuestion?.id) {
    throw new Error("start exam did not return firstQuestion.id");
  }

  answerQuestion(session, examId, firstQuestion.id, chooseAnswer(firstQuestion));

  const stateData = getExamState(session, examId);
  const questions = Array.isArray(stateData.questions) ? stateData.questions : [];
  const remainingQuestions = questions.filter((q) => q && q.userAnswer === null && q.id !== firstQuestion.id);

  for (const question of remainingQuestions) {
    answerQuestion(session, examId, question.id, chooseAnswer(question));
  }

  submitExam(session, examId);
  const finalStatus = pollReportStatus(session, examId);

  check({ finalStatus, totalQuestions }, {
    "report reached ready or failed": (r) => r.finalStatus === "ready" || r.finalStatus === "failed",
  });
}
