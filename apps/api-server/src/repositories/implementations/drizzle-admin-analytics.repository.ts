import { auditLogs, db, domains, examQuestions, exams, questions, resultsByDimension, roles, userRoles, users } from '@quiz/db';
import { count, desc, eq, isNotNull, sql } from 'drizzle-orm';

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

  async getAuditLogs(limit: number) {
    return await this.dbInstance.query.auditLogs.findMany({
      limit,
      orderBy: [desc(auditLogs.createdAt)],
      with: {
          user: true
      }
    });
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
