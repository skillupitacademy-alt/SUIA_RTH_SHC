export interface SessionInteraction {
  at: string;
  type: "page" | "click" | "video" | "lead" | "conversion" | "heartbeat";
  path?: string;
}

export interface SessionTimeline {
  sessionId: string;
  startedAt: string;
  lastActivityAt: string;
  interactions: SessionInteraction[];
}

const timelines = new Map<string, SessionTimeline>();

export function recordSessionInteraction(sessionId: string, interaction: SessionInteraction) {
  const existing = timelines.get(sessionId);
  const timeline: SessionTimeline = existing
    ? {
        ...existing,
        lastActivityAt: interaction.at,
        interactions: [...existing.interactions, interaction],
      }
    : {
        sessionId,
        startedAt: interaction.at,
        lastActivityAt: interaction.at,
        interactions: [interaction],
      };

  timelines.set(sessionId, timeline);
  return timeline;
}

export function getSessionTimeline(sessionId: string) {
  return timelines.get(sessionId);
}

