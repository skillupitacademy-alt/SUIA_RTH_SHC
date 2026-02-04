import { db, questions, questionSkills, domains, subjects, topics, subtopics, topicSkills, skills, refreshTokens, users, userRoles, roles, userProfiles, auditLogs, exams, resultsByDimension, examBlueprints } from '@quiz/db';
import { eq, and, sql, desc, gt, inArray, isNull, isNotNull } from 'drizzle-orm';
import { AuditService } from '../auth/audit.service';
import { PasswordService } from '../auth/password.service';
import { QuestionService } from '../question/question.service';
import { DomainService, SubjectService, TopicService } from '../domain/domain.service';
import { SkillService } from '../domain/skill.service';
import { HierarchyFactory, AtomicHierarchyPayload } from '../domain/hierarchy.factory';
import { cacheService } from '../core/cache.service';


export class AdminEngine {
  /**
   * Section 6: Question Bank Health
   */
  /**
   * Section 6: Hierarchical Content Health & Readiness Audit
   * Returns a complete map of Domain > Subject > Topic > Subtopic readiness.
   */
  static async getContentHealthReport() {
    const allDomains = await db.query.domains.findMany({
      with: {
        subjects: {
          with: {
            topics: {
              with: {
                subtopics: true
              }
            }
          }
        }
      }
    });

    // Helper to calculate question stats
    const getStats = (questionsPool: any[]) => {
      const simple = questionsPool.filter(x => x.difficulty === 'simple').length;
      const intermediate = questionsPool.filter(x => x.difficulty === 'intermediate').length;
      const expert = questionsPool.filter(x => x.difficulty === 'expert').length;
      const total = questionsPool.length;
      const isReady = simple >= 4 && intermediate >= 4 && expert >= 5;

      return {
        total, simple, intermediate, expert,
        isReady,
        missing: {
          simple: Math.max(0, 4 - simple),
          intermediate: Math.max(0, 4 - intermediate),
          expert: Math.max(0, 5 - expert),
        }
      };
    };

    const report = await Promise.all(allDomains.map(async domain => {
      // 1. Domain Blueprint Check
      const blueprint = await db.query.examBlueprints.findFirst({
        where: sql`${examBlueprints.domains} @> ARRAY[${domain.id}]::uuid[]`
      });

      // 2. Fetch all questions for this domain to calculate aggregate health
      const domainQuestions = await db.query.questions.findMany({
        where: sql`${questions.topicId} IN (
          SELECT id FROM topics WHERE subject_id IN (
            SELECT id FROM subjects WHERE domain_id = ${domain.id}
          )
        )`
      });

      const domainStats = getStats(domainQuestions);

      // 3. Drill down into hierarchy
      const subjectsReport = await Promise.all(domain.subjects.map(async subject => {
        const subjectQuestions = domainQuestions.filter(q => {
             const topic = domain.subjects.flatMap(s => s.topics).find(t => t.id === q.topicId);
             return topic?.subjectId === subject.id;
        });
        const subjectStats = getStats(subjectQuestions);

        const topicsReport = await Promise.all(subject.topics.map(async topic => {
          const topicQuestions = domainQuestions.filter(q => q.topicId === topic.id);
          const topicStats = getStats(topicQuestions);

          const subtopicsReport = topic.subtopics.map(subtopic => {
            const subtopicQuestions = domainQuestions.filter(q => q.subtopicId === subtopic.id);
            return {
              id: subtopic.id,
              name: subtopic.name,
              stats: getStats(subtopicQuestions)
            };
          });

          return {
            id: topic.id,
            name: topic.name,
            weight: topic.weight,
            complexity: topic.complexityLevel,
            status: topic.status,
            stats: topicStats,
            subtopics: subtopicsReport
          };
        }));

        return {
          id: subject.id,
          name: subject.name,
          stats: subjectStats,
          topics: topicsReport
        };
      }));

      return {
        domainId: domain.id,
        domainName: domain.name,
        hasBlueprint: !!blueprint,
        stats: domainStats,
        isReady: domainStats.isReady && !!blueprint,
        subjects: subjectsReport
      };
    }));

    return report;
  }

  /**
   * Section 7: Atomic Hierarchy Seeding
   */
  static async atomicSeed(payload: AtomicHierarchyPayload) {
    return await HierarchyFactory.atomicUpsert(payload);
  }

  /**
   * Section 10: Blueprint Management (Manual CRUD)
   */
  static async getBlueprints(page: number = 1, limit: number = 20, filters?: { search?: string }) {
    const offset = (page - 1) * limit;

    const where: any[] = [];
    if (filters?.search) {
      const searchPattern = `%${filters.search}%`;
      where.push(sql`(${examBlueprints.name} ILIKE ${searchPattern} OR ${examBlueprints.description} ILIKE ${searchPattern})`);
    }

    const data = await db.query.examBlueprints.findMany({
      where: where.length > 0 ? and(...where) : undefined,
      limit,
      offset,
      orderBy: [desc(examBlueprints.createdAt)],
    });

    const [countResult] = await db.select({ count: sql`count(*)` }).from(examBlueprints);
    const total = Number(countResult?.count || 0);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  static async createBlueprint(data: any) {
    const [result] = await db.insert(examBlueprints).values(data).returning();
    return result;
  }

  static async updateBlueprint(id: string, data: any) {
    const [result] = await db.update(examBlueprints)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(examBlueprints.id, id))
      .returning();

    if (result) {
      await cacheService.del(`blueprint:${id}`);
      await cacheService.delByPrefix('blueprint-counts:');
    }
    
    return result;
  }

  static async deleteBlueprint(id: string) {
    const [result] = await db.delete(examBlueprints)
      .where(eq(examBlueprints.id, id))
      .returning();

    if (result) {
      await cacheService.del(`blueprint:${id}`);
      await cacheService.delByPrefix('blueprint-counts:');
    }

    return result;
  }


