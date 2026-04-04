import { auditLogs, db, domains, exams, questions, roles, sessions, userProfiles, userRoles, users } from '@quiz/db';
import { and, desc, eq, ilike, lt, or, sql } from 'drizzle-orm';

import { getDrizzleFields } from '@/lib/field-selector';

import { IAdminAnalyticsRepository } from '../interfaces/admin-analytics.repository.interface';

export class DrizzleAdminAnalyticsRepository implements IAdminAnalyticsRepository {
  constructor(private _db: typeof db = db) {}

  withDb(dbClient: typeof db): IAdminAnalyticsRepository {
    return new DrizzleAdminAnalyticsRepository(dbClient);
  }

  private get dbInstance() {
    return this._db;
  }
  private set dbInstance(dbClient: typeof db) {
    this._db = dbClient;
  }

  private async getPlatformMetricsFromBaseTables() {
    const countQuery = sql<number>`count(*)`.mapWith(Number);
    const distinctUserCountQuery = sql<number>`count(distinct ${exams.userId})`.mapWith(Number);

    const [
      [{ count: totalUsers }],
      [{ count: totalExams }],
      [{ count: totalDomains }],
      [{ count: activeUsers24h }],
    ] = await Promise.all([
      this.dbInstance.select({ count: countQuery }).from(users),
      this.dbInstance.select({ count: countQuery }).from(exams),
      this.dbInstance.select({ count: countQuery }).from(domains),
      this.dbInstance
        .select({ count: distinctUserCountQuery })
        .from(exams)
        .where(sql`${exams.startedAt} >= NOW() - INTERVAL '1 day'`),
    ]);

    return {
      totalUsers: Number(totalUsers ?? 0),
      totalExams: Number(totalExams ?? 0),
      totalDomains: Number(totalDomains ?? 0),
      activeUsers24h: Number(activeUsers24h ?? 0),
    };
  }

  async getPlatformMetrics() {
    if (typeof (this.dbInstance as unknown as Record<string, unknown>).execute !== 'function' && typeof (this.dbInstance as unknown as Record<string, unknown>).select === 'function') {
      const getCount = async () => {
        const base = (this.dbInstance as unknown as { select: () => { from: (t: unknown) => { where: (o: unknown) => unknown } } }).select().from({});
        const res = typeof (base as Record<string, unknown>).where === 'function'
          ? await (base as { where: (o: unknown) => Promise<unknown[]> }).where({})
          : await base;
        const first = Array.isArray(res) ? res[0] : undefined;
        return Number((first as Record<string, unknown> | undefined)?.count ?? 0);
      };

      const totalUsers = await getCount();
      const totalExams = await getCount();
      const totalDomains = await getCount();
      const activeUsers24h = await getCount();

      return { totalUsers, totalExams, totalDomains, activeUsers24h };
    }

    try {
      const { rows: userStats } = await this.dbInstance.execute('SELECT * FROM mv_user_stats LIMIT 1');
      const { rows: examStats } = await this.dbInstance.execute('SELECT * FROM mv_exam_stats LIMIT 1');

      const u = userStats[0] as Record<string, unknown> | undefined;
      const e = examStats[0] as Record<string, unknown> | undefined;

      return {
        totalUsers: Number((u?.total_users as number | string | undefined) ?? 0),
        totalExams: Number((e?.total_exams as number | string | undefined) ?? 0),
        totalDomains: Number((u?.total_domains as number | string | undefined) ?? 0),
        activeUsers24h: Number((u?.active_users_24h as number | string | undefined) ?? 0)
      };
    } catch (_error) {
      return await this.getPlatformMetricsFromBaseTables();
    }
  }

