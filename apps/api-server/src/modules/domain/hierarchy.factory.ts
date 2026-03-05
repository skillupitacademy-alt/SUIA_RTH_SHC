import { db, domains, questions, questionSkills, skills,subjects, subtopics, topics } from '@quiz/db';
import { and,eq } from 'drizzle-orm';

export interface HierarchyQuestionPayload {
  skillNames?: string[];
  mappingType?: string;
  skillWeight?: number;
  type?: string;
  questionText?: string; 
  difficulty?: "simple" | "intermediate" | "expert";
  correctAnswer?: string;
  options?: unknown;
  explanation?: string;
  codeSnippet?: string;
  metadata?: unknown;
}

export interface AtomicHierarchyPayload {
  domainId?: string;
  domainName?: string;
  description?: string;
  category?: string;
  subjects?: {
    id?: string;
    name: string;
    topics?: {
      id?: string;
      name: string;
      subtopics?: {
        id?: string;
        name: string;
        questions?: HierarchyQuestionPayload[];
      }[];
      questions?: HierarchyQuestionPayload[];
    }[];
  }[];
  batchDomains?: { name: string; description?: string; category?: string }[];
  batchSkills?: { name: string; category?: string; mappingType?: string }[];
}

export class HierarchyFactory {
  /**
   * Performs an atomic upsert of a nested hierarchy.
   */
  static async atomicUpsert(_payload: AtomicHierarchyPayload) {
    return await db.transaction(async (tx) => {
        return await this.executeAtomicUpsert(tx, _payload);
    });
  }

  static async atomicSeed(_payload: AtomicHierarchyPayload) {
    return await this.atomicUpsert(_payload);
  }

  // Backward compatibility shim for routes still calling seedAtomic
  static async seedAtomic(_payload: AtomicHierarchyPayload) {
    return await this.atomicSeed(_payload);
  }

