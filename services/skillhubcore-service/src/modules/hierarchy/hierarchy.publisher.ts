export interface HierarchySubtopicAddedEvent {
  subtopicId: string;
  topicId: string;
  subjectId: string;
  domainId: string;
  name: string;
  slug: string;
  difficultyLevels: string[];
}

export class HierarchyPublisher {
  async publishSubtopicAdded(event: HierarchySubtopicAddedEvent): Promise<void> {
    if (process.env.QSTASH_URL === undefined || process.env.QSTASH_TOKEN === undefined) {
      return;
    }

    await fetch(process.env.QSTASH_URL, {
      method: 'POST',
      headers: {
        authorization: `Bearer ${process.env.QSTASH_TOKEN}`,
        'content-type': 'application/json',
        'upstash-idempotency-key': event.subtopicId,
      },
      body: JSON.stringify({
        type: 'hierarchy.subtopic_added',
        payload: event,
      }),
    });
  }
}
