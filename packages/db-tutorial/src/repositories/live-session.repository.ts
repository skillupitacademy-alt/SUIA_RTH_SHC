import { and, eq, isNull, sql } from 'drizzle-orm';

import { db } from '../db';
import { liveSessionRequests } from '../schema/live-session-requests';

import type {
  ILiveSessionRepository,
  LiveSessionRequestFilters,
  LiveSessionRequestRecord,
  LiveSessionRequestStatus,
  TutorialDbClientLike,
} from '@quiz/types';

import { SessionRequestInvalidTransitionError, SessionRequestNotFoundError } from '@quiz/types';

import { TutorialRepositoryBase } from './base.repository';

const activeRequests = isNull(liveSessionRequests.deletedAt);

const assertTransition = (
  requestId: string,
  request: LiveSessionRequestRecord | undefined,
  expected: LiveSessionRequestStatus,
  next: LiveSessionRequestStatus
) => {
  if (request === undefined) {
    throw new SessionRequestNotFoundError(requestId);
  }
  if (request.status !== expected) {
    throw new SessionRequestInvalidTransitionError(request.status, next);
  }
  return request;
};

export class LiveSessionRepository extends TutorialRepositoryBase implements ILiveSessionRepository {
  constructor(dbInstance: typeof db = db) {
    super(dbInstance);
  }

  withDb(dbClient: TutorialDbClientLike): this {
    return new LiveSessionRepository(dbClient as typeof db) as this;
  }

  async createRequest(studentId: string, subtopicId: string, doubtText?: string | null): Promise<LiveSessionRequestRecord> {
    const now = new Date();
    const [row] = (await this.runRead(
      this.dbInstance
        .insert(liveSessionRequests)
        .values({
          studentId,
          subtopicId,
          doubtText: doubtText ?? null,
          status: 'pending',
          facultyId: null,
          meetingLink: null,
          scheduledAt: null,
          completedAt: null,
          cancelledReason: null,
          version: 1,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        })
        .returning(),
      'LiveSessionRepository.createRequest'
    )) as LiveSessionRequestRecord[];

    return row;
  }

  async getRequest(id: string): Promise<LiveSessionRequestRecord | undefined> {
    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(liveSessionRequests)
        .where(and(eq(liveSessionRequests.id, id), activeRequests)),
      'LiveSessionRepository.getRequest'
    );

    return rows[0] as LiveSessionRequestRecord | undefined;
  }

  async getRequestsByStudent(studentId: string, status?: LiveSessionRequestStatus): Promise<LiveSessionRequestRecord[]> {
    const conditions = [eq(liveSessionRequests.studentId, studentId), activeRequests];
    if (status !== undefined) {
      conditions.push(eq(liveSessionRequests.status, status));
    }

    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(liveSessionRequests)
        .where(and(...conditions)),
      'LiveSessionRepository.getRequestsByStudent'
    );

    return rows as LiveSessionRequestRecord[];
  }

  async getRequestsByFaculty(facultyId: string, status?: LiveSessionRequestStatus): Promise<LiveSessionRequestRecord[]> {
    const conditions = [eq(liveSessionRequests.facultyId, facultyId), activeRequests];
    if (status !== undefined) {
      conditions.push(eq(liveSessionRequests.status, status));
    }

    const rows = await this.runRead(
      this.dbInstance
        .select()
        .from(liveSessionRequests)
        .where(and(...conditions)),
      'LiveSessionRepository.getRequestsByFaculty'
    );

    return rows as LiveSessionRequestRecord[];
  }

  async getPendingRequests(filters: LiveSessionRequestFilters = {}): Promise<LiveSessionRequestRecord[]> {
    const conditions = [eq(liveSessionRequests.status, filters.status ?? 'pending'), activeRequests];
    if (filters.subtopicId !== undefined) {
      conditions.push(eq(liveSessionRequests.subtopicId, filters.subtopicId));
    }

    const rows = await this.runReport(
      this.dbInstance
        .select()
        .from(liveSessionRequests)
        .where(and(...conditions)),
      'LiveSessionRepository.getPendingRequests'
    );

    return rows as LiveSessionRequestRecord[];
  }

  async acceptRequest(id: string, facultyId: string): Promise<LiveSessionRequestRecord> {
    const request = await this.getRequest(id);
    assertTransition(id, request, 'pending', 'accepted');

    const [row] = (await this.runRead(
      this.dbInstance
        .update(liveSessionRequests)
        .set({
          status: 'accepted',
          facultyId,
          updatedAt: new Date(),
          version: sql`${liveSessionRequests.version} + 1`,
        })
        .where(and(eq(liveSessionRequests.id, id), activeRequests))
        .returning(),
      'LiveSessionRepository.acceptRequest'
    )) as LiveSessionRequestRecord[];

    return row;
  }

  async scheduleRequest(id: string, scheduledAt: Date, meetingLink: string): Promise<LiveSessionRequestRecord> {
    const request = await this.getRequest(id);
    assertTransition(id, request, 'accepted', 'scheduled');

    const [row] = (await this.runRead(
      this.dbInstance
        .update(liveSessionRequests)
        .set({
          status: 'scheduled',
          meetingLink,
          scheduledAt,
          updatedAt: new Date(),
          version: sql`${liveSessionRequests.version} + 1`,
        })
        .where(and(eq(liveSessionRequests.id, id), activeRequests))
        .returning(),
      'LiveSessionRepository.scheduleRequest'
    )) as LiveSessionRequestRecord[];

    return row;
  }

  async completeRequest(id: string): Promise<LiveSessionRequestRecord> {
    const request = await this.getRequest(id);
    assertTransition(id, request, 'scheduled', 'completed');

    const [row] = (await this.runRead(
      this.dbInstance
        .update(liveSessionRequests)
        .set({
          status: 'completed',
          completedAt: new Date(),
          updatedAt: new Date(),
          version: sql`${liveSessionRequests.version} + 1`,
        })
        .where(and(eq(liveSessionRequests.id, id), activeRequests))
        .returning(),
      'LiveSessionRepository.completeRequest'
    )) as LiveSessionRequestRecord[];

    return row;
  }

  async cancelRequest(id: string, reason: string): Promise<LiveSessionRequestRecord> {
    const request = await this.getRequest(id);
    if (request === undefined) {
      throw new SessionRequestNotFoundError(id);
    }

    const [row] = (await this.runRead(
      this.dbInstance
        .update(liveSessionRequests)
        .set({
          status: 'cancelled',
          cancelledReason: reason,
          updatedAt: new Date(),
          version: sql`${liveSessionRequests.version} + 1`,
        })
        .where(and(eq(liveSessionRequests.id, id), activeRequests))
        .returning(),
      'LiveSessionRepository.cancelRequest'
    )) as LiveSessionRequestRecord[];

    return row;
  }

  async updateMeetingLink(id: string, meetingLink: string): Promise<LiveSessionRequestRecord | undefined> {
    const rows = await this.runRead(
      this.dbInstance
        .update(liveSessionRequests)
        .set({
          meetingLink,
          updatedAt: new Date(),
          version: sql`${liveSessionRequests.version} + 1`,
        })
        .where(and(eq(liveSessionRequests.id, id), activeRequests))
        .returning(),
      'LiveSessionRepository.updateMeetingLink'
    );

    return rows[0] as LiveSessionRequestRecord | undefined;
  }
}
