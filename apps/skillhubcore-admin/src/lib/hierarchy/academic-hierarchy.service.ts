import {
  domainSchema, subjectSchema, topicSchema, subtopicSchema, skillSchema,
  type DomainInput, type SubjectInput, type TopicInput, type SubtopicInput, type SkillInput,
} from '@/schemas/hierarchy.schemas';
import {
  getDb,
  domains,
  subjects,
  topics,
  subtopics,
  skills,
  questions,
  questionSkills,
  topicSkills,
} from '@quiz/db';
import {
  db as tutorialDb,
  tutorialSidebarTreesV2,
  tutorialSubtopics,
  tutorialSections,
  hasTutorialHierarchyDependents,
} from '@quiz/db-tutorial';
import { eq, inArray } from 'drizzle-orm';
import { validateJsonDepth, validateJsonSize } from '@/lib/sanitize';

export function normalizeComplexity(value: unknown): 'beginner' | 'intermediate' | 'advanced' | 'expert' {
  if (typeof value === 'number' && Number.isFinite(value)) {
    if (value >= 4) return 'expert';
    if (value === 3) return 'advanced';
    if (value === 2) return 'intermediate';
    return 'beginner';
  }
  if (typeof value === 'string') {
    const normalized = value.toLowerCase();
    if (normalized === 'expert') return 'expert';
    if (normalized === 'advanced') return 'advanced';
    if (normalized === 'intermediate') return 'intermediate';
    if (normalized === 'beginner') return 'beginner';
    const numeric = Number(value);
    if (Number.isFinite(numeric)) return normalizeComplexity(numeric);
  }
  return 'beginner';
}


export const MAX_BATCH_DELETE_SIZE = 100;
export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * ARCHITECTURAL BOUNDARY & COORDINATION LIMITATION:
 * ------------------------------------------------
 * 1. MainDB row locks (`SELECT ... FOR UPDATE`) serialize concurrent transactions and prevent concurrent
 *    child inserts within PostgreSQL MainDB (domains, subjects, topics, subtopics, skills, questions).
 * 2. MainDB row locks DO NOT lock related records in TutorialDB (tutorialSidebarTreesV2, tutorialSections,
 *    tutorialSubtopics). MainDB and TutorialDB are distinct physical PostgreSQL instances.
 * 3. Cross-database distributed two-phase commit (2PC) is NOT supported without an external coordinator.
 * 4. Consequently, checkTopicDependencies and checkSubtopicDependencies query TutorialDB read-only
 *    to verify absence of dependent tutorial sections or sidebars. If TutorialDB is unreachable,
 *    the check fails closed with DependencyCheckUnavailableError (503).
 * 5. Canonical TutorialDB writers now hold the corresponding MainDB ancestor locks
 *    through their TutorialDB commit/rollback. Deletion waits for those writers,
 *    then checks physically retained mappings and records. Direct SQL maintenance
 *    must follow that convention. Cross-database atomicity is not provided.
 */

interface LockableQuery {
  for: (strength: 'update' | 'no key update' | 'share' | 'key share') => Promise<unknown>;
}

/**
 * Acquires a row-level lock on selected rows to serialize concurrent transactions
 * and prevent concurrent child creation between pre-delete dependency checks and deletion.
 * Fails closed (throws DependencyCheckUnavailableError) if the query does not support
 * PostgreSQL FOR UPDATE locking or encounters a database connection outage.
 */
async function acquireRowLock(entityType: string, entityId: string, query: unknown): Promise<void> {
  try {
    if (!query || typeof query !== 'object' || !('for' in query) || typeof (query as LockableQuery).for !== 'function') {
      throw new Error(`Row lock query does not support PostgreSQL FOR UPDATE locking for ${entityType} ${entityId}`);
    }
    await (query as LockableQuery).for('update');
  } catch (error) {
    if (error instanceof DependencyCheckUnavailableError) throw error;
    throw new DependencyCheckUnavailableError(entityType, entityId, error);
  }
}

/**
 * Custom error thrown when dependency check storage (MainDB or TutorialDB) is unreachable.
 * Fails closed to prevent unsafe deletion cascades when dependencies cannot be verified.
 */
export class DependencyCheckUnavailableError extends Error {
  public readonly entityType: string;
  public readonly entityId: string;
  public readonly causeError?: unknown;

  constructor(entityType: string, entityId: string, causeError?: unknown) {
    super(`Dependency check storage is temporarily unavailable for ${entityType} ${entityId}`);
    this.name = 'DependencyCheckUnavailableError';
    this.entityType = entityType;
    this.entityId = entityId;
    this.causeError = causeError;
  }
}

export interface DependencyConflict {
  entityType: 'domain' | 'subject' | 'topic' | 'subtopic' | 'skill';
  entityId: string;
  message: string;
  dependents: Record<string, number>;
}

export interface BatchValidationResult {
  success: boolean;
  ids?: string[];
  error?: string;
  status?: number;
}

export interface HierarchyDeleteResult {
  status: 200 | 400 | 404 | 409 | 413 | 500 | 503;
  message?: string;
  error?: string;
  conflictType?: 'DEPENDENCY_CONFLICT';
  entityType?: string;
  entityId?: string;
  dependencies?: Record<string, number>;
  conflictingIds?: string[];
}