  static async getBlueprintById(id: string) {
    return await db.query.examBlueprints.findFirst({
      where: eq(examBlueprints.id, id)
    });
  }

  /**
   * Section 8: Exam Activity Overview
   */
  static async getExamActivity() {
    const statusStats = await db.select({
      status: exams.status,
      count: sql`count(*)`,
    })
    .from(exams)
    .groupBy(exams.status);

    const domainActivity = await db.select({
      domainName: resultsByDimension.name,
      count: sql`count(distinct ${resultsByDimension.examId})`,
    })
    .from(resultsByDimension)
    .where(eq(resultsByDimension.dimensionType, 'domain'))
    .groupBy(resultsByDimension.name);

    const [avgTimeResult] = await db.select({
      avgTime: sql`avg(extract(epoch from (${exams.completedAt} - ${exams.startedAt})))`
    })
    .from(exams)
    .where(eq(exams.status, 'completed'));

    const base = statusStats.reduce((acc: any, curr) => {
      acc[curr.status] = Number(curr.count || 0);
      return acc;
    }, { started: 0, completed: 0, abandoned: 0 });

    return {
      ...base,
      byDomain: domainActivity.map(d => ({ name: d.domainName, count: Number(d.count || 0) })),
      avgCompletionTimeMinutes: Math.round(Number(avgTimeResult?.avgTime || 0) / 60)
    };
  }

  /**
   * Section 9: Scoring & Performance Analytics (Aggregated)
   */
  /**
   * Section 9: Scoring & Performance Analytics (Aggregated)
   */
  static async getPerformanceAnalytics() {
    const domainScores = await db.select({
      dimensionId: resultsByDimension.dimensionId,
      name: resultsByDimension.name,
      avgAccuracy: sql`avg(${resultsByDimension.accuracy})`,
      count: sql`count(*)`,
    })
    .from(resultsByDimension)
    .where(eq(resultsByDimension.dimensionType, 'domain'))
    .groupBy(resultsByDimension.dimensionId, resultsByDimension.name);

    const difficultyScores = await db.select({
      difficulty: resultsByDimension.name,
      avgAccuracy: sql`avg(${resultsByDimension.accuracy})`,
    })
    .from(resultsByDimension)
    .where(eq(resultsByDimension.dimensionType, 'difficulty'))
    .groupBy(resultsByDimension.name);

    const passFail = await db.select({
      isPass: sql`case when ${resultsByDimension.accuracy} >= 70 then true else false end`,
      count: sql`count(*)`,
    })
    .from(resultsByDimension)
    .where(eq(resultsByDimension.dimensionType, 'domain')) // Use domain scores to determine pass/fail per exam/domain
    .groupBy(sql`case when ${resultsByDimension.accuracy} >= 70 then true else false end`);

    return {
      domains: domainScores.map(d => ({
        id: d.dimensionId,
        name: d.name,
        avgAccuracy: Math.round(Number(d.avgAccuracy || 0)),
        sampleSize: Number(d.count || 0)
      })),
      difficulty: difficultyScores.map(d => ({
        level: d.difficulty,
        avgAccuracy: Math.round(Number(d.avgAccuracy || 0))
      })),
      passFailTrends: {
        pass: Number(passFail.find(p => p.isPass === true)?.count || 0),
        fail: Number(passFail.find(p => p.isPass === false)?.count || 0),
      }
    };
  }

  /**
   * Section 2: User & Account Overview
   */
  static async getAccountMetrics() {
    const now = new Date();
    const todayStart = new Date(now.setHours(0, 0, 0, 0));
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total] = await db.select({ count: sql`count(*)` }).from(users);
    const [verified] = await db.select({ count: sql`count(*)` }).from(users).where(eq(users.emailVerified, true));
    const [newToday] = await db.select({ count: sql`count(*)` }).from(users).where(gt(users.createdAt, todayStart));
    const [new7d] = await db.select({ count: sql`count(*)` }).from(users).where(gt(users.createdAt, sevenDaysAgo));
    const [new30d] = await db.select({ count: sql`count(*)` }).from(users).where(gt(users.createdAt, thirtyDaysAgo));
    
    // Check locked accounts from loginAttempts
    const [lockedResult] = await db.select({ count: sql`count(*)` })
      .from(db.select({ count: sql`count(*)` }).from(sql`login_attempts`).where(gt(sql`locked_until`, new Date())).as('locked'));

