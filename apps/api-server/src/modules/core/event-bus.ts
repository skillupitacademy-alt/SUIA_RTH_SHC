import { EventEmitter } from 'events';

import { logger } from '@/lib/logger';

export type SystemEvent = 'EXAM_STARTED' | 'EXAM_SUBMITTED' | 'EXAM_COMPLETED' | 'EXAM_FAILED';

export interface EventPayloads {
  'EXAM_STARTED': { examId: string; userId: string };
  'EXAM_SUBMITTED': { examId: string; userId: string };
  'EXAM_COMPLETED': { examId: string; userId: string; score: number };
  'EXAM_FAILED': { examId: string; userId: string; error?: string };
}

class EventBus {
  private emitter = new EventEmitter();
  private log = logger.child({ module: 'core:event-bus' });

  constructor() {
    this.emitter.setMaxListeners(20);
  }

  emit<K extends SystemEvent>(event: K, payload: EventPayloads[K]) {
    const examId = 'examId' in payload ? payload.examId : undefined;
    this.log.info({ event, examId }, 'Emitting event');
    this.emitter.emit(event, payload);
  }

  on<K extends SystemEvent>(event: K, handler: (payload: EventPayloads[K]) => void) {
    this.emitter.on(event, handler);
  }
}

export const eventBus = new EventBus();