type DbClient = ReturnType<typeof getDb>;
type TransactionClient = Parameters<Parameters<DbClient['transaction']>[0]>[0];
export type DbExecutor = DbClient | TransactionClient;

/**
 * Validates batch delete payload from request body.
 * Enforces JSON depth, size, non-empty array, UUID format, and maximum batch size (100).
 */
export function validateBatchDeletePayload(
  rawBody: unknown,
  entityName: string
): BatchValidationResult {
  if (!validateJsonDepth(rawBody) || !validateJsonSize(rawBody)) {
    return {
      success: false,
      error: 'Payload too deep or large',
      status: 400,
    };
  }

  if (typeof rawBody !== 'object' || rawBody === null) {
    return {
      success: false,
      error: `${entityName} IDs are required`,
      status: 400,
    };
  }

  const { ids } = rawBody as { ids?: unknown };

  if (!Array.isArray(ids) || ids.length === 0) {
    return {
      success: false,
      error: `${entityName} IDs are required`,
      status: 400,
    };
  }

  if (ids.length > MAX_BATCH_DELETE_SIZE) {
    return {
      success: false,
      error: `Batch size exceeds maximum limit of ${MAX_BATCH_DELETE_SIZE} items`,
      status: 413,
    };
  }

  // Validate that all elements are non-empty strings and valid UUIDs
  const validatedIds: string[] = [];
  for (const item of ids) {
    if (typeof item !== 'string' || !item.trim()) {
      return {
        success: false,
        error: `Invalid ID in batch: must be non-empty string`,
        status: 400,
      };
    }
    const trimmed = item.trim();
    if (!UUID_REGEX.test(trimmed)) {
      return {
        success: false,
        error: `Invalid UUID format in batch: "${trimmed}"`,
        status: 400,
      };
    }
    validatedIds.push(trimmed);
  }

  // Deduplicate and sort IDs deterministically to prevent deadlocks across concurrent batch transactions
  const uniqueIds = Array.from(new Set(validatedIds)).sort();

  return {
    success: true,
    ids: uniqueIds,
  };
}

/**
 * Validates a single UUID string
 */
export function isValidUuid(id: string): boolean {
  return typeof id === 'string' && UUID_REGEX.test(id.trim());
}

/**
 * Checks dependencies for a domain before destructive operations.
 * Domain has child subjects in MainDB.
 * Fails closed (throws DependencyCheckUnavailableError) on database error.
 *
 * Physical row retention: checks ALL physical rows (without isNull(deletedAt))
 * because PostgreSQL ON DELETE CASCADE / RESTRICT triggers operate at physical engine level.
 */
export async function checkDomainDependencies(
  domainId: string,
  executor?: DbExecutor
): Promise<DependencyConflict | null> {
  const client = executor ?? getDb();
  try {
    const dependentSubjects = await client
      .select({ id: subjects.id, domainId: subjects.domainId })
      .from(subjects)
      .where(eq(subjects.domainId, domainId))
      .limit(100);

    // Filter to ensure foreign key match
    const matching = (dependentSubjects as Array<{ id: string; domainId: string }>).filter(
      (s) => s.domainId === domainId
    );

    if (matching.length > 0) {
      return {
        entityType: 'domain',
        entityId: domainId,
        message: `Cannot delete domain because ${matching.length} dependent subject(s) exist`,
        dependents: { subjects: matching.length },
      };
    }
    if (await hasTutorialHierarchyDependents('domain', [domainId])) {
      return { entityType: 'domain', entityId: domainId, message: 'Retained tutorial hierarchy dependency', dependents: { tutorials: 1 } };
    }
    return null;
  } catch (error) {
    if (error instanceof DependencyCheckUnavailableError) throw error;
    throw new DependencyCheckUnavailableError('domain', domainId, error);
  }
}

/**
 * Checks dependencies for a subject before destructive operations.
 * Subject has child topics in MainDB.
 * Fails closed (throws DependencyCheckUnavailableError) on database error.
 * Physical row retention: inspects all physical rows regardless of soft-delete flags.
 */
export async function checkSubjectDependencies(
  subjectId: string,
  executor?: DbExecutor
): Promise<DependencyConflict | null> {
  const client = executor ?? getDb();
  try {
    const dependentTopics = await client
      .select({ id: topics.id, subjectId: topics.subjectId })
      .from(topics)
      .where(eq(topics.subjectId, subjectId))
      .limit(100);

    const matching = (dependentTopics as Array<{ id: string; subjectId: string }>).filter(
      (t) => t.subjectId === subjectId
    );

    if (matching.length > 0) {
      return {
        entityType: 'subject',
        entityId: subjectId,
        message: `Cannot delete subject because ${matching.length} dependent topic(s) exist`,
        dependents: { topics: matching.length },
      };
    }
    if (await hasTutorialHierarchyDependents('subject', [subjectId])) {
      return { entityType: 'subject', entityId: subjectId, message: 'Retained tutorial hierarchy dependency', dependents: { tutorials: 1 } };
    }
    return null;
  } catch (error) {
    if (error instanceof DependencyCheckUnavailableError) throw error;
    throw new DependencyCheckUnavailableError('subject', subjectId, error);
  }
}

