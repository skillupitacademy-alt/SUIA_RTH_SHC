import { createQStashHandler, PlatformEventTypes } from '@quiz/events';

import { SkillupNotificationsService } from '@/modules/notifications/skillup-notifications.service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const handler = createQStashHandler(PlatformEventTypes.SESSION_SCHEDULED, async (envelope) => {
  const payload = envelope.data as {
    batchId: string;
    sessionId: string;
    scheduledAt: string;
    sessionNotes: string;
  };

  await SkillupNotificationsService.sendSessionReminder({
    batchId: payload.batchId,
    sessionId: payload.sessionId,
    scheduledAt: payload.scheduledAt,
    sessionNotes: payload.sessionNotes,
  });
});

export async function POST(request: Request): Promise<Response> {
  return handler(request);
}
