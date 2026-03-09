import { auditLogs, db, domains, examQuestions, exams, questions, resultsByDimension, roles, userRoles, users } from '@quiz/db';
import { and, count, desc, eq, isNotNull, lt, or,sql } from 'drizzle-orm';

import { IAdminAnalyticsRepository } from '../interfaces/admin-analytics.repository.interface';

export class DrizzleAdminAnalyticsRepository implements IAdminAnalyticsRepository {
  private dbInstance = db;

  async getPlatformMetrics() {
    const [userCount] = await this.dbInstance.select({ count: count() }).from(users);
    const [examCount] = await this.dbInstance.select({ count: count() }).from(exams);
    const [domainCount] = await this.dbInstance.select({ count: count() }).from(domains);

    const yesterday = new Date();
    yesterday.setHours(yesterday.getHours() - 24);
    
    const [activeUsers] = await this.dbInstance.select({ 
        count: sql<number>`count(distinct ${exams.userId})`.mapWith(Number) 
    })
    .from(exams)
    .where(sql`${exams.startedAt} >= ${yesterday}`);

    return {
      totalUsers: userCount.count,
      totalExams: examCount.count,
      totalDomains: domainCount.count,
      activeUsers24h: activeUsers !== undefined ? activeUsers.count : 0 
    };
  }

  async getExamActivity() {
    const statusStats = await this.dbInstance.select({
      status: exams.status,
      count: sql<number>`count(*)`.mapWith(Number),
    })
    .from(exams)
    .groupBy(exams.status);

    const domainActivity = await this.dbInstance.select({
      domainName: resultsByDimension.name,
      count: sql<number>`count(distinct ${resultsByDimension.examId})`.mapWith(Number),
    })
    .from(resultsByDimension)
    .where(eq(resultsByDimension.dimensionType, 'domain'))
    .groupBy(resultsByDimension.name);

    const [avgTimeResult] = await this.dbInstance.select({
      avgTime: sql<number>`avg(extract(epoch from (${exams.completedAt} - ${exams.startedAt})))`.mapWith(Number)
    })
    .from(exams)
    .where(eq(exams.status, 'completed'));

    return {
      statusStats,
      domainActivity,
      avgTime: avgTimeResult?.avgTime
    };
  }

  async getEfficiencyAnalytics() {
    const TIME_THRESHOLD = 60;
    
    return await this.dbInstance.select({
      quadrant: sql<string>`
        case 
          when ${examQuestions.isCorrect} = true 
               and (${examQuestions.responseMetadata}->>'timeSpentSeconds') ~ '^[0-9]+$' 
               and cast(${examQuestions.responseMetadata}->>'timeSpentSeconds' as integer) <= ${TIME_THRESHOLD} 
               then 'mastery'
          when ${examQuestions.isCorrect} = true 
               and (${examQuestions.responseMetadata}->>'timeSpentSeconds') ~ '^[0-9]+$' 
               and cast(${examQuestions.responseMetadata}->>'timeSpentSeconds' as integer) > ${TIME_THRESHOLD} 
               then 'persistence'
          when ${examQuestions.isCorrect} = false 
               and (${examQuestions.responseMetadata}->>'timeSpentSeconds') ~ '^[0-9]+$' 
               and cast(${examQuestions.responseMetadata}->>'timeSpentSeconds' as integer) <= ${TIME_THRESHOLD} 
               then 'rash'
          when ${examQuestions.isCorrect} = false 
               and (${examQuestions.responseMetadata}->>'timeSpentSeconds') ~ '^[0-9]+$' 
               and cast(${examQuestions.responseMetadata}->>'timeSpentSeconds' as integer) > ${TIME_THRESHOLD} 
               then 'struggle'
          else 'no_data'
        end
      `,
      count: sql<number>`count(*)`.mapWith(Number)
    })
    .from(examQuestions)
    .where(isNotNull(examQuestions.isCorrect))
    .groupBy(sql`
        case 
          when ${examQuestions.isCorrect} = true 
               and (${examQuestions.responseMetadata}->>'timeSpentSeconds') ~ '^[0-9]+$' 
               and cast(${examQuestions.responseMetadata}->>'timeSpentSeconds' as integer) <= ${TIME_THRESHOLD} 
               then 'mastery'
          when ${examQuestions.isCorrect} = true 
               and (${examQuestions.responseMetadata}->>'timeSpentSeconds') ~ '^[0-9]+$' 
               and cast(${examQuestions.responseMetadata}->>'timeSpentSeconds' as integer) > ${TIME_THRESHOLD} 
               then 'persistence'
          when ${examQuestions.isCorrect} = false 
               and (${examQuestions.responseMetadata}->>'timeSpentSeconds') ~ '^[0-9]+$' 
               and cast(${examQuestions.responseMetadata}->>'timeSpentSeconds' as integer) <= ${TIME_THRESHOLD} 
               then 'rash'
          when ${examQuestions.isCorrect} = false 
               and (${examQuestions.responseMetadata}->>'timeSpentSeconds') ~ '^[0-9]+$' 
               and cast(${examQuestions.responseMetadata}->>'timeSpentSeconds' as integer) > ${TIME_THRESHOLD} 
               then 'struggle'
          else 'no_data'
        end
    `);
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