/**
 * Checks dependencies for a topic before destructive operations.
 * Topic has child subtopics, questions, topicSkills in MainDB, and tutorial sidebars in TutorialDB.
 * Fails closed (throws DependencyCheckUnavailableError) on database error.
 * Cross-database dependencies: TutorialDB sidebars are pre-checked fail-closed.
 * Physical row retention: inspects all physical rows regardless of soft-delete flags.
 */
export async function checkTopicDependencies(
  topicId: string,
  executor?: DbExecutor
): Promise<DependencyConflict | null> {
  const client = executor ?? getDb();
  const dependents: Record<string, number> = {};

  try {
    // 1. Check child subtopics in MainDB (physical rows)
    const dependentSubtopics = await client
      .select({ id: subtopics.id, topicId: subtopics.topicId })
      .from(subtopics)
      .where(eq(subtopics.topicId, topicId))
      .limit(100);

    const matchingSubtopics = (dependentSubtopics as Array<{ id: string; topicId: string }>).filter(
      (s) => s.topicId === topicId
    );
    if (matchingSubtopics.length > 0) {
      dependents.subtopics = matchingSubtopics.length;
    }

    // 2. Check dependent questions in MainDB (physical rows)
    const dependentQuestions = await client
      .select({ id: questions.id, topicId: questions.topicId })
      .from(questions)
      .where(eq(questions.topicId, topicId))
      .limit(100);

    const matchingQuestions = (dependentQuestions as Array<{ id: string; topicId: string }>).filter(
      (q) => q.topicId === topicId
    );
    if (matchingQuestions.length > 0) {
      dependents.questions = matchingQuestions.length;
    }

    // 3. Check topicSkills mapping in MainDB (direct exported table)
    const dependentTopicSkills = await client
      .select({ topicId: topicSkills.topicId, skillId: topicSkills.skillId })
      .from(topicSkills)
      .where(eq(topicSkills.topicId, topicId))
      .limit(100);

    const matchingTopicSkills = (dependentTopicSkills as Array<{ topicId: string; skillId: string }>).filter(
      (ts) => ts.topicId === topicId
    );
    if (matchingTopicSkills.length > 0) {
      dependents.topicSkills = matchingTopicSkills.length;
    }
  } catch (error) {
    if (error instanceof DependencyCheckUnavailableError) throw error;
    throw new DependencyCheckUnavailableError('topic', topicId, error);
  }

  try {
    // 4. Check tutorial sidebars in TutorialDB
    // Cross-database note: MainDB and TutorialDB are separate database instances without 2PC.
    // Preflight fail-closed check ensures cross-database referential integrity before MainDB deletion.
    if (await hasTutorialHierarchyDependents('topic', [topicId])) dependents.tutorialHierarchy = 1;
    if (tutorialDb && tutorialSidebarTreesV2) {
      const sidebars = await tutorialDb
        .select({ topicId: tutorialSidebarTreesV2.topicId })
        .from(tutorialSidebarTreesV2)
        .where(eq(tutorialSidebarTreesV2.topicId, topicId))
        .limit(100);
      const matchingSidebars = (sidebars as Array<{ topicId: string }>).filter(
        (s) => s.topicId === topicId
      );
      if (matchingSidebars.length > 0) {
        dependents.sidebars = matchingSidebars.length;
      }
    }
  } catch (error) {
    throw new DependencyCheckUnavailableError('topic', topicId, error);
  }

  if (Object.keys(dependents).length > 0) {
    return {
      entityType: 'topic',
      entityId: topicId,
      message: `Cannot delete topic because dependent records exist: ${Object.entries(dependents).map(([k, v]) => `${v} ${k}`).join(', ')}`,
      dependents,
    };
  }

  return null;
}

/**
 * Checks dependencies for a subtopic before destructive operations.
 * Subtopic has child questions in MainDB and tutorial sections in TutorialDB.
 * Fails closed (throws DependencyCheckUnavailableError) on database error.
 * Cross-database dependencies: TutorialDB sections are pre-checked fail-closed.
 * Physical row retention: inspects all physical rows regardless of soft-delete flags.
 */
