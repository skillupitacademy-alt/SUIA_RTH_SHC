export interface DeadLetterEvent<TPayload = unknown> {
  id: string;
  topic: string;
  payload: TPayload;
  reason: string;
  failedAt: string;
  attempts: number;
}

const queue: DeadLetterEvent[] = [];

export function pushDeadLetterEvent(event: DeadLetterEvent) {
  queue.push(event);
}

export function listDeadLetterEvents() {
  return [...queue];
}

