import { Client } from '@upstash/qstash';

import { db } from './db';
import { LiveSessionRepository } from './repositories';
import type {
  LiveSessionRequestFilters,
  LiveSessionRequestRecord,
} from '@quiz/types';

import {
  SessionRequestDuplicateError,
  SessionRequestForbiddenError,
  SessionRequestNotFoundError,
} from '@quiz/types';

const DEFAULT_REQUEST_WORKER_PATH = '/api/workers/notify-session-requested';
const DEFAULT_ACCEPTED_WORKER_PATH = '/api/workers/notify-session-accepted';
const DEFAULT_SCHEDULED_WORKER_PATH = '/api/workers/notify-session-scheduled';

type RedisLike = {
  get(key: string): Promise<string | null> | string | null;
  set(key: string, value: string, options?: { ex?: number; nx?: boolean }): Promise<unknown> | unknown;
};

type QStashLike = {
  publishJSON(args: { url: string; body: unknown; headers?: Record<string, string>; retries?: number }): Promise<unknown>;
};

export interface LiveSessionServiceDependencies {
  liveSessionRepository?: LiveSessionRepository;
  getQStash?: () => QStashLike;
  appUrl?: string;
}

const getAppUrl = () => {
  const publicUrl = process.env.NEXT_PUBLIC_WEB_APP_URL;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const internalUrl = process.env.INTERNAL_API_URL;
  if (typeof publicUrl === 'string' && publicUrl.trim().length > 0) return publicUrl.trim();
  if (typeof appUrl === 'string' && appUrl.trim().length > 0) return appUrl.trim();
  if (typeof internalUrl === 'string' && internalUrl.trim().length > 0) return internalUrl.trim();
  return 'https://user.realtutorialhub.com';
};

const getQStashClient = (): QStashLike => {
  const token = process.env.QSTASH_TOKEN;
  if (typeof token !== 'string' || token.trim().length === 0) {
    throw new Error('QSTASH_TOKEN is required for live session workflows');
  }

  return new Client({ token });
};

const buildWorkerUrl = (appUrl: string, path: string) => new URL(path, appUrl).toString();

const hasOpenRequest = (requests: LiveSessionRequestRecord[], subtopicId: string) =>
  requests.some((request) =>
    request.subtopicId === subtopicId &&
    (request.status === 'pending' || request.status === 'accepted')
  );

export class LiveSessionService {
  private readonly repository: LiveSessionRepository;

  private readonly getQStash: () => QStashLike;

  private readonly appUrl: string;

  constructor(dependencies: LiveSessionServiceDependencies = {}) {
    this.repository = dependencies.liveSessionRepository ?? new LiveSessionRepository();
    this.getQStash = dependencies.getQStash ?? getQStashClient;
    this.appUrl = dependencies.appUrl ?? getAppUrl();
  }

  async requestSession(studentId: string, subtopicId: string, doubtText?: string | null) {
    const existingPending = await this.repository.getRequestsByStudent(studentId, 'pending');
    const existingAccepted = await this.repository.getRequestsByStudent(studentId, 'accepted');
    if (hasOpenRequest([...existingPending, ...existingAccepted], subtopicId)) {
      throw new SessionRequestDuplicateError(studentId, subtopicId);
    }

    const request = await db.transaction(async (tx) => {
      const txRepo = this.repository.withDb(tx as never);
      return txRepo.createRequest(studentId, subtopicId, doubtText ?? null);
    });

    await this.getQStash().publishJSON({
      url: buildWorkerUrl(this.appUrl, DEFAULT_REQUEST_WORKER_PATH),
      retries: 3,
      body: {
        requestId: request.id,
        studentId,
        subtopicId,
        doubtText: request.doubtText,
      },
    });

    return request;
  }

  async getMyRequests(studentId: string) {
    return this.repository.getRequestsByStudent(studentId);
  }

  async cancelMyRequest(studentId: string, requestId: string) {
    const request = await this.repository.getRequest(requestId);
    if (request === undefined) {
      throw new SessionRequestNotFoundError(requestId);
    }

    if (request.studentId !== studentId) {
      throw new SessionRequestForbiddenError(requestId);
    }

    return db.transaction(async (tx) => {
      const txRepo = this.repository.withDb(tx as never);
      return txRepo.cancelRequest(requestId, 'Cancelled by student');
    });
  }

  async getPendingRequests(filters: LiveSessionRequestFilters = {}) {
    return this.repository.getPendingRequests(filters);
  }

  async acceptRequest(facultyId: string, requestId: string) {
    const request = await this.repository.getRequest(requestId);
    if (request === undefined) {
      throw new SessionRequestNotFoundError(requestId);
    }

    const accepted = await db.transaction(async (tx) => {
      const txRepo = this.repository.withDb(tx as never);
      return txRepo.acceptRequest(requestId, facultyId);
    });

    await this.getQStash().publishJSON({
      url: buildWorkerUrl(this.appUrl, DEFAULT_ACCEPTED_WORKER_PATH),
      retries: 3,
      body: {
        requestId,
        studentId: request.studentId,
        facultyId,
        subtopicId: request.subtopicId,
      },
    });

    return accepted;
  }

  async scheduleRequest(facultyId: string, requestId: string, scheduledAt: Date, meetingLink: string) {
    try {
      const parsed = new URL(meetingLink);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
        throw new Error('Invalid meeting link');
      }
    } catch {
      throw new Error('Invalid meeting link');
    }

    const request = await this.repository.getRequest(requestId);
    if (request === undefined) {
      throw new SessionRequestNotFoundError(requestId);
    }

    const scheduled = await db.transaction(async (tx) => {
      const txRepo = this.repository.withDb(tx as never);
      return txRepo.scheduleRequest(requestId, scheduledAt, meetingLink);
    });

    await this.getQStash().publishJSON({
      url: buildWorkerUrl(this.appUrl, DEFAULT_SCHEDULED_WORKER_PATH),
      retries: 3,
      body: {
        requestId,
        studentId: request.studentId,
        facultyId,
        subtopicId: request.subtopicId,
        meetingLink,
        scheduledAt: scheduledAt.toISOString(),
      },
    });

    return scheduled;
  }

  async completeRequest(_facultyId: string, requestId: string) {
    const request = await this.repository.getRequest(requestId);
    if (request === undefined) {
      throw new SessionRequestNotFoundError(requestId);
    }

    return db.transaction(async (tx) => {
      const txRepo = this.repository.withDb(tx as never);
      return txRepo.completeRequest(requestId);
    });
  }
}

export const liveSessionService = new LiveSessionService();