export async function checkSubtopicDependencies(
  subtopicId: string,
  executor?: DbExecutor
): Promise<DependencyConflict | null> {
  const client = executor ?? getDb();
  const dependents: Record<string, number> = {};

  try {
    // 1. Check questions referencing subtopic in MainDB (physical rows)
    const dependentQuestions = await client
      .select({ id: questions.id, subtopicId: questions.subtopicId })
      .from(questions)
      .where(eq(questions.subtopicId, subtopicId))
      .limit(100);

    const matchingQuestions = (dependentQuestions as Array<{ id: string; subtopicId: string | null }>).filter(
      (q) => q.subtopicId === subtopicId
    );
    if (matchingQuestions.length > 0) {
      dependents.questions = matchingQuestions.length;
    }
  } catch (error) {
    if (error instanceof DependencyCheckUnavailableError) throw error;
    throw new DependencyCheckUnavailableError('subtopic', subtopicId, error);
  }

  try {
    // 2. Check tutorial sections in TutorialDB (linked via tutorialSubtopics.externalId)
    // Cross-database note: checks physical tutorial sections fail-closed.
    if (await hasTutorialHierarchyDependents('subtopic', [subtopicId])) dependents.tutorialHierarchy = 1;
    if (tutorialDb && tutorialSubtopics && tutorialSections) {
      const [tutSubtopic] = await tutorialDb
        .select({ id: tutorialSubtopics.id, externalId: tutorialSubtopics.externalId })
        .from(tutorialSubtopics)
        .where(eq(tutorialSubtopics.externalId, subtopicId))
        .limit(1);

      if (tutSubtopic && tutSubtopic.externalId === subtopicId) {
        const sections = await tutorialDb
          .select({ id: tutorialSections.id })
          .from(tutorialSections)
          .where(eq(tutorialSections.subtopicId, tutSubtopic.id))
          .limit(100);
        if (sections.length > 0) {
          dependents.tutorials = sections.length;
        }
      }
    }
  } catch (error) {
    throw new DependencyCheckUnavailableError('subtopic', subtopicId, error);
  }

  if (Object.keys(dependents).length > 0) {
    return {
      entityType: 'subtopic',
      entityId: subtopicId,
      message: `Cannot delete subtopic because dependent records exist: ${Object.entries(dependents).map(([k, v]) => `${v} ${k}`).join(', ')}`,
      dependents,
    };
  }

  return null;
}

/**
 * Checks dependencies for a skill before destructive operations.
 * Skill is referenced by topicSkills, questionSkills, and legacy questions in MainDB.
 * Fails closed (throws DependencyCheckUnavailableError) on database error.
 * Physical row retention: inspects all physical rows regardless of soft-delete flags.
 */
export async function checkSkillDependencies(
  skillId: string,
  executor?: DbExecutor
): Promise<DependencyConflict | null> {
  const client = executor ?? getDb();
  const dependents: Record<string, number> = {};

  try {
    // 1. Check topicSkills referencing this skill (direct exported table)
    const mappedTopics = await client
      .select({ topicId: topicSkills.topicId, skillId: topicSkills.skillId })
      .from(topicSkills)
      .where(eq(topicSkills.skillId, skillId))
      .limit(100);

    const matchingTopics = (mappedTopics as Array<{ topicId: string; skillId: string }>).filter(
      (ts) => ts.skillId === skillId
    );
    if (matchingTopics.length > 0) {
      dependents.topicSkills = matchingTopics.length;
    }

    // 2. Check questionSkills referencing this skill (direct exported table)
    const mappedQuestionSkills = await client
      .select({ questionId: questionSkills.questionId, skillId: questionSkills.skillId })
      .from(questionSkills)
      .where(eq(questionSkills.skillId, skillId))
      .limit(100);

    const matchingQuestionSkills = (mappedQuestionSkills as Array<{ questionId: string; skillId: string }>).filter(
      (qs) => qs.skillId === skillId
    );
    if (matchingQuestionSkills.length > 0) {
      dependents.questionSkills = matchingQuestionSkills.length;
    }

    // 3. Check legacy questions referencing this skill (physical rows)
    const legacyQuestions = await client
      .select({ id: questions.id, skillId: questions.skillId })
      .from(questions)
      .where(eq(questions.skillId, skillId))
      .limit(100);

    const matchingLegacy = (legacyQuestions as Array<{ id: string; skillId: string | null }>).filter(
      (q) => q.skillId === skillId
    );
    if (matchingLegacy.length > 0) {
      dependents.questions = matchingLegacy.length;
    }
  } catch (error) {
    if (error instanceof DependencyCheckUnavailableError) throw error;
    throw new DependencyCheckUnavailableError('skill', skillId, error);
  }

  if (Object.keys(dependents).length > 0) {
    return {
      entityType: 'skill',
      entityId: skillId,
      message: `Cannot delete skill because dependent records exist: ${Object.entries(dependents).map(([k, v]) => `${v} ${k}`).join(', ')}`,
      dependents,
    };
  }

  return null;
}

/**
 * Authoritative Hierarchy Service for SHC Admin
 * Centralizes taxonomy mutations, referential validation, and atomic delete safety.
 */
export class AcademicHierarchyService {
  static async createDomain(input: DomainInput) {
    const body = domainSchema.parse(input);
    const db = getDb();

    const [newDomain] = await db
      .insert(domains)
      .values({
        name: body.name,
        description: body.description,
        category: body.category,
        order: body.order ?? 0,
        status: body.status ?? 'active',
      })
      .returning();

    return newDomain;
  }

  static async updateDomain(id: string, input: Partial<DomainInput>) {
    const { name, description, category, status, order } = domainSchema.partial().parse(input);
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (status !== undefined) updateData.status = status;
    if (order !== undefined) updateData.order = order;

    const db = getDb();
    const [updatedDomain] = await db
      .update(domains)
      .set(updateData)
      .where(eq(domains.id, id))
      .returning();

    return updatedDomain;
  }

