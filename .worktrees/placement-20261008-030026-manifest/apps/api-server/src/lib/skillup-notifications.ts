import { PlatformEventTypes, publishEvent } from '@quiz/events';

type SessionScheduledPayload = {
  batchId: string;
  sessionId: string;
  scheduledAt: string;
  sessionNotes: string;
};

export async function publishSessionScheduledNotification(payload: SessionScheduledPayload) {
  const destinationUrl =
    process.env.SKILLUP_SESSION_REMINDER_URL ?? 'https://placeholder.invalid/consumers/session-scheduled';

  return publishEvent(
    PlatformEventTypes.SESSION_SCHEDULED,
    payload,
    {
      destinationUrl,
      source: 'skillup-admin',
    }
  );
}
