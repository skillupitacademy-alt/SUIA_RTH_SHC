import { auditLogs, db, questions, roles, userRoles } from '@quiz/db';
import { and, desc, eq, lt, or, sql } from 'drizzle-orm';

import { IAdminAnalyticsRepository } from '../interfaces/admin-analytics.repository.interface';

export class DrizzleAdminAnalyticsRepository implements IAdminAnalyticsRepository {
  constructor(private _db: typeof db = db) {}

  withDb(dbClient: typeof db): IAdminAnalyticsRepository {
    return new DrizzleAdminAnalyticsRepository(dbClient);
  }

  private get dbInstance() {
    return this._db;
  }

  async getPlatformMetrics() {
    const { rows: userStats } = await this.dbInstance.execute(sql`SELECT * FROM mv_user_stats LIMIT 1`);
    const { rows: examStats } = await this.dbInstance.execute(sql`SELECT * FROM mv_exam_stats LIMIT 1`);

    const u = userStats[0] as Record<string, unknown> | undefined;
    const e = examStats[0] as Record<string, unknown> | undefined;

    return {
      totalUsers: Number((u?.total_users as number | string | undefined) ?? 0),
      totalExams: Number((e?.total_exams as number | string | undefined) ?? 0),
      totalDomains: Number((u?.total_domains as number | string | undefined) ?? 0),
      activeUsers24h: Number((u?.active_users_24h as number | string | undefined) ?? 0)
    };
  }

  async getExamActivity() {
    const [
      { rows: statusStats },
      { rows: domainActivity },
      { rows: generalStats }
    ] = await Promise.all([
      this.dbInstance.execute(sql`SELECT status, count::int FROM mv_exam_status_stats`),
      this.dbInstance.execute(sql`SELECT domain_name as "domainName", count::int FROM mv_domain_activity_stats`),
      this.dbInstance.execute(sql`SELECT avg_completion_time_seconds as "avgTime" FROM mv_exam_stats LIMIT 1`)
    ]);

    const statusStatsTyped = statusStats.map((row) => ({
      status: String((row as Record<string, unknown>).status ?? ''),
      count: Number((row as Record<string, unknown>).count ?? 0)
    }));

    const domainActivityTyped = domainActivity.map((row) => ({
      domainName: String((row as Record<string, unknown>).domainName ?? ''),
      count: Number((row as Record<string, unknown>).count ?? 0)
    }));

    const general = generalStats[0] as Record<string, unknown> | undefined;

    return {
      statusStats: statusStatsTyped,
      domainActivity: domainActivityTyped,
      avgTime: Number((general?.avgTime as number | string | undefined) ?? 0)
    };
  }

  async getEfficiencyAnalytics() {
    const { rows } = await this.dbInstance.execute(sql`SELECT quadrant, count::int FROM mv_efficiency_stats`);
    return rows.map((row) => ({
      quadrant: String((row as Record<string, unknown>).quadrant ?? ''),
      count: Number((row as Record<string, unknown>).count ?? 0)
    }));
  }

  async getAuditLogs(cursor: string | null, limit: number) {
    const conditions = [];
    if (cursor !== null && cursor !== '') {
        const [cursorDate, cursorId] = cursor.split('|');
        if (cursorId) {
            conditions.push(or(
                lt(auditLogs.createdAt, new Date(cursorDate)),
                and(
                    eq(auditLogs.createdAt, new Date(cursorDate)),
                    lt(auditLogs.id, cursorId)
                )
            ));
        } else {
            conditions.push(lt(auditLogs.createdAt, new Date(cursorDate)));
        }
    }

    const dataRaw = await this.dbInstance.query.auditLogs.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      limit: limit + 1,
      orderBy: [desc(auditLogs.createdAt), desc(auditLogs.id)],
      with: {
          user: true
      }
    });

    const hasNext = dataRaw.length > limit;
    const data = hasNext ? dataRaw.slice(0, limit) : dataRaw;
    const nextCursor = hasNext ? `${data[data.length - 1].createdAt.toISOString()}|${data[data.length - 1].id}` : null;

    return { data, nextCursor };
  }

  async getRBACMetrics() {
    return await this.dbInstance
      .select({
        role: roles.name,
        count: sql<number>`count(${userRoles.userId})`.mapWith(Number),
      })
      .from(roles)
      .leftJoin(userRoles, eq(roles.id, userRoles.roleId))
      .groupBy(roles.name)
      .orderBy(desc(sql`count(${userRoles.userId})`));
  }

  async getAllDomainHierarchy() {
    return await this.dbInstance.query.domains.findMany({
      with: {
        subjects: {
          with: {
            topics: {
              with: {
                subtopics: true,
                questions: {
                   where: eq(questions.status, 'active')
                },
              }
            }
          }
        }
      }
    });
  }
}