  static async createSubject(input: SubjectInput) {
    const body = subjectSchema.parse(input);
    const db = getDb();

    const [newSubject] = await db
      .insert(subjects)
      .values({
        name: body.name,
        description: body.description,
        domainId: body.domainId,
        status: body.status ?? 'active',
        order: body.order ?? 0,
      })
      .returning();

    return newSubject;
  }

  static async updateSubject(id: string, input: Partial<SubjectInput>) {
    const { name, description, domainId, status, order } = subjectSchema.partial().parse(input);
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (domainId !== undefined) updateData.domainId = domainId;
    if (status !== undefined) updateData.status = status;
    if (order !== undefined) updateData.order = order;

    const db = getDb();
    const [updated] = await db.update(subjects).set(updateData).where(eq(subjects.id, id)).returning();

    return updated;
  }

  static async createTopic(input: TopicInput) {
    const body = topicSchema.parse(input);
    const db = getDb();

    const [newTopic] = await db
      .insert(topics)
      .values({
        name: body.name,
        description: body.description,
        subjectId: body.subjectId,
        complexity: normalizeComplexity(body.complexity ?? body.complexityLevel),
        weight: body.weight ?? 1,
        order: body.order ?? 0,
        status: body.status ?? 'active',
      })
      .returning();

    return newTopic;
  }

  static async updateTopic(id: string, input: Partial<TopicInput>) {
    const { name, description, subjectId, complexity, complexityLevel, weight, status, order } = topicSchema.partial().parse(input);
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (subjectId !== undefined) updateData.subjectId = subjectId;
    if (complexity !== undefined || complexityLevel !== undefined) {
      updateData.complexity = normalizeComplexity(complexity ?? complexityLevel);
    }
    if (weight !== undefined) updateData.weight = weight;
    if (status !== undefined) updateData.status = status;
    if (order !== undefined) updateData.order = order;

    const db = getDb();
    const [updated] = await db.update(topics).set(updateData).where(eq(topics.id, id)).returning();
    return updated;
  }

  static async createSubtopic(input: SubtopicInput) {
    const body = subtopicSchema.parse(input);
    const db = getDb();

    const [newSubtopic] = await db
      .insert(subtopics)
      .values({
        name: body.name,
        description: body.description,
        topicId: body.topicId,
        depth: body.depth ?? body.depthLevel ?? 1,
        status: body.status ?? 'active',
        order: body.order ?? body.orderIndex ?? 0,
      })
      .returning();

    return newSubtopic;
  }

  static async updateSubtopic(id: string, input: Partial<SubtopicInput>) {
    const { name, description, topicId, depth, depthLevel, status, order, orderIndex } = subtopicSchema.partial().parse(input);
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (topicId !== undefined) updateData.topicId = topicId;
    if (depth !== undefined || depthLevel !== undefined) updateData.depth = depth ?? depthLevel;
    if (status !== undefined) updateData.status = status;
    if (order !== undefined || orderIndex !== undefined) updateData.order = order ?? orderIndex;

    const db = getDb();
    const [updated] = await db.update(subtopics).set(updateData).where(eq(subtopics.id, id)).returning();
    return updated;
  }

  static async createSkill(input: SkillInput) {
    const body = skillSchema.parse(input);
    const db = getDb();

    const [newSkill] = await db
      .insert(skills)
      .values({
        name: body.name,
        description: body.description,
        category: body.category,
        weight: body.weight ?? 1,
        status: body.status ?? 'active',
      })
      .returning();
    return newSkill;
  }

  static async updateSkill(id: string, input: Partial<SkillInput>) {
    const { name, description, category, mappingType, weight, status } = skillSchema.partial().parse(input);
    const updateData: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    void mappingType;
    if (weight !== undefined) updateData.weight = weight;
    if (status !== undefined) updateData.status = status;

    const db = getDb();
    const [updated] = await db.update(skills).set(updateData).where(eq(skills.id, id)).returning();
    return updated;
  }

  /**
   * Executes a destructive hierarchy operation strictly inside a database transaction.
   * Fails closed with 503 if transaction support is unavailable or storage fails.
   * Removes production-capable fallback that executes deletions directly without transaction support.
   */
  private static async executeDestructiveTransaction(
    entityName: string,
    operation: (tx: DbExecutor) => Promise<HierarchyDeleteResult>
  ): Promise<HierarchyDeleteResult> {
    const db = getDb();
    if (!db || typeof db !== 'object' || !('transaction' in db) || typeof db.transaction !== 'function') {
      return {
        status: 503,
        error: `Database transaction support is unavailable for ${entityName} deletion. Destructive operation rejected to guarantee isolation.`,
      };
    }

    try {
      return await db.transaction(operation);
    } catch (error) {
      if (error instanceof DependencyCheckUnavailableError) {
        return {
          status: 503,
          error: 'Dependency verification storage is temporarily unavailable. Deletion aborted to prevent unsafe cascade.',
        };
      }
      console.error(`[AcademicHierarchyService] Error during ${entityName} deletion:`, error);
      return {
        status: 500,
        error: `Internal server error during ${entityName} deletion`,
      };
    }
  }