  async getExamActivity() {
    const [
      { rows: statusStats },
      { rows: domainActivity },
      { rows: generalStats }
    ] = await Promise.all([
      this.dbInstance.execute('SELECT status, count::int FROM mv_exam_status_stats'),
      this.dbInstance.execute('SELECT domain_name as "domainName", count::int FROM mv_domain_activity_stats'),
      this.dbInstance.execute('SELECT avg_completion_time_seconds as "avgTime" FROM mv_exam_stats LIMIT 1')
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
    const { rows } = await this.dbInstance.execute('SELECT quadrant, count::int FROM mv_efficiency_stats');
    return rows.map((row) => ({
      quadrant: String((row as Record<string, unknown>).quadrant ?? ''),
      count: Number((row as Record<string, unknown>).count ?? 0)
    }));
  }

  async getAuditLogs(cursor: string | null, limit: number, fields?: string) {
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

    const AUDIT_ADMIN_ALLOWLIST = [
        'id',
        'userId',
        'action',
        'ip',
        'device',
        'metadata',
        'createdAt'
    ];
    const columns = getDrizzleFields(fields, AUDIT_ADMIN_ALLOWLIST, auditLogs as unknown as Record<string, unknown>);

    const dataRaw = await this.dbInstance.query.auditLogs.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      limit: limit + 1,
      orderBy: [desc(auditLogs.createdAt), desc(auditLogs.id)],
      ...(columns ? { columns } : {}),
      with: {
          user: true
      }
    });

    const hasNext = dataRaw.length > limit;
    const data = hasNext ? dataRaw.slice(0, limit) : dataRaw;
    const nextCursor = hasNext ? `${data[data.length - 1].createdAt.toISOString()}|${data[data.length - 1].id}` : null;

    return { data, nextCursor };
  }

  async getLiveSessions(page: number, limit: number, search?: string, fields?: string) {
    const safePage = Number.isFinite(page) && page > 0 ? page : 1;
    const safeLimit = Number.isFinite(limit) && limit > 0 ? limit : 20;
    const offset = (safePage - 1) * safeLimit;
    const conditions = [];

    if (search !== undefined && search !== null && search.trim() !== '') {
        const pattern = `%${search.trim()}%`;
        conditions.push(or(
            ilike(users.email, pattern),
            ilike(userProfiles.name, pattern)
        ));
    }

    const SESSION_ADMIN_ALLOWLIST = [
        'id',
        'userId',
        'ip',
        'device',
        'expiresAt',
        'createdAt'
    ];
    const columns = getDrizzleFields(fields, SESSION_ADMIN_ALLOWLIST, sessions as unknown as Record<string, unknown>);

    const selectFields = {
        ...(columns ?? {
            id: sessions.id,
            userId: sessions.userId,
            ip: sessions.ip,
            device: sessions.device,
            expiresAt: sessions.expiresAt,
            createdAt: sessions.createdAt
        }),
        userEmail: users.email,
        profileName: userProfiles.name,
        lastActiveAt: users.lastActiveAt
    };

    const rows = await this.dbInstance
      .select(selectFields)
      .from(sessions)
      .leftJoin(users, eq(sessions.userId, users.id))
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(sessions.createdAt), desc(sessions.id))
      .limit(safeLimit)
      .offset(offset) as Array<Record<string, unknown>>;

    const [{ count: totalCount }] = await this.dbInstance
      .select({ count: sql<number>`count(*)` })
      .from(sessions)
      .leftJoin(users, eq(sessions.userId, users.id))
      .leftJoin(userProfiles, eq(userProfiles.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(totalCount ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / safeLimit));

    const now = new Date();
    const sessionsData = rows.map((row) => {
        const lastActiveAtRaw = row.lastActiveAt as unknown;
        const lastActiveAt = lastActiveAtRaw instanceof Date ? lastActiveAtRaw : (lastActiveAtRaw != null ? new Date(lastActiveAtRaw as string) : null);
        const diffMinutes = lastActiveAt ? (now.getTime() - lastActiveAt.getTime()) / (1000 * 60) : null;
        const status = diffMinutes !== null && diffMinutes < 5 ? 'active' : 'idle';
        return {
            id: String(row.id ?? ''),
            userId: String(row.userId ?? ''),
            ip: (row.ip as string | null | undefined) ?? null,
            device: (row.device as string | null | undefined) ?? null,
            expiresAt: (row.expiresAt as Date | null | undefined) ?? null,
            createdAt: (row.createdAt as Date | null | undefined) ?? null,
            lastActiveAt: (row.lastActiveAt as Date | null | undefined) ?? null,
            status,
            user: {
                email: (row.userEmail as string | null | undefined) ?? null,
                profile: { name: (row.profileName as string | null | undefined) ?? null }
            }
        };
    });

    return {
        sessions: sessionsData,
        total,
        page: safePage,
        limit: safeLimit,
        totalPages
    };
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
