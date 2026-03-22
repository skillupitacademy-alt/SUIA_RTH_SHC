import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  tracesSampleRate: 1.0,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  
  // Set the requestId and sessionId as tags on all errors
  beforeSend(event) {
    if (typeof window !== 'undefined') {
        event.tags = {
            ...event.tags,
            sessionId: sessionStorage.getItem('quiz_session_id') || 'unknown',
        };
    }
    return event;
  },
});