    return {
      total: Number(total?.count || 0),
      verified: Number(verified?.count || 0),
      unverified: Number(total?.count || 0) - Number(verified?.count || 0),
      newToday: Number(newToday?.count || 0),
      new7d: Number(new7d?.count || 0),
      new30d: Number(new30d?.count || 0),
      lockedCount: Number(lockedResult?.count || 0)
    };
  }

  /**
   * Section 3: Roles & Permissions (RBAC)
   */
  static async getRBACMetrics() {
    const roleCounts = await db.select({
      roleName: roles.name,
      count: sql`count(*)`,
    })
    .from(userRoles)
    .innerJoin(roles, eq(userRoles.roleId, roles.id))
    .groupBy(roles.name);

    return roleCounts.map(r => ({
      role: r.roleName,
      count: Number(r.count || 0)
    }));
  }

  /**
   * Section 11: Audit & System Logs
   */
  static async getRecentAuditLogs(limit: number = 20) {
    return await db.query.auditLogs.findMany({
      limit,
      orderBy: [desc(auditLogs.createdAt)],
      with: {
        user: { with: { profile: true } }
      }
    });
  }

  /**
   * Section 7: Exam Blueprint Monitoring
   */
  static async getBlueprintMetrics() {
    const metrics = await db.select({
      total: sql`count(*)`,
      avgQuestions: sql`avg(total_questions)`,
    }).from(examBlueprints);

    return {
      total: Number(metrics[0]?.total || 0),
      avgQuestions: Math.round(Number(metrics[0]?.avgQuestions || 0)),
      standardDistribution: '30/30/40',
      complianceRate: '100%' 
    };
  }

  /**
   * Section 10: Growth Zones & Learning Insights (Derived)
   */
  static async getGrowthZones() {
    const topicScores = await db.select({
      topicId: resultsByDimension.dimensionId,
      name: resultsByDimension.name,
      avgAccuracy: sql`avg(${resultsByDimension.accuracy})`,
      count: sql`count(*)`,
    })
    .from(resultsByDimension)
    .where(eq(resultsByDimension.dimensionType, 'topic'))
    .groupBy(resultsByDimension.dimensionId, resultsByDimension.name)
    .orderBy(sql`avg(${resultsByDimension.accuracy}) asc`)
    .limit(5);

    return topicScores.map(t => ({
      id: t.topicId,
      name: t.name,
      accuracy: Math.round(Number(t.avgAccuracy || 0)),
      sampleSize: Number(t.count || 0)
    }));
  }

  /**
   * Section 4: Security & Login Health
   */
  static async getSecuritySignals() {
    const [successfulLogins] = await db.select({ count: sql`count(*)` })
      .from(auditLogs)
      .where(eq(auditLogs.action, 'login_success'));

    const [failedLogins] = await db.select({ count: sql`count(*)` })
      .from(auditLogs)
      .where(eq(auditLogs.action, 'login_failed'));

    return {
      successfulLogins: Number(successfulLogins?.count || 0),
      failedLogins: Number(failedLogins?.count || 0),
      threatLevel: Number(failedLogins?.count || 0) > 100 ? 'HIGH' : 'LOW',
    };
  }

  // --- QUESTION MANAGEMENT ---

  /**
   * Private helper to map frontend question data to database schema.
   * ROBUST NORMALIZATION: Converts legacy string-array options into high-fidelity objects.
   */
  private static mapQuestionData(data: any, topicId: string, subtopicId?: string, skillId?: string, skillIds?: string[]) {
    // 1. Resolve Options Format (Handle both string arrays and object arrays)
    const rawOptions = data.options || [];
    const normalizedOptions = rawOptions.map((opt: any, idx: number) => {
        // If it's already an object with text, keep it (but ensure id/isCorrect exist)
        if (typeof opt === 'object' && opt !== null && (opt.text !== undefined || opt.questionText !== undefined)) {
            return {
                id: opt.id || crypto.randomUUID(),
                text: opt.text || opt.questionText || '',
                isCorrect: !!opt.isCorrect
            };
        }
        // If it's a string, transform it
        return {
            id: crypto.randomUUID(),
            text: String(opt),
            isCorrect: false // Will be set in next step
        };
    });

    // 2. Resolve Correct Answer Logic
    // Priority: Explicit object flag > Text match against data.correctAnswer
    const providedCorrectAnswerText = data.correctAnswer?.trim();
    
    // Check if any option is already marked correct
    let hasCorrect = normalizedOptions.some((o: any) => o.isCorrect);
    
    // If no option is marked, but we have a text-based correctAnswer, try to match it
    if (!hasCorrect && providedCorrectAnswerText) {
        normalizedOptions.forEach((o: any) => {
            if (o.text?.trim() === providedCorrectAnswerText) {
                o.isCorrect = true;
                hasCorrect = true;
            }
        });
    }

    const finalCorrectAnswer = normalizedOptions.find((o: any) => o.isCorrect)?.text || providedCorrectAnswerText || 'No correct answer provided';

    // 3. Resolve Skills: Priority = Item Array > Item Single > Context Array > Context Single
    let resolvedSkillIds: string[] = [];
    if (Array.isArray(data.skillIds) && data.skillIds.length > 0) {
       resolvedSkillIds = data.skillIds;
    } else if (data.skillId) {
       resolvedSkillIds = [data.skillId];
    } else if (Array.isArray(skillIds) && skillIds.length > 0) {
       resolvedSkillIds = skillIds;
    } else if (skillId) {
       resolvedSkillIds = [skillId];
    }

    const dbData = {
        topicId: topicId,
        subtopicId: subtopicId || data.subtopicId,
        difficulty: data.difficulty || 'intermediate',
        type: data.type === 'multiple' ? 'mcq' : 'mcq',
        mappingType: (data.mappingType as 'conceptual' | 'technical' | 'practical') || null,
        questionText: data.text || data.questionText,
        options: normalizedOptions, // ALWAYS STORE AS OBJECTS
        correctAnswer: finalCorrectAnswer,
        explanation: data.explanation || '',
        codeSnippet: data.codeSnippet || null,
        metadata: {
            estimatedTime: data.estimatedTime || 60,
            tags: data.tags,
            skillWeight: data.skillWeight
        },
        status: 'active' as const,
        updatedAt: new Date()
    };

    return { dbData, resolvedSkillIds };
  }

  /**
   * Creates a new question with schema mapping.
   */
  static async createQuestion(data: any, adminId: string) {
    const topicId = data.topicId;
    if (!topicId) {
        throw new Error('Could not resolve topicId for the question.');
    }

    // 2. Map and Create
    // Note: data.skillIds expected from frontend
    const mapping = this.mapQuestionData(data, topicId, data.subtopicId, data.skillId, data.skillIds);
    const question = await QuestionService.createQuestion(mapping.dbData, mapping.resolvedSkillIds);

    await AuditService.log({
      userId: adminId,
      action: 'admin_create_question',
      metadata: { questionId: question[0].id },
    });

    return question[0];
  }

  /**
   * Bulk creates questions with hierarchical context.
   */
  static async bulkCreateQuestionsWithContext(
    questionsList: any[], 
    context: { topicId: string, subtopicId?: string, skillId?: string, skillIds?: string[] }, 
    adminId: string
  ) {
    // 1. Map all questions using the centralized logic
    // Returns array of objects { dbData, resolvedSkillIds }
    const mappedItems = questionsList.map(q => 
        this.mapQuestionData(q, context.topicId, context.subtopicId, context.skillId, context.skillIds)
    );

    const dbRows = mappedItems.map(item => item.dbData);
    
    // Create a mapping for the service: index -> skillIds
    const skillMappings = mappedItems.map((item, index) => ({
       questionIndex: index,
       skillIds: item.resolvedSkillIds
    }));

    const questions = await QuestionService.bulkCreateQuestions(dbRows, skillMappings);

    await AuditService.log({
      userId: adminId,
      action: 'admin_bulk_create_questions',
      metadata: { count: questions.length, topicId: context.topicId },
    });

    return questions;
  }

  /**
   * Fetches all questions for management.
   */
  static async getAllQuestions() {
    return await QuestionService.getAllQuestions();
  }

  /**
   * Domain Management
   */
  static async createDomain(data: any, adminId: string) {
    const result = await DomainService.createDomain(data);
    await AuditService.log({ userId: adminId, action: 'admin_create_domain', metadata: { domainId: result[0].id } });
    return result[0];
  }

  static async updateDomain(id: string, data: any, adminId: string) {
    const result = await DomainService.updateDomain(id, data);
    await AuditService.log({ userId: adminId, action: 'admin_update_domain', metadata: { domainId: id } });
    return result[0];
  }

  static async deleteDomain(id: string, adminId: string) {
    const result = await DomainService.deleteDomain(id);
    await AuditService.log({ userId: adminId, action: 'admin_delete_domain', metadata: { domainId: id } });
    return result;
  }

  static async deleteDomainsBatch(ids: string[], adminId: string) {
    const deleted = await DomainService.deleteDomainsBatch(ids);
    await AuditService.log({
      userId: adminId,
      action: 'admin_batch_delete_domains',
      metadata: { count: deleted.length, ids },
    });
    return deleted;
  }

  /**
   * Approves a new domain for public visibility.
   */
  static async approveDomain(domainId: string, adminId: string) {
    const [updated] = await db.update(domains)
      .set({ status: 'active' })
      .where(eq(domains.id, domainId))
      .returning();

    await AuditService.log({
      userId: adminId,
      action: 'admin_approve_domain',
      metadata: { domainId },
    });

    return updated;
  }

  /**
   * Fetches high-level platform metrics for admin dashboard.
   */
  static async getPlatformMetrics() {
    const account = await this.getAccountMetrics();
    const security = await this.getSecuritySignals();
    const examActivity = await this.getExamActivity();
    
    const [questionCount] = await db.select({ count: sql`count(*)` })
        .from(questions)
        .where(eq(questions.status, 'active'));
    const { total: liveUserCount } = await this.getLiveSessions(1, 1);

    return {
      totalUsers: account.total,
      totalExams: examActivity.completed + examActivity.started,
      totalQuestions: Number(questionCount?.count || 0),
      liveUsers: liveUserCount,
      securityThreatLevel: security.threatLevel,
      systemLoad: '0.8%',
      uptime: '99.99%',
    };
  }



  /**
   * Publishes a question.
   */
  static async publishQuestion(questionId: string, adminId: string) {
    const [updated] = await db.update(questions)
      .set({ status: 'active' })
      .where(eq(questions.id, questionId))
      .returning();

    await AuditService.log({
      userId: adminId,
      action: 'admin_publish_question',
      metadata: { questionId },
    });

    return updated;
  }

  /**
   * Validates a topic based on the 13-question distribution rule.
   */
  static async validateTopic(topicId: string) {
    return await QuestionService.validateTopicReadiness(topicId);
  }

  // --- SUBJECT MANAGEMENT ---
  static async createSubject(data: any, adminId: string) {
    const result = await SubjectService.createSubject(data);
    await AuditService.log({ userId: adminId, action: 'admin_create_subject', metadata: { subjectId: result[0].id } });
    return result[0];
  }

  static async updateSubject(id: string, data: any, adminId: string) {
    const result = await SubjectService.updateSubject(id, data);
    await AuditService.log({ userId: adminId, action: 'admin_update_subject', metadata: { subjectId: id } });
    return result[0];
  }

  static async deleteSubject(id: string, adminId: string) {
    const result = await SubjectService.deleteSubject(id);
    await AuditService.log({ userId: adminId, action: 'admin_delete_subject', metadata: { subjectId: id } });
    return result;
  }

  static async deleteSubjectsBatch(ids: string[], adminId: string) {
    const deleted = await SubjectService.deleteSubjectsBatch(ids);
    await AuditService.log({
      userId: adminId,
      action: 'admin_batch_delete_subjects',
      metadata: { count: deleted.length, ids },
    });
    return deleted;
  }

  // --- TOPIC MANAGEMENT ---
  static async createTopic(data: any, adminId: string) {
    const result = await TopicService.createTopic(data);
    await AuditService.log({ userId: adminId, action: 'admin_create_topic', metadata: { topicId: result[0].id } });
    return result[0];
  }

  static async updateTopic(id: string, data: any, adminId: string) {
    const result = await TopicService.updateTopic(id, data);
    await AuditService.log({ userId: adminId, action: 'admin_update_topic', metadata: { topicId: id } });
    return result[0];
  }

  static async deleteTopic(id: string, adminId: string) {
    const result = await TopicService.deleteTopic(id);
    await AuditService.log({ userId: adminId, action: 'admin_delete_topic', metadata: { topicId: id } });
    return result;
  }

  static async deleteTopicsBatch(ids: string[], adminId: string) {
    const deleted = await TopicService.deleteTopicsBatch(ids);
    await AuditService.log({
      userId: adminId,
      action: 'admin_batch_delete_topics',
      metadata: { count: deleted.length, ids },
    });
    return deleted;
  }

  // --- SUBTOPIC MANAGEMENT ---
  static async createSubtopic(data: any, adminId: string) {
    const result = await TopicService.createSubtopic(data);
    await AuditService.log({ userId: adminId, action: 'admin_create_subtopic', metadata: { subtopicId: result[0].id } });
    return result[0];
  }

  static async updateSubtopic(id: string, data: any, adminId: string) {
    const result = await TopicService.updateSubtopic(id, data);
    await AuditService.log({ userId: adminId, action: 'admin_update_subtopic', metadata: { subtopicId: id } });
    return result[0];
  }

  static async deleteSubtopic(id: string, adminId: string) {
    const result = await TopicService.deleteSubtopic(id);
    await AuditService.log({ userId: adminId, action: 'admin_delete_subtopic', metadata: { subtopicId: id } });
    return result;
  }

  static async deleteSubtopicsBatch(ids: string[], adminId: string) {
    const deleted = await TopicService.deleteSubtopicsBatch(ids);
    await AuditService.log({
      userId: adminId,
      action: 'admin_batch_delete_subtopics',
      metadata: { count: deleted.length, ids },
    });
    return deleted;
  }

  // --- SKILL MANAGEMENT ---
  static async createSkill(data: any, adminId: string) {
    const result = await SkillService.createSkill(data);
    await AuditService.log({ userId: adminId, action: 'admin_create_skill', metadata: { skillId: result[0].id } });
    return result[0];
  }

  static async updateSkill(id: string, data: any, adminId: string) {
    const result = await db.update(skills).set(data).where(eq(skills.id, id)).returning();
    await AuditService.log({ userId: adminId, action: 'admin_update_skill', metadata: { skillId: id } });
    return result[0];
  }

  static async deleteSkill(id: string, adminId: string) {
    const result = await SkillService.deleteSkill(id);
    await AuditService.log({ userId: adminId, action: 'admin_delete_skill', metadata: { skillId: id } });
    return result;
  }

  static async deleteSkillsBatch(ids: string[], adminId: string) {
    const deleted = await SkillService.deleteSkillsBatch(ids);
    await AuditService.log({
      userId: adminId,
      action: 'admin_batch_delete_skills',
      metadata: { count: deleted.length, ids },
    });
    return deleted;
  }

  static async mapTopicToSkills(topicId: string, skillIds: string[], adminId: string) {
    const result = await SkillService.mapTopicToSkills(topicId, skillIds);
    await AuditService.log({ userId: adminId, action: 'admin_map_topic_skills', metadata: { topicId, skillIds } });
    return result;
  }

  /**
   * SESSION MONITORING (Optimized for Millions of Users)
   */
  static async getLiveSessions(page: number = 1, limit: number = 10, filters?: { search?: string }) {
    const offset = (page - 1) * limit;

    const sessionConditions = [
        eq(refreshTokens.revoked, false),
        gt(refreshTokens.expiresAt, new Date())
    ];

    if (filters?.search) {
        const searchPattern = `%${filters.search.toLowerCase()}%`;
        const userMatch = await db.select({ id: users.id })
            .from(users)
            .leftJoin(userProfiles, eq(users.id, userProfiles.userId))
            .where(sql`lower(${users.email}) ilike ${searchPattern} or lower(${userProfiles.name}) ilike ${searchPattern}`);
        
        const matchingUserIds = userMatch.map(u => u.id);
        if (matchingUserIds.length > 0) {
            sessionConditions.push(inArray(refreshTokens.userId, matchingUserIds));
        } else {
            return { sessions: [], total: 0, page, limit, totalPages: 0 };
        }
    }

    const whereClause = and(...sessionConditions);

    const [countResult] = await db.select({ count: sql`count(*)` })
      .from(refreshTokens)
      .where(whereClause);

    const sessions = await db.query.refreshTokens.findMany({
      where: whereClause,
      with: {
        user: {
          with: {
            profile: true
          }
        }
      },
      limit,
      offset,
      orderBy: [desc(refreshTokens.lastActiveAt)]
    });

    const enhancedSessions = sessions.map(session => {
        const lastActive = new Date(session.lastActiveAt).getTime();
        const now = Date.now();
        const diffMinutes = (now - lastActive) / 1000 / 60;
        
        let status = 'idle';
        if (diffMinutes < 5) status = 'active';
        
        return { ...session, status };
    });

    return {
      sessions: enhancedSessions,
      total: Number(countResult?.count || 0),
      page,
      limit,
      totalPages: Math.ceil(Number(countResult?.count || 0) / limit)
    };
  }

  /**
   * Section 16: User Management
   */
  static async getUsers(page: number = 1, limit: number = 20, status: 'active' | 'deleted' = 'active', filters?: { search?: string; role?: string; isBlocked?: boolean; isVerified?: boolean; status?: string }) {
    const offset = (page - 1) * limit;

    const conditions = [];
    
    // Status condition
    if (status === 'active') {
        conditions.push(isNull(users.deletedAt));
    } else {
        conditions.push(isNotNull(users.deletedAt));
    }

    // Search condition (Email or Name)
    if (filters?.search) {
        const searchPattern = `%${filters.search.toLowerCase()}%`;
        const profileMatch = await db.select({ id: userProfiles.userId })
            .from(userProfiles)
            .where(sql`lower(${userProfiles.name}) ilike ${searchPattern}`);
        
        const profileIds = profileMatch.map(m => m.id);
        
        if (profileIds.length > 0) {
            conditions.push(sql`(${users.email} ilike ${searchPattern} or ${users.id} in ${profileIds})`);
        } else {
            conditions.push(sql`${users.email} ilike ${searchPattern}`);
        }
    }

    // Role condition
    if (filters?.role) {
        const roleMatch = await db.select({ id: userRoles.userId })
            .from(userRoles)
            .innerJoin(roles, eq(userRoles.roleId, roles.id))
            .where(eq(roles.name, filters.role.toUpperCase()));
            
        const roleUserIds = roleMatch.map(m => m.id);
        if (roleUserIds.length > 0) {
            conditions.push(inArray(users.id, roleUserIds));
        } else {
            return { users: [], total: 0, page, limit, totalPages: 0 };
        }
    }

    // Blocked condition
    if (filters?.isBlocked !== undefined) {
        conditions.push(eq(users.isBlocked, filters.isBlocked));
    }

    // Verified condition
    if (filters?.isVerified !== undefined) {
        conditions.push(eq(users.emailVerified, filters.isVerified));
    }

    // Advanced Status Filter (online, idle, offline)
    if (filters?.status && filters.isBlocked === undefined) {
        const now = new Date();
        const twoMinsAgo = new Date(now.getTime() - 2 * 60 * 1000);
        const fiveMinsAgo = new Date(now.getTime() - 5 * 60 * 1000);

        if (filters.status === 'online') {
            conditions.push(gt(users.lastActiveAt, twoMinsAgo));
        } else if (filters.status === 'idle') {
            conditions.push(and(
                gt(users.lastActiveAt, fiveMinsAgo),
                sql`${users.lastActiveAt} <= ${twoMinsAgo}`
            ));
        } else if (filters.status === 'offline') {
            conditions.push(sql`(${users.lastActiveAt} is null or ${users.lastActiveAt} < ${fiveMinsAgo})`);
        }
    }

    const whereClause = and(...conditions);

    const [countResult] = await db.select({ count: sql`count(*)` })
        .from(users)
        .where(whereClause);

    const usersList = await db.query.users.findMany({
      limit,
      offset,
      where: whereClause,
      orderBy: [desc(users.createdAt)],
      with: {
        profile: true,
        userRoles: {
            with: {
                role: true
            }
        }
      }
    });

    // Compute status
    const now = new Date();
    const processedUsers = usersList.map(u => {
        let status = 'offline';
        if (u.lastActiveAt) {
            const diffMinutes = (now.getTime() - new Date(u.lastActiveAt).getTime()) / (1000 * 60);
            if (diffMinutes < 2) status = 'online';
            else if (diffMinutes < 5) status = 'idle';
        }
        
        // Blocked overrides everything
        if (u.isBlocked) status = 'blocked';

        return { ...u, status };
    });

    return {
      users: processedUsers,
      total: Number(countResult?.count || 0),
      page,
      limit,
      totalPages: Math.ceil(Number(countResult?.count || 0) / limit)
    };
  }

  static async updateUser(id: string, data: any, adminId: string) {
    // 1. Separate user fields from relations
    const { roles: newRoles, ...userFields } = data;

    // 0. Handle Password Hashing
    if (data.password) {
        userFields.passwordHash = await PasswordService.hash(data.password);
        delete userFields.password;
    }

    let updated;
    if (Object.keys(userFields).length > 0) {
        [updated] = await db.update(users).set(userFields).where(eq(users.id, id)).returning();
    }

    // 2. Handle Blocking Side Effects
    if (userFields.isBlocked === true) {
        await db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.userId, id));
    }

    // 3. Handle Role Updates
    if (newRoles && Array.isArray(newRoles)) {
        // Resolve Role IDs
        const roleRecords = await db.select().from(roles).where(inArray(sql`lower(${roles.name})`, newRoles.map((r: string) => r.toLowerCase())));
        
        if (roleRecords.length > 0) {
            // Transaction-like: Delete all existing roles for user, then insert new ones
            await db.delete(userRoles).where(eq(userRoles.userId, id));
            
            await db.insert(userRoles).values(
                roleRecords.map(r => ({
                    userId: id,
                    roleId: r.id
                }))
            );
        }
    }

    await AuditService.log({ userId: adminId, action: 'admin_update_user', metadata: { targetUserId: id, updates: data } });
    return updated || { id }; // Return updated user or just ID if only roles changed
  }


  static async toggleBlockStatus(userId: string, isBlocked: boolean, adminId: string) {
    return await this.updateUser(userId, { isBlocked }, adminId);
  }

  static async deleteUser(id: string, adminId: string) {
    // Soft Delete
    const [deleted] = await db.update(users)
        .set({ deletedAt: new Date() })
        .where(eq(users.id, id))
        .returning();
    
    // Revoke all tokens
    await db.update(refreshTokens).set({ revoked: true }).where(eq(refreshTokens.userId, id));

    await AuditService.log({ userId: adminId, action: 'admin_delete_user', metadata: { targetUserId: id } });
    return deleted;
  }

  /**
   * Section 4: Question Bank Management (Phase 8 - Enhanced)
   */
  static async getQuestions(page: number = 1, limit: number = 20, filters?: { domainId?: string; subjectId?: string; topicId?: string; subtopicId?: string; skillIds?: string[]; status?: string; search?: string }) {
    const offset = (page - 1) * limit;

    const conditions = [];
    
    // Status filter (default to active for general view, but allow override)
    if (filters?.status) {
        conditions.push(eq(questions.status, filters.status as any));
    } else {
        conditions.push(eq(questions.status, 'active'));
    }

    // Skill Filter (Many-to-Many)
    if (filters?.skillIds && filters.skillIds.length > 0) {
        const mappedQuestions = await db.select({ id: questionSkills.questionId })
            .from(questionSkills)
            .where(inArray(questionSkills.skillId, filters.skillIds));
        
        if (mappedQuestions.length > 0) {
            conditions.push(inArray(questions.id, mappedQuestions.map(m => m.id)));
        } else {
            return { questions: [], total: 0, page, limit, totalPages: 0 };
        }
    }

    if (filters?.subtopicId) {
        conditions.push(eq(questions.subtopicId, filters.subtopicId));
    } else if (filters?.topicId) {
        conditions.push(eq(questions.topicId, filters.topicId));
    } else if (filters?.subjectId) {
        // Find all topics for this subject
        const topicList = await db.select({ id: topics.id }).from(topics).where(eq(topics.subjectId, filters.subjectId));
        if (topicList.length > 0) {
            conditions.push(inArray(questions.topicId, topicList.map(t => t.id)));
        } else {
            // No topics found, return empty set
            return { questions: [], total: 0, page, limit, totalPages: 0 };
        }
    } else if (filters?.domainId) {
        // Find all subjects -> topics for this domain
        const subjectList = await db.select({ id: subjects.id }).from(subjects).where(eq(subjects.domainId, filters.domainId));
        if (subjectList.length > 0) {
            const topicList = await db.select({ id: topics.id }).from(topics).where(inArray(topics.subjectId, subjectList.map(s => s.id)));
            if (topicList.length > 0) {
                conditions.push(inArray(questions.topicId, topicList.map(t => t.id)));
            } else {
                return { questions: [], total: 0, page, limit, totalPages: 0 };
            }
        } else {
             return { questions: [], total: 0, page, limit, totalPages: 0 };
        }
    }

    if (filters?.search) {
        const searchPattern = `%${filters.search}%`;
        conditions.push(sql`(${questions.questionText} ILIKE ${searchPattern} OR ${questions.correctAnswer} ILIKE ${searchPattern} OR ${questions.explanation} ILIKE ${searchPattern})`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db.select({ count: sql`count(*)` })
        .from(questions)
        .where(whereClause);

    const questionsList = await db.query.questions.findMany({
      limit,
      offset,
      where: whereClause,
      orderBy: [desc(questions.createdAt)],
      with: {
        questionSkills: {
            with: {
                skill: true
            }
        },
        topic: {
          with: {
            subject: {
              with: {
                domain: true
              }
            }
          }
        }
      }
    });

    return {
      questions: questionsList,
      total: Number(countResult?.count || 0),
      page,
      limit,
      totalPages: Math.ceil(Number(countResult?.count || 0) / limit)
    };
  }

  /**
   * Updates an existing question.
   */
  static async updateQuestion(id: string, data: any, adminId: string) {
    // 1. Resolve topicId if subtopicId changed
    let topicId = data.topicId;
    if (data.subtopicId) {
        const subtopic = await db.query.subtopics.findFirst({
            where: eq(subtopics.id, data.subtopicId)
        });
        if (subtopic) {
            topicId = subtopic.topicId;
        }
    }

    // 2. Resolve & Normalize Options/CorrectAnswer
    let normalizedOptions = data.options;
    let correctAnswer = data.correctAnswer;

    if (data.options && Array.isArray(data.options)) {
        normalizedOptions = data.options.map((opt: any) => {
             if (typeof opt === 'object' && opt !== null) {
                 return {
                     id: opt.id || crypto.randomUUID(),
                     text: opt.text || opt.questionText || '',
                     isCorrect: !!opt.isCorrect
                 };
             }
             return {
                 id: crypto.randomUUID(),
                 text: String(opt),
                 isCorrect: false
             };
        });

        // Set isCorrect based on text match if none marked
        if (!normalizedOptions.some((o: any) => o.isCorrect) && correctAnswer) {
            normalizedOptions.forEach((o: any) => {
                if (o.text?.trim() === correctAnswer?.trim()) o.isCorrect = true;
            });
        }
        
        // Final sync of correctAnswer text based on the marked option
        const correctOption = normalizedOptions.find((o: any) => o.isCorrect);
        if (correctOption) correctAnswer = correctOption.text;
    }

    // 3. Map to schema
    const updateData: any = {
        updatedAt: new Date(),
    };
    if (topicId) updateData.topicId = topicId;
    if (data.subtopicId) updateData.subtopicId = data.subtopicId;
    if (data.difficulty) updateData.difficulty = data.difficulty;
    if (data.text) updateData.questionText = data.text;
    if (normalizedOptions) updateData.options = normalizedOptions;
    if (correctAnswer) updateData.correctAnswer = correctAnswer;
    if (data.explanation !== undefined) updateData.explanation = data.explanation;
    if (data.status) updateData.status = data.status;
    if (data.mappingType) updateData.mappingType = data.mappingType as 'conceptual' | 'technical' | 'practical';

    if (data.estimatedTime !== undefined || data.tags) {
        updateData.metadata = {
            estimatedTime: data.estimatedTime,
            tags: data.tags
        };
    }

    const [updated] = await QuestionService.updateQuestion(id, updateData, data.skillIds);

    await AuditService.log({
      userId: adminId,
      action: 'admin_update_question',
      metadata: { questionId: id },
    });

    return updated;
  }

  /**
   * Safely deletes a question (Soft Delete).
   */
  static async deleteQuestion(id: string, adminId: string) {
    const [deleted] = await db.update(questions)
        .set({ status: 'inactive', updatedAt: new Date() })
        .where(eq(questions.id, id))
        .returning();

    await AuditService.log({
      userId: adminId,
      action: 'admin_delete_question',
      metadata: { questionId: id },
    });

    return deleted;
  }

  static async deleteQuestionsBatch(ids: string[], adminId: string) {
    const deleted = await db.update(questions)
        .set({ status: 'inactive', updatedAt: new Date() })
        .where(inArray(questions.id, ids))
        .returning();

    await AuditService.log({
      userId: adminId,
      action: 'admin_batch_delete_questions',
      metadata: { count: deleted.length, ids },
    });

    return deleted;
  }

  static async getDomains(page: number = 1, limit: number = 20, filters?: { search?: string }) {
    const offset = (page - 1) * limit;
    
    const conditions = [];
    if (filters?.search) {
        const searchPattern = `%${filters.search}%`;
        conditions.push(sql`(${domains.name} ILIKE ${searchPattern} OR ${domains.category} ILIKE ${searchPattern} OR ${domains.description} ILIKE ${searchPattern})`);
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db.select({ count: sql`count(*)` }).from(domains).where(whereClause);
    const data = await db.query.domains.findMany({
        where: whereClause,
        limit,
        offset,
        orderBy: [desc(domains.createdAt)]
    });
    return {
        data,
        total: Number(countResult?.count || 0),
        page,
        limit,
        totalPages: Math.ceil(Number(countResult?.count || 0) / limit)
    };
  }

  static async getSubjects(page: number = 1, limit: number = 20, filters?: { domainId?: string; search?: string }) {
    const offset = (page - 1) * limit;
    
    const conditions = [];
    if (filters?.domainId) {
        conditions.push(eq(subjects.domainId, filters.domainId));
    }
    if (filters?.search) {
        const searchPattern = `%${filters.search}%`;
        conditions.push(sql`(${subjects.name} ILIKE ${searchPattern} OR ${subjects.description} ILIKE ${searchPattern})`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db.select({ count: sql`count(*)` })
        .from(subjects)
        .where(whereClause);

    const data = await db.query.subjects.findMany({
        limit,
        offset,
        where: whereClause,
        orderBy: [desc(subjects.createdAt)],
        with: {
            domain: true
        }
    });
    return {
        data,
        total: Number(countResult?.count || 0),
        page,
        limit,
        totalPages: Math.ceil(Number(countResult?.count || 0) / limit)
    };
  }

  static async getTopics(page: number = 1, limit: number = 20, filters?: { subjectId?: string; search?: string }) {
    const offset = (page - 1) * limit;

    const conditions = [];
    if (filters?.subjectId) {
        conditions.push(eq(topics.subjectId, filters.subjectId));
    }
    if (filters?.search) {
        const searchPattern = `%${filters.search}%`;
        conditions.push(sql`(${topics.name} ILIKE ${searchPattern} OR ${topics.description} ILIKE ${searchPattern})`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db.select({ count: sql`count(*)` })
        .from(topics)
        .where(whereClause);

    const data = await db.query.topics.findMany({
        limit,
        offset,
        where: whereClause,
        orderBy: [desc(topics.createdAt)],
        with: {
            subject: {
                with: {
                    domain: true
                }
            }
        }
    });
    return {
        data,
        total: Number(countResult?.count || 0),
        page,
        limit,
        totalPages: Math.ceil(Number(countResult?.count || 0) / limit)
    };
  }

  static async getSubtopics(page: number = 1, limit: number = 20, filters?: { topicId?: string; search?: string }) {
    const offset = (page - 1) * limit;

    const conditions = [];
    if (filters?.topicId) {
        conditions.push(eq(subtopics.topicId, filters.topicId));
    }
    if (filters?.search) {
        const searchPattern = `%${filters.search}%`;
        conditions.push(sql`(${subtopics.name} ILIKE ${searchPattern} OR ${subtopics.description} ILIKE ${searchPattern})`);
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db.select({ count: sql`count(*)` })
        .from(subtopics)
        .where(whereClause);

    const data = await db.query.subtopics.findMany({
        limit,
        offset,
        where: whereClause,
        orderBy: [desc(subtopics.createdAt)],
        with: {
            topic: {
                with: {
                    subject: {
                        with: {
                            domain: true
                        }
                    }
                }
            }
        }
    });
    return {
        data,
        total: Number(countResult?.count || 0),
        page,
        limit,
        totalPages: Math.ceil(Number(countResult?.count || 0) / limit)
    };
  }

  static async getSkills(page: number = 1, limit: number = 20, filters?: { search?: string }) {
    const offset = (page - 1) * limit;
    
    const conditions = [];
    if (filters?.search) {
        const searchPattern = `%${filters.search}%`;
        conditions.push(sql`(${skills.name} ILIKE ${searchPattern} OR ${skills.category}::text ILIKE ${searchPattern} OR ${skills.mappingType}::text ILIKE ${searchPattern})`);
    }
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [countResult] = await db.select({ count: sql`count(*)` }).from(skills).where(whereClause);
    const data = await db.query.skills.findMany({
        where: whereClause,
        limit,
        offset,
    });
    return {
        data,
        total: Number(countResult?.count || 0),
        page,
        limit,
        totalPages: Math.ceil(Number(countResult?.count || 0) / limit)
    };
  }

  static async getTopicSkills(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    const [countResult] = await db.select({ count: sql`count(*)` }).from(topicSkills);
    const data = await db.query.topicSkills.findMany({
        limit,
        offset,
        with: {
            topic: true,
            skill: true
        }
    });
    return {
        data,
        total: Number(countResult?.count || 0),
        page,
        limit,
        totalPages: Math.ceil(Number(countResult?.count || 0) / limit)
    };
  }

  static async getSkillsByTopic(topicId: string) {
    const data = await db.query.topicSkills.findMany({
        where: eq(topicSkills.topicId, topicId),
        with: {
            skill: true
        }
    });
    // Extract just the skill objects
    return data.map(ts => ts.skill);
  }
}