  private static async executeAtomicUpsert(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], _payload: AtomicHierarchyPayload) {
    const results = this.initResults();

    // 1. Resolve Domain
    let domainId = _payload.domainId;
    const hasDomainName = (_payload.domainName !== undefined && _payload.domainName !== null && _payload.domainName !== '');
    
    if ((domainId === undefined || domainId === null || domainId === '') && hasDomainName) {
      domainId = await this.resolveDomain(tx, _payload, results);
    }
    results.domainId = (domainId !== undefined && domainId !== null && domainId !== '') ? domainId : null;
    this.validateUpsertContext(domainId ?? null, _payload);

    // 1.5 Handle Batch Domains
    if (_payload.batchDomains !== undefined) {
      await this.handleBatchDomains(tx, _payload.batchDomains, results);
    }

    // 1.6 Handle Batch Skills
    if (_payload.batchSkills !== undefined) {
      await this.handleBatchSkills(tx, _payload.batchSkills, results);
    }

    // 2. Resolve Subjects
    if (_payload.subjects !== undefined) {
      const dId = results.domainId;
      if (dId === null || dId === undefined) throw new Error('Domain context required for hierarchical operations.');
      for (const s of _payload.subjects) {
        await this.processSubject(tx, s, dId, results);
      }
    }

    return results;
  }

  private static validateUpsertContext(domainId: string | null, _payload: AtomicHierarchyPayload) {
    const hasDomain = (domainId !== null && domainId !== '');
    const hasBatchDomains = (_payload.batchDomains !== undefined && _payload.batchDomains !== null && _payload.batchDomains.length > 0);
    const hasBatchSkills = (_payload.batchSkills !== undefined && _payload.batchSkills !== null && _payload.batchSkills.length > 0);

    if (!hasDomain && !hasBatchDomains && !hasBatchSkills) {
      throw new Error('Domain ID, Domain Name, batchDomains, or batchSkills required for atomic upsert.');
    }
  }

  private static initResults() {
    return {
      domainId: null as string | null,
      subjects: [] as Array<{ 
        id: string; 
        name: string; 
        topics: Array<{ 
            id: string; 
            name: string; 
            subtopics: Array<{ id: string; name: string }>; 
            questions: number 
        }> 
      }>,
      questionIds: [] as string[],
      questionStats: { simple: 0, intermediate: 0, expert: 0, total: 0 },
      batchDomains: [] as string[],
      batchSkills: [] as string[],
      stats: {
        domains: { added: 0, skipped: 0 },
        subjects: { added: 0, skipped: 0 },
        topics: { added: 0, skipped: 0 },
        subtopics: { added: 0, skipped: 0 },
        skills: { added: 0, skipped: 0 }
      }
    };
  }

  private static async resolveDomain(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], _payload: AtomicHierarchyPayload, results: ReturnType<typeof HierarchyFactory['initResults']>): Promise<string> {
    const existing = await tx.query.domains.findFirst({
      where: eq(domains.name, _payload.domainName!),
    });
    if (existing) {
      results.stats.domains.skipped++;
      if ((_payload.description !== undefined && _payload.description !== null && _payload.description !== '') || (_payload.category !== undefined && _payload.category !== null && _payload.category !== '')) {
        await tx.update(domains).set({
            description: _payload.description ?? existing.description,
            category: _payload.category ?? existing.category
        }).where(eq(domains.id, existing.id));
      }
      return existing.id;
    } else {
      const [newDomain] = await tx.insert(domains).values({
        name: _payload.domainName!,
        description: _payload.description,
        category: _payload.category
      }).returning();
      results.stats.domains.added++;
      return newDomain.id;
    }
  }

  private static async handleBatchDomains(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], batch: { name: string; description?: string; category?: string }[], results: ReturnType<typeof HierarchyFactory['initResults']>) {
    for (const bd of batch) {
        const existing = await tx.query.domains.findFirst({
            where: eq(domains.name, bd.name)
        });
        if (existing) {
            results.batchDomains.push(existing.id);
            results.stats.domains.skipped++;
        } else {
            const [newDomain] = await tx.insert(domains).values({
                name: bd.name,
                description: bd.description,
                category: bd.category
            }).returning();
            results.batchDomains.push(newDomain.id);
            results.stats.domains.added++;
        }
    }
  }

  private static async handleBatchSkills(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], batch: { name: string; category?: string; mappingType?: string }[], results: ReturnType<typeof HierarchyFactory['initResults']>) {
    for (const bs of batch) {
        const existing = await tx.query.skills.findFirst({
            where: eq(skills.name, bs.name)
        });
        if (existing) {
            results.batchSkills.push(existing.id);
            results.stats.skills.skipped++;
        } else {
            const [newSkill] = await tx.insert(skills).values({
                name: bs.name,
                category: ((bs.category !== undefined && bs.category !== null && bs.category !== '') ? bs.category : 'technical') as "technical" | "cognitive" | "process",
                mappingType: ((bs.mappingType !== undefined && bs.mappingType !== null && bs.mappingType !== '') ? bs.mappingType : 'conceptual') as "conceptual" | "technical" | "practical"
            }).returning();
            results.batchSkills.push(newSkill.id);
            results.stats.skills.added++;
        }
    }
  }

  private static async processSubject(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], s: NonNullable<AtomicHierarchyPayload['subjects']>[number], domainId: string, results: ReturnType<typeof HierarchyFactory['initResults']>) {
    let subjectId = s.id;
    if (subjectId === undefined || subjectId === null || subjectId === '') {
      const existing = await tx.query.subjects.findFirst({
        where: and(eq(subjects.domainId, domainId), eq(subjects.name, s.name)),
      });
      if (existing) {
        subjectId = existing.id;
        results.stats.subjects.skipped++;
      } else {
        const [newSub] = await tx.insert(subjects).values({
          domainId,
          name: s.name,
        }).returning();
        subjectId = newSub.id;
        results.stats.subjects.added++;
      }
    }

    const subjectResult = { 
        id: subjectId, 
        name: s.name, 
        topics: [] as Array<{ 
            id: string; 
            name: string; 
            subtopics: Array<{ id: string; name: string }>; 
            questions: number 
        }> 
    };

    if (s.topics) {
      for (const t of s.topics) {
        await this.processTopic(tx, t, subjectId, results, subjectResult);
      }
    }
    results.subjects.push(subjectResult);
  }

  private static async processTopic(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], t: NonNullable<NonNullable<AtomicHierarchyPayload['subjects']>[number]['topics']>[number], subjectId: string, results: ReturnType<typeof HierarchyFactory['initResults']>, subjectResult: { id: string; name: string; topics: Array<{ id: string; name: string; subtopics?: Array<{ id: string; name: string }>; questions?: number }> }) {
    let topicId = t.id;
    if (topicId === undefined || topicId === null || topicId === '') {
      const existing = await tx.query.topics.findFirst({
        where: and(eq(topics.subjectId, subjectId), eq(topics.name, t.name)),
      });
      if (existing) {
        topicId = existing.id;
        results.stats.topics.skipped++;
      } else {
        const [newTopic] = await tx.insert(topics).values({
          subjectId,
          name: t.name,
        }).returning();
        topicId = newTopic.id;
        results.stats.topics.added++;
      }
    }

    const topicResult = { id: topicId, name: t.name, subtopics: [] as Array<{ id: string; name: string }>, questions: 0 };

    if (t.subtopics) {
      for (const st of t.subtopics) {
        await this.processSubtopic(tx, st, topicId, results, topicResult);
      }
    }

    if (t.questions && t.questions.length > 0) {
       const count = await this.processQuestions(tx, t.questions, { topicId, subtopicId: null }, results);
       topicResult.questions += count;
    }

    subjectResult.topics.push(topicResult);
  }

  private static async processSubtopic(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], st: NonNullable<NonNullable<NonNullable<AtomicHierarchyPayload['subjects']>[number]['topics']>[number]['subtopics']>[number], topicId: string, results: ReturnType<typeof HierarchyFactory['initResults']>, topicResult: { id: string; name: string; subtopics: Array<{ id: string; name: string }>, questions: number }) {
    let subtopicId = st.id;
    if (subtopicId === undefined || subtopicId === null || subtopicId === '') {
      const existing = await tx.query.subtopics.findFirst({
        where: and(eq(subtopics.topicId, topicId), eq(subtopics.name, st.name)),
      });
      if (existing) {
        subtopicId = existing.id;
        results.stats.subtopics.skipped++;
      } else {
        const [newSubtopic] = await tx.insert(subtopics).values({
          topicId,
          name: st.name,
        }).returning();
        subtopicId = newSubtopic.id;
        results.stats.subtopics.added++;
      }
    }

    const subtopicResult = { id: subtopicId, name: st.name, questions: 0 };

    if (st.questions && st.questions.length > 0) {
      const count = await this.processQuestions(tx, st.questions, { topicId, subtopicId }, results);
      subtopicResult.questions = count;
    }

    topicResult.subtopics.push(subtopicResult);
  }

  // Helper to deduplicate question creation logic
  private static async processQuestions(
    tx: Parameters<Parameters<typeof db.transaction>[0]>[0], 
    sourceQuestions: HierarchyQuestionPayload[], 
    context: { topicId: string; subtopicId: string | null },
    results: { questionIds: string[]; questionStats: { simple: number; intermediate: number; expert: number; total: number } }
  ) {
    const questionValues = sourceQuestions.map(q => {
      const { skillNames: _skillNames, mappingType: _mappingType, skillWeight: _skillWeight, ...rest } = q;
      return {
        topicId: context.topicId,
        subtopicId: context.subtopicId,
        status: 'active' as "active" | "inactive" | "draft",
        difficulty: (rest.difficulty ?? 'simple') as "simple" | "intermediate" | "expert",
        questionText: rest.questionText ?? 'Placeholder Question',
        options: rest.options ?? {},
        correctAnswer: rest.correctAnswer ?? '',
        type: (rest.type === 'code_mcq' ? 'code_mcq' : 'mcq') as "mcq" | "code_mcq",
        explanation: rest.explanation ?? null,
        codeSnippet: rest.codeSnippet ?? null,
        metadata: rest.metadata ?? {}
      };
    });

    const insertedQuestions = await tx.insert(questions).values(questionValues).returning();

    for (let i = 0; i < insertedQuestions.length; i++) {
        const sourceQ = sourceQuestions[i];
        const insertedQ = insertedQuestions[i];
        
        results.questionIds.push(insertedQ.id);

        // Increment Stats
        const diff = (insertedQ.difficulty ?? 'simple').toLowerCase();
        if (diff === 'simple') results.questionStats.simple++;
        else if (diff === 'intermediate') results.questionStats.intermediate++;
        else if (diff === 'expert') results.questionStats.expert++;
        results.questionStats.total++;

        if (sourceQ.skillNames && sourceQ.skillNames.length > 0) {
        for (const skillName of sourceQ.skillNames) {
            // Resolve or Create Skill
            let skillId: string;
            const existingSkill = await tx.query.skills.findFirst({
            where: eq(skills.name, skillName)
            });

            if (existingSkill) {
            skillId = existingSkill.id;
            } else {
            const validMappingTypes = ['conceptual', 'technical', 'practical'];
            const mType = sourceQ.mappingType?.toLowerCase() ?? 'conceptual';
            const finalMappingType = validMappingTypes.includes(mType) ? mType : 'conceptual';

            const [newSkill] = await tx.insert(skills).values({
                name: skillName,
                category: 'technical',
                mappingType: finalMappingType as "conceptual" | "technical" | "practical"
            }).returning();
            skillId = newSkill.id;
            }

            // Link Question to Skill
            await tx.insert(questionSkills).values({
            questionId: insertedQ.id,
            skillId
            });
        }
        }
    }
    return insertedQuestions.length;
  }
}