  /**
   * Delete a domain with referential safety wrapped in a transaction
   */
  static async deleteDomain(id: string): Promise<HierarchyDeleteResult> {
    if (!isValidUuid(id)) {
      return { status: 400, error: 'Invalid UUID format for Domain ID' };
    }

    const runInTx = async (tx: DbExecutor): Promise<HierarchyDeleteResult> => {
      // 1. Acquire row lock to serialize concurrent transactions and prevent concurrent child creation
      await acquireRowLock('domain', id, tx.select({ id: domains.id }).from(domains).where(eq(domains.id, id)));

      // 2. Verify dependencies within the transaction
      const conflict = await checkDomainDependencies(id, tx);
      if (conflict) {
        return {
          status: 409,
          error: conflict.message,
          conflictType: 'DEPENDENCY_CONFLICT',
          entityType: 'domain',
          entityId: id,
          dependencies: conflict.dependents,
        };
      }

      const [deleted] = await tx.delete(domains).where(eq(domains.id, id)).returning();
      if (!deleted) {
        return { status: 404, error: 'Domain not found' };
      }

      return { status: 200, message: 'Domain deleted successfully' };
    };

    return await this.executeDestructiveTransaction('domain', runInTx);
  }

  /**
   * Batch delete domains with referential safety and bound enforcement inside a transaction
   */
  static async batchDeleteDomains(rawIds: unknown): Promise<HierarchyDeleteResult> {
    const validation = validateBatchDeletePayload(rawIds, 'Domain');
    if (!validation.success || !validation.ids) {
      return {
        status: (validation.status ?? 400) as 400 | 413,
        error: validation.error ?? 'Invalid batch request',
      };
    }

    // IDs are deterministically sorted to prevent deadlock under concurrent batch locks
    const ids = [...validation.ids].sort();

    const runInTx = async (tx: DbExecutor): Promise<HierarchyDeleteResult> => {
      // 1. Acquire row locks in deterministic ascending ID order
      await acquireRowLock(
        'domain',
        ids.join(','),
        tx.select({ id: domains.id }).from(domains).where(inArray(domains.id, ids)).orderBy(domains.id)
      );

      const conflictingIds: string[] = [];
      const aggregatedDependencies: Record<string, number> = {};

      for (const id of ids) {
        const conflict = await checkDomainDependencies(id, tx);
        if (conflict) {
          conflictingIds.push(id);
          for (const [key, val] of Object.entries(conflict.dependents)) {
            aggregatedDependencies[key] = (aggregatedDependencies[key] ?? 0) + val;
          }
        }
      }

      if (conflictingIds.length > 0) {
        return {
          status: 409,
          error: `Cannot delete domains because dependent subjects exist for ${conflictingIds.length} item(s)`,
          conflictType: 'DEPENDENCY_CONFLICT',
          entityType: 'domain',
          conflictingIds,
          dependencies: aggregatedDependencies,
        };
      }

      await tx.delete(domains).where(inArray(domains.id, ids));
      return { status: 200, message: `${ids.length} domains deleted successfully` };
    };

    return await this.executeDestructiveTransaction('batch domain', runInTx);
  }

  /**
   * Delete a subject with referential safety wrapped in a transaction
   */
  static async deleteSubject(id: string): Promise<HierarchyDeleteResult> {
    if (!isValidUuid(id)) {
      return { status: 400, error: 'Invalid UUID format for Subject ID' };
    }

    const runInTx = async (tx: DbExecutor): Promise<HierarchyDeleteResult> => {
      // 1. Acquire row lock to serialize concurrent transactions and prevent concurrent child creation
      await acquireRowLock('subject', id, tx.select({ id: subjects.id }).from(subjects).where(eq(subjects.id, id)));

      // 2. Verify dependencies within the transaction
      const conflict = await checkSubjectDependencies(id, tx);
      if (conflict) {
        return {
          status: 409,
          error: conflict.message,
          conflictType: 'DEPENDENCY_CONFLICT',
          entityType: 'subject',
          entityId: id,
          dependencies: conflict.dependents,
        };
      }

      const [deleted] = await tx.delete(subjects).where(eq(subjects.id, id)).returning();
      if (!deleted) {
        return { status: 404, error: 'Subject not found' };
      }

      return { status: 200, message: 'Subject deleted successfully' };
    };

    return await this.executeDestructiveTransaction('subject', runInTx);
  }

  /**
   * Batch delete subjects with referential safety wrapped in a transaction
   */
  static async batchDeleteSubjects(rawIds: unknown): Promise<HierarchyDeleteResult> {
    const validation = validateBatchDeletePayload(rawIds, 'Subject');
    if (!validation.success || !validation.ids) {
      return {
        status: (validation.status ?? 400) as 400 | 413,
        error: validation.error ?? 'Invalid batch request',
      };
    }

    // IDs are deterministically sorted to prevent deadlock under concurrent batch locks
    const ids = [...validation.ids].sort();

    const runInTx = async (tx: DbExecutor): Promise<HierarchyDeleteResult> => {
      // 1. Acquire row locks in deterministic ascending ID order
      await acquireRowLock(
        'subject',
        ids.join(','),
        tx.select({ id: subjects.id }).from(subjects).where(inArray(subjects.id, ids)).orderBy(subjects.id)
      );

      const conflictingIds: string[] = [];
      const aggregatedDependencies: Record<string, number> = {};

      for (const id of ids) {
        const conflict = await checkSubjectDependencies(id, tx);
        if (conflict) {
          conflictingIds.push(id);
          for (const [key, val] of Object.entries(conflict.dependents)) {
            aggregatedDependencies[key] = (aggregatedDependencies[key] ?? 0) + val;
          }
        }
      }

      if (conflictingIds.length > 0) {
        return {
          status: 409,
          error: `Cannot delete subjects because dependent topics exist for ${conflictingIds.length} item(s)`,
          conflictType: 'DEPENDENCY_CONFLICT',
          entityType: 'subject',
          conflictingIds,
          dependencies: aggregatedDependencies,
        };
      }

      await tx.delete(subjects).where(inArray(subjects.id, ids));
      return { status: 200, message: `${ids.length} subjects deleted successfully` };
    };

    return await this.executeDestructiveTransaction('batch subject', runInTx);
  }

