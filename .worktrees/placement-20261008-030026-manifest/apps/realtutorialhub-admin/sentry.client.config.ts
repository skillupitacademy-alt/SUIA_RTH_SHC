import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN || "",
  tracesSampleRate: 1.0,
  debug: false,
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  
  beforeSend(event) {
    if (typeof window !== 'undefined') {
        event.tags = {
            ...event.tags,
            sessionId: sessionStorage.getItem('admin_session_id') || 'unknown',
        };
    }
    return event;
  },
});
