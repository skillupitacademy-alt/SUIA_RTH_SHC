/**
 * Shared observability constants and lightweight metric helpers.
 * These are intentionally framework-agnostic so apps can import them
 * even before a real metrics backend is wired.
 */

export enum Severity {
  P0 = "P0", // Critical (Blocking/Data Loss)
  P1 = "P1", // High (Feature Broken)
  P2 = "P2", // Medium (Degraded/Slow)
  P3 = "P3", // Low (Cosmetic/Analytics)
}

export type ObservabilityTags = {
  service?: string;
  env?: string;
  version?: string;
  requestId?: string;
  sessionId?: string;
  userId?: string;
  route?: string;
  outcome?: "success" | "failure" | "timeout";
  component?: string;
  operation?: string;
  error_code?: string;
  severity?: Severity;
};

export const METRICS = {
  AUTH: {
    LOGIN: "auth.login",
    SIGNUP: "auth.signup",
    FAILURE: "auth.failure",
  },
  EXAM: {
    START: "quiz.api.start",
    SUBMIT: "quiz.api.submit",
    SCORE: "quiz.api.score",
  },
  QUIZ: {
    RESULT: "quiz.api.result",
    STATE: "quiz.api.state",
    ANSWER: "quiz.api.answer",
    SCORE: "quiz.api.score",
  },
  REPORTS: {
    VIEW: "reports.api.view",
    LIST: "reports.api.list",
    DOWNLOAD: "reports.api.download",
    PDF_GEN: "reports.api.pdf_gen",
    FAILURES: "reports.api.failures",
  },
  ADMIN: {
    BULK_UPLOAD: "admin.api.bulk_upload",
    PUBLISH: "admin.api.publish",
    DASHBOARD_LOAD: "admin.api.dashboard_load",
    REPORT_RETRY: "admin.api.report_retry",
  },
  TUTOR: {
    HELP_REQUEST: "tutor.api.help_request",
    NOTES_VIEW: "tutor.api.notes_view",
  },
  NOTIFICATIONS: {
    UNREAD_COUNT: "notifications.api.unread_count",
    MARK_READ: "notifications.api.mark_read",
  },
  RECOMMENDATIONS: {
    FETCH: "recommendations.api.fetch",
  },
  ANALYTICS: {
    DIFFICULTY_ACCURACY: "analytics.api.difficulty_accuracy",
    MASTERY_TREND: "analytics.api.mastery_trend",
    SCORE_HISTORY: "analytics.api.score_history",
    TIME_BOXPLOT: "analytics.api.time_boxplot",
    TOPIC_PERF: "analytics.api.topic_performance",
    WEAKNESS_TREE: "analytics.api.weakness_tree",
  },
} as const;

export type MetricTags = Record<string, string | number | boolean | undefined>;

import { recordClientMetric } from './client';

// No-op helpers on server, bridge to telemetry proxy on client.
export const recordCounter = (metric: string, value = 1, tags?: MetricTags): void => {
  if (typeof window !== 'undefined') {
    void recordClientMetric(metric, value, tags as Record<string, string>);
    if (metric.includes('.')) {
      void recordClientMetric(metric.replace(/\./g, '_'), value, tags as Record<string, string>);
    }
  }
};

export const recordTimer = (metric: string, durationMs: number, tags?: MetricTags): void => {
  if (typeof window !== 'undefined') {
    void recordClientMetric(`${metric}.ms`, durationMs, tags as Record<string, string>);
    if (metric.includes('.')) {
      void recordClientMetric(`${metric.replace(/\./g, '_')}_ms`, durationMs, tags as Record<string, string>);
    }
  }
};