  /**
   * Delete a topic with referential safety wrapped in a transaction
   */
  static async deleteTopic(id: string): Promise<HierarchyDeleteResult> {
    if (!isValidUuid(id)) {
      return { status: 400, error: 'Invalid UUID format for Topic ID' };
    }

    const runInTx = async (tx: DbExecutor): Promise<HierarchyDeleteResult> => {
      // 1. Acquire row lock to serialize concurrent transactions and prevent concurrent child creation
      await acquireRowLock('topic', id, tx.select({ id: topics.id }).from(topics).where(eq(topics.id, id)));

      // 2. Verify dependencies within the transaction
      const conflict = await checkTopicDependencies(id, tx);
      if (conflict) {
        return {
          status: 409,
          error: conflict.message,
          conflictType: 'DEPENDENCY_CONFLICT',
          entityType: 'topic',
          entityId: id,
          dependencies: conflict.dependents,
        };
      }

      const [deleted] = await tx.delete(topics).where(eq(topics.id, id)).returning();
      if (!deleted) {
        return { status: 404, error: 'Topic not found' };
      }

      return { status: 200, message: 'Topic deleted successfully' };
    };

    return await this.executeDestructiveTransaction('topic', runInTx);
  }

  /**
   * Batch delete topics with referential safety wrapped in a transaction
   */
  static async batchDeleteTopics(rawIds: unknown): Promise<HierarchyDeleteResult> {
    const validation = validateBatchDeletePayload(rawIds, 'Topic');
    if (!validation.success || !validation.ids) {
      return {
        status: (validation.status ?? 400) as 400 | 413,
        error: validation.error ?? 'Invalid batch request',
      };
    }

    // IDs are deterministically sorted to prevent deadlock under concurrent batch locks
    const ids = [...validation.ids].sort();

    const runInTx = async (tx: DbExecutor): Promise<HierarchyDeleteResult> => {
      // 1. Acquire row locks in deterministic ascending ID order
      await acquireRowLock(
        'topic',
        ids.join(','),
        tx.select({ id: topics.id }).from(topics).where(inArray(topics.id, ids)).orderBy(topics.id)
      );

      const conflictingIds: string[] = [];
      const aggregatedDependencies: Record<string, number> = {};

      for (const id of ids) {
        const conflict = await checkTopicDependencies(id, tx);
        if (conflict) {
          conflictingIds.push(id);
          for (const [key, val] of Object.entries(conflict.dependents)) {
            aggregatedDependencies[key] = (aggregatedDependencies[key] ?? 0) + val;
          }
        }
      }

      if (conflictingIds.length > 0) {
        return {
          status: 409,
          error: `Cannot delete topics because dependent records exist for ${conflictingIds.length} item(s)`,
          conflictType: 'DEPENDENCY_CONFLICT',
          entityType: 'topic',
          conflictingIds,
          dependencies: aggregatedDependencies,
        };
      }

      await tx.delete(topics).where(inArray(topics.id, ids));
      return { status: 200, message: `${ids.length} topics deleted successfully` };
    };

    return await this.executeDestructiveTransaction('batch topic', runInTx);
  }

  /**
   * Delete a subtopic with referential safety wrapped in a transaction
   */
  static async deleteSubtopic(id: string): Promise<HierarchyDeleteResult> {
    if (!isValidUuid(id)) {
      return { status: 400, error: 'Invalid UUID format for Subtopic ID' };
    }

    const runInTx = async (tx: DbExecutor): Promise<HierarchyDeleteResult> => {
      // 1. Acquire row lock to serialize concurrent transactions and prevent concurrent child creation
      await acquireRowLock('subtopic', id, tx.select({ id: subtopics.id }).from(subtopics).where(eq(subtopics.id, id)));

      // 2. Verify dependencies within the transaction
      const conflict = await checkSubtopicDependencies(id, tx);
      if (conflict) {
        return {
          status: 409,
          error: conflict.message,
          conflictType: 'DEPENDENCY_CONFLICT',
          entityType: 'subtopic',
          entityId: id,
          dependencies: conflict.dependents,
        };
      }

      const [deleted] = await tx.delete(subtopics).where(eq(subtopics.id, id)).returning();
      if (!deleted) {
        return { status: 404, error: 'Subtopic not found' };
      }

      return { status: 200, message: 'Subtopic deleted successfully' };
    };

    return await this.executeDestructiveTransaction('subtopic', runInTx);
  }

