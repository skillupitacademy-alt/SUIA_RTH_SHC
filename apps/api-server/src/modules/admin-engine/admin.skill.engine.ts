import { db, skills, topicSkills } from '@quiz/db';
import { asc, eq, inArray, sql } from 'drizzle-orm';

import { AuditService } from "@/modules/auth/audit.service";
import { container } from "@/modules/core/container";

export class AdminSkillEngine {
  static async getSkills(page: number = 1, limit: number = 20, filters?: { search?: string }) {
    const offset = (page - 1) * limit;
    let whereClause = undefined;
    if (filters?.search !== undefined && filters?.search !== null && filters?.search.trim() !== '') {
        whereClause = sql`${skills.name} ILIKE ${'%' + filters.search + '%'}`;
    }

    const data = await db.query.skills.findMany({
      where: whereClause,
      limit,
      offset,
      orderBy: [asc(skills.name)]
    });

    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(skills)
      .where(whereClause ?? sql`true`);

    const total = Number(count ?? 0);
    const totalPages = Math.max(1, Math.ceil(total / limit));

    return { data, total, page, limit, totalPages };
  }

  static async createSkill(data: typeof skills.$inferInsert, adminId: string) {
    const [newSkill] = await db.insert(skills).values(data).returning();
    await container.get(AuditService).log({ userId: adminId, action: 'admin_create_skill', metadata: { skillId: newSkill.id } });
    return newSkill;
  }

  static async updateSkill(id: string, data: Partial<typeof skills.$inferInsert>, adminId: string) {
    const [updated] = await db.update(skills).set(data).where(eq(skills.id, id)).returning();
    await container.get(AuditService).log({ userId: adminId, action: 'admin_update_skill', metadata: { skillId: id } });
    return updated;
  }

  static async deleteSkill(id: string, adminId: string) {
      await container.get(AuditService).log({ userId: adminId, action: 'admin_delete_skill', metadata: { skillId: id } });
    return await db.delete(skills).where(eq(skills.id, id)).returning();
  }

  static async deleteSkillsBatch(ids: string[], adminId: string) {
      await container.get(AuditService).log({ userId: adminId, action: 'admin_batch_delete_skills', metadata: { count: ids.length } });
    return await db.delete(skills).where(inArray(skills.id, ids)).returning();
  }

  static async getTopicSkills(page: number = 1, limit: number = 20) {
    const offset = (page - 1) * limit;
    return await db.query.topicSkills.findMany({
      limit,
      offset,
      with: {
        topic: true,
        skill: true
      }
    });
  }

  static async getSkillsByTopic(topicId: string) {
    const res = await db.query.topicSkills.findMany({
      where: eq(topicSkills.topicId, topicId),
      with: {
        skill: true
      }
    });
    return res.map(rs => rs.skill);
  }

  static async mapTopicToSkills(topicId: string, skillIds: string[], adminId: string) {
    // Transactional sync
      await container.get(AuditService).log({ userId: adminId, action: 'admin_map_topic_skills', metadata: { topicId, skillCount: skillIds.length } });
    return await db.transaction(async (tx) => {
        await tx.delete(topicSkills).where(eq(topicSkills.topicId, topicId));
        if (skillIds.length > 0) {
            await tx.insert(topicSkills).values(skillIds.map(sid => ({
                topicId,
                skillId: sid
            })));
        }
    });
  }
}
