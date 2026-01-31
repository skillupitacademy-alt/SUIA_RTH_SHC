import { db, skills, topicSkills } from '@quiz/db';
import { eq, and, inArray } from 'drizzle-orm';

export class SkillService {
  static async getAllSkills() {
    return await db.query.skills.findMany();
  }

  static async createSkill(data: any) {
    return await db.insert(skills).values(data).returning();
  }

  static async deleteSkill(id: string) {
    return await db.delete(skills).where(eq(skills.id, id)).returning();
  }

  /**
   * Links skills to a topic.
   */
  static async mapTopicToSkills(topicId: string, skillIds: string[]) {
    // 1. Remove existing mappings
    await db.delete(topicSkills).where(eq(topicSkills.topicId, topicId));

    // 2. Add new mappings
    if (skillIds.length === 0) return [];

    const mappings = skillIds.map(skillId => ({
      topicId,
      skillId,
    }));

    return await db.insert(topicSkills).values(mappings).returning();
  }

  static async getSkillsByTopic(topicId: string) {
    const mappings = await db.query.topicSkills.findMany({
      where: eq(topicSkills.topicId, topicId),
      with: {
        skill: true,
      }
    });
    return mappings.map(m => m.skill);
  }
}