  /**
   * Batch delete subtopics with referential safety wrapped in a transaction
   */
  static async batchDeleteSubtopics(rawIds: unknown): Promise<HierarchyDeleteResult> {
    const validation = validateBatchDeletePayload(rawIds, 'Subtopic');
    if (!validation.success || !validation.ids) {
      return {
        status: (validation.status ?? 400) as 400 | 413,
        error: validation.error ?? 'Invalid batch request',
      };
    }

    // IDs are deterministically sorted to prevent deadlock under concurrent batch locks
    const ids = [...validation.ids].sort();

    const runInTx = async (tx: DbExecutor): Promise<HierarchyDeleteResult> => {
      // 1. Acquire row locks in deterministic ascending ID order
      await acquireRowLock(
        'subtopic',
        ids.join(','),
        tx.select({ id: subtopics.id }).from(subtopics).where(inArray(subtopics.id, ids)).orderBy(subtopics.id)
      );

      const conflictingIds: string[] = [];
      const aggregatedDependencies: Record<string, number> = {};

      for (const id of ids) {
        const conflict = await checkSubtopicDependencies(id, tx);
        if (conflict) {
          conflictingIds.push(id);
          for (const [key, val] of Object.entries(conflict.dependents)) {
            aggregatedDependencies[key] = (aggregatedDependencies[key] ?? 0) + val;
          }
        }
      }

      if (conflictingIds.length > 0) {
        return {
          status: 409,
          error: `Cannot delete subtopics because dependent records exist for ${conflictingIds.length} item(s)`,
          conflictType: 'DEPENDENCY_CONFLICT',
          entityType: 'subtopic',
          conflictingIds,
          dependencies: aggregatedDependencies,
        };
      }

      await tx.delete(subtopics).where(inArray(subtopics.id, ids));
      return { status: 200, message: `${ids.length} subtopics deleted successfully` };
    };

    return await this.executeDestructiveTransaction('batch subtopic', runInTx);
  }

  /**
   * Delete a skill with referential safety wrapped in a transaction
   */
  static async deleteSkill(id: string): Promise<HierarchyDeleteResult> {
    if (!isValidUuid(id)) {
      return { status: 400, error: 'Invalid UUID format for Skill ID' };
    }

    const runInTx = async (tx: DbExecutor): Promise<HierarchyDeleteResult> => {
      // 1. Acquire row lock to serialize concurrent transactions and prevent concurrent child creation
      await acquireRowLock('skill', id, tx.select({ id: skills.id }).from(skills).where(eq(skills.id, id)));

      // 2. Verify dependencies within the transaction
      const conflict = await checkSkillDependencies(id, tx);
      if (conflict) {
        return {
          status: 409,
          error: conflict.message,
          conflictType: 'DEPENDENCY_CONFLICT',
          entityType: 'skill',
          entityId: id,
          dependencies: conflict.dependents,
        };
      }

      const [deleted] = await tx.delete(skills).where(eq(skills.id, id)).returning();
      if (!deleted) {
        return { status: 404, error: 'Skill not found' };
      }

      return { status: 200, message: 'Skill deleted successfully' };
    };

    return await this.executeDestructiveTransaction('skill', runInTx);
  }

  /**
   * Batch delete skills with referential safety wrapped in a transaction
   */
  static async batchDeleteSkills(rawIds: unknown): Promise<HierarchyDeleteResult> {
    const validation = validateBatchDeletePayload(rawIds, 'Skill');
    if (!validation.success || !validation.ids) {
      return {
        status: (validation.status ?? 400) as 400 | 413,
        error: validation.error ?? 'Invalid batch request',
      };
    }

    // IDs are deterministically sorted to prevent deadlock under concurrent batch locks
    const ids = [...validation.ids].sort();

    const runInTx = async (tx: DbExecutor): Promise<HierarchyDeleteResult> => {
      // 1. Acquire row locks in deterministic ascending ID order
      await acquireRowLock(
        'skill',
        ids.join(','),
        tx.select({ id: skills.id }).from(skills).where(inArray(skills.id, ids)).orderBy(skills.id)
      );

      const conflictingIds: string[] = [];
      const aggregatedDependencies: Record<string, number> = {};

      for (const id of ids) {
        const conflict = await checkSkillDependencies(id, tx);
        if (conflict) {
          conflictingIds.push(id);
          for (const [key, val] of Object.entries(conflict.dependents)) {
            aggregatedDependencies[key] = (aggregatedDependencies[key] ?? 0) + val;
          }
        }
      }

      if (conflictingIds.length > 0) {
        return {
          status: 409,
          error: `Cannot delete skills because dependent topics or questions reference ${conflictingIds.length} item(s)`,
          conflictType: 'DEPENDENCY_CONFLICT',
          entityType: 'skill',
          conflictingIds,
          dependencies: aggregatedDependencies,
        };
      }

      await tx.delete(skills).where(inArray(skills.id, ids));
      return { status: 200, message: `${ids.length} skills deleted successfully` };
    };

    return await this.executeDestructiveTransaction('batch skill', runInTx);
  }
}
