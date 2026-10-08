import { db, domains, questions, questionSkills, skills,subjects, subtopics, topics } from '@quiz/db';
import { and, eq, inArray } from 'drizzle-orm';

import { type BackendQuestionType,normalizeQuestionOptions, normalizeQuestionType } from '../question/question-contract';

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

    // 2. Resolve Subjects in Batch
    if (_payload.subjects !== undefined && _payload.subjects.length > 0) {
      const dId = results.domainId;
      if (dId === null || dId === undefined) throw new Error('Domain context required for hierarchical operations.');
      
      const subjectNames = _payload.subjects.map(s => s.name);
      const existingSubjects = await tx.query.subjects.findMany({
        where: and(eq(subjects.domainId, dId), inArray(subjects.name, subjectNames))
      });
      const subjectMap = new Map(existingSubjects.map(s => [s.name, s.id]));

      // Identify missing subjects
      const subjectsToInsert = _payload.subjects
        .filter(s => (s.id === undefined || s.id === null || s.id === '') && !subjectMap.has(s.name))
        .map(s => ({ domainId: dId, name: s.name }));

      if (subjectsToInsert.length > 0) {
        const newSubjects = await tx.insert(subjects).values(subjectsToInsert).returning();
        newSubjects.forEach(s => {
          subjectMap.set(s.name, s.id);
          results.stats.subjects.added++;
        });
      }
      results.stats.subjects.skipped += existingSubjects.length;

      // Process subjects (nested topics will be batched inside)
      for (const s of _payload.subjects) {
        const subjectId = s.id ?? subjectMap.get(s.name)!;
        await this.processSubject(tx, s, dId, subjectId, results);
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
    if (batch.length === 0) return;
    const names = batch.map(b => b.name);
    const existingDomains = await tx.query.domains.findMany({
      where: inArray(domains.name, names)
    });
    const existingNames = new Set(existingDomains.map(d => d.name));
    
    const toInsert = batch.filter(b => !existingNames.has(b.name)).map(bd => ({
      name: bd.name,
      description: bd.description,
      category: bd.category
    }));

    if (toInsert.length > 0) {
      const newlyInserted = await tx.insert(domains).values(toInsert).returning();
      newlyInserted.forEach(d => results.batchDomains.push(d.id));
      results.stats.domains.added += newlyInserted.length;
    }
    
    existingDomains.forEach(d => results.batchDomains.push(d.id));
    results.stats.domains.skipped += existingDomains.length;
  }

  private static async handleBatchSkills(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], batch: { name: string; category?: string; mappingType?: string }[], results: ReturnType<typeof HierarchyFactory['initResults']>) {
    if (batch.length === 0) return;
    const names = batch.map(b => b.name);
    const existingSkills = await tx.query.skills.findMany({
      where: inArray(skills.name, names)
    });
    const existingNames = new Set(existingSkills.map(s => s.name));

    const toInsert = batch.filter(b => !existingNames.has(b.name)).map(bs => ({
      name: bs.name,
      category: ((bs.category !== undefined && bs.category !== null && bs.category !== '') ? bs.category : 'technical') as "technical" | "cognitive" | "process",
      mappingType: ((bs.mappingType !== undefined && bs.mappingType !== null && bs.mappingType !== '') ? bs.mappingType : 'conceptual') as "conceptual" | "technical" | "practical"
    }));

    if (toInsert.length > 0) {
      const newlyInserted = await tx.insert(skills).values(toInsert).returning();
      newlyInserted.forEach(s => results.batchSkills.push(s.id));
      results.stats.skills.added += newlyInserted.length;
    }

    existingSkills.forEach(s => results.batchSkills.push(s.id));
    results.stats.skills.skipped += existingSkills.length;
  }

  private static async processSubject(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], s: NonNullable<AtomicHierarchyPayload['subjects']>[number], domainId: string, subjectId: string, results: ReturnType<typeof HierarchyFactory['initResults']>) {
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

    if (s.topics && s.topics.length > 0) {
      // Batch resolve topics for this subject
      const topicNames = s.topics.map(t => t.name);
      const existingTopics = await tx.query.topics.findMany({
        where: and(eq(topics.subjectId, subjectId), inArray(topics.name, topicNames))
      });
      const topicMap = new Map(existingTopics.map(t => [t.name, t.id]));

      const topicsToInsert = s.topics
        .filter(t => (t.id === undefined || t.id === null || t.id === '') && !topicMap.has(t.name))
        .map(t => ({ subjectId, name: t.name }));

      if (topicsToInsert.length > 0) {
        const newTopics = await tx.insert(topics).values(topicsToInsert).returning();
        newTopics.forEach(t => {
          topicMap.set(t.name, t.id);
          results.stats.topics.added++;
        });
      }
      results.stats.topics.skipped += existingTopics.length;

      for (const t of s.topics) {
        const topicId = t.id ?? topicMap.get(t.name)!;
        await this.processTopic(tx, t, subjectId, topicId, results, subjectResult);
      }
    }
    results.subjects.push(subjectResult);
  }

  private static async processTopic(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], t: NonNullable<NonNullable<AtomicHierarchyPayload['subjects']>[number]['topics']>[number], subjectId: string, topicId: string, results: ReturnType<typeof HierarchyFactory['initResults']>, subjectResult: { id: string; name: string; topics: Array<{ id: string; name: string; subtopics?: Array<{ id: string; name: string }>; questions?: number }> }) {
    const topicResult = { id: topicId, name: t.name, subtopics: [] as Array<{ id: string; name: string }>, questions: 0 };

    if (t.subtopics && t.subtopics.length > 0) {
      // Batch resolve subtopics for this topic
      const subtopicNames = t.subtopics.map(st => st.name);
      const existingSubtopics = await tx.query.subtopics.findMany({
        where: and(eq(subtopics.topicId, topicId), inArray(subtopics.name, subtopicNames))
      });
      const subtopicMap = new Map(existingSubtopics.map(st => [st.name, st.id]));

      const subtopicsToInsert = t.subtopics
        .filter(st => (st.id === undefined || st.id === null || st.id === '') && !subtopicMap.has(st.name))
        .map(st => ({ topicId, name: st.name }));

      if (subtopicsToInsert.length > 0) {
        const newSubtopics = await tx.insert(subtopics).values(subtopicsToInsert).returning();
        newSubtopics.forEach(st => {
          subtopicMap.set(st.name, st.id);
          results.stats.subtopics.added++;
        });
      }
      results.stats.subtopics.skipped += existingSubtopics.length;

      for (const st of t.subtopics) {
        const subtopicId = st.id ?? subtopicMap.get(st.name)!;
        await this.processSubtopic(tx, st, topicId, subtopicId, results, topicResult);
      }
    }

    if (t.questions && t.questions.length > 0) {
       const count = await this.processQuestions(tx, t.questions, { topicId, subtopicId: null }, results);
       topicResult.questions += count;
    }

    subjectResult.topics.push(topicResult);
  }

  private static async processSubtopic(tx: Parameters<Parameters<typeof db.transaction>[0]>[0], st: NonNullable<NonNullable<NonNullable<AtomicHierarchyPayload['subjects']>[number]['topics']>[number]['subtopics']>[number], topicId: string, subtopicId: string, results: ReturnType<typeof HierarchyFactory['initResults']>, topicResult: { id: string; name: string; subtopics: Array<{ id: string; name: string }>, questions: number }) {
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
        options: normalizeQuestionOptions(rest.options),
        correctAnswer: rest.correctAnswer ?? '',
        type: normalizeQuestionType(rest.type) as BackendQuestionType,
        explanation: rest.explanation ?? null,
        codeSnippet: rest.codeSnippet ?? null,
        metadata: rest.metadata ?? {}
      };
    });

    const insertedQuestions = await tx.insert(questions).values(questionValues).returning();

    // 1. Collect all skill names to batch resolve
    const allSkillNames = new Set<string>();
    sourceQuestions.forEach(q => q.skillNames?.forEach(s => allSkillNames.add(s)));
    
    const skillMap = new Map<string, string>();
    if (allSkillNames.size > 0) {
      const existingSkills = await tx.query.skills.findMany({
        where: inArray(skills.name, Array.from(allSkillNames))
      });
      existingSkills.forEach(s => skillMap.set(s.name, s.id));

      const missingSkillNames = Array.from(allSkillNames).filter(name => !skillMap.has(name));
      if (missingSkillNames.length > 0) {
        const newlyInsertedSkills = await tx.insert(skills).values(
          missingSkillNames.map(name => ({
            name,
            category: 'technical' as const,
            mappingType: 'conceptual' as const
          }))
        ).returning();
        newlyInsertedSkills.forEach(s => skillMap.set(s.name, s.id));
      }
    }

    // 2. Prepare bulk questionSkills insert
    const questionSkillsToInsert: Array<{ questionId: string, skillId: string }> = [];

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
            const skillId = skillMap.get(skillName);
            if (skillId !== undefined && skillId !== null) {
              questionSkillsToInsert.push({
                questionId: insertedQ.id,
                skillId
              });
            }
          }
        }
    }

    if (questionSkillsToInsert.length > 0) {
      await tx.insert(questionSkills).values(questionSkillsToInsert);
    }
    return insertedQuestions.length;
  }
}
