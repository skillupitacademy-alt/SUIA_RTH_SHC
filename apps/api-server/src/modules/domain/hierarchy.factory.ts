import { db, domains, subjects, topics, subtopics, questions, questionSkills, skills } from '@quiz/db';
import { eq, sql, and } from 'drizzle-orm';

export interface AtomicHierarchyPayload {
  domainId?: string;
  domainName?: string;
  subjects?: {
    id?: string;
    name: string;
    topics?: {
      id?: string;
      name: string;
      subtopics?: {
        id?: string;
        name: string;
        questions?: (any & { skillNames?: string[]; mappingType?: string; skillWeight?: number })[];
      }[];
      questions?: (any & { skillNames?: string[]; mappingType?: string; skillWeight?: number })[]; // Questions at topic level
    }[];
  }[];
}

export class HierarchyFactory {
  /**
   * Performs an atomic upsert of a nested hierarchy.
   * If an ID is provided, it updates. If only a Name is provided, it tries to find by name 
   * within the parent context before creating.
   */
  static async atomicUpsert(payload: AtomicHierarchyPayload) {
    return await db.transaction(async (tx) => {
      // 1. Resolve Domain
      let domainId = payload.domainId;
      if (!domainId && payload.domainName) {
        const existing = await tx.query.domains.findFirst({
          where: eq(domains.name, payload.domainName),
        });
        if (existing) {
          domainId = existing.id;
        } else {
          const [newDomain] = await tx.insert(domains).values({
            name: payload.domainName,
          }).returning();
          domainId = newDomain.id;
        }
      }

      if (!domainId) throw new Error('Domain ID or Domain Name required for atomic upsert.');

      const results = {
        domainId,
        subjects: [] as any[],
        questionIds: [] as string[],
        questionStats: {
          simple: 0,
          intermediate: 0,
          expert: 0,
          total: 0
        }
      };

      // 2. Resolve Subjects
      if (payload.subjects) {
        for (const s of payload.subjects) {
          let subjectId = s.id;
          if (!subjectId) {
            const existing = await tx.query.subjects.findFirst({
              where: and(eq(subjects.domainId, domainId), eq(subjects.name, s.name)),
            });
            if (existing) {
              subjectId = existing.id;
            } else {
              const [newSub] = await tx.insert(subjects).values({
                domainId: domainId!,
                name: s.name,
              }).returning();
              subjectId = newSub.id;
            }
          }

          const subjectResult = { id: subjectId, name: s.name, topics: [] as any[] };

          // 3. Resolve Topics
          if (s.topics) {
            for (const t of s.topics) {
              let topicId = t.id;
              if (!topicId) {
                const existing = await tx.query.topics.findFirst({
                  where: and(eq(topics.subjectId, subjectId), eq(topics.name, t.name)),
                });
                if (existing) {
                  topicId = existing.id;
                } else {
                  const [newTopic] = await tx.insert(topics).values({
                    subjectId: subjectId!,
                    name: t.name,
                  }).returning();
                  topicId = newTopic.id;
                }
              }

              const topicResult = { id: topicId, name: t.name, subtopics: [] as any[], questions: 0 };

              // 4. Resolve Subtopics
              if (t.subtopics) {
                for (const st of t.subtopics) {
                  let subtopicId = st.id;
                  if (!subtopicId) {
                    const existing = await tx.query.subtopics.findFirst({
                      where: and(eq(subtopics.topicId, topicId), eq(subtopics.name, st.name)),
                    });
                    if (existing) {
                      subtopicId = existing.id;
                    } else {
                      const [newSubtopic] = await tx.insert(subtopics).values({
                        topicId: topicId!,
                        name: st.name,
                      }).returning();
                      subtopicId = newSubtopic.id;
                    }
                  }

                  const subtopicResult = { id: subtopicId, name: st.name, questions: 0 };

                  // 5. Create Questions & Link Skills (Subtopic level)
                  if (st.questions && st.questions.length > 0) {
                    const questionValues = st.questions.map(q => {
                      const { skillNames, mappingType, ...dbData } = q;
                      return {
                        ...dbData,
                        topicId: topicId!,
                        subtopicId: subtopicId!,
                        status: 'active'
                      };
                    });

                    const insertedQuestions = await tx.insert(questions).values(questionValues).returning();
                    
                    for (let i = 0; i < insertedQuestions.length; i++) {
                      const sourceQ = st.questions[i];
                      const insertedQ = insertedQuestions[i];
                      
                      results.questionIds.push(insertedQ.id);

                      // Increment Stats
                      const diff = (insertedQ.difficulty || 'simple').toLowerCase();
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
                            // Defensive: Ensure mappingType is a valid enum subset
                            const validMappingTypes = ['conceptual', 'technical', 'practical'];
                            const mType = sourceQ.mappingType?.toLowerCase() || 'conceptual';
                            const finalMappingType = validMappingTypes.includes(mType) ? mType : 'conceptual';

                            const [newSkill] = await tx.insert(skills).values({
                              name: skillName,
                              category: 'technical', // Default for auto-healing
                              mappingType: finalMappingType
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
                    subtopicResult.questions = st.questions.length;
                  }

                  topicResult.subtopics.push(subtopicResult);
                }
              }

              // 6. Create Questions & Link Skills (Topic level - if any)
              if (t.questions && t.questions.length > 0) {
                const questionValues = t.questions.map(q => {
                  const { skillNames, mappingType, ...dbData } = q;
                  return {
                    ...dbData,
                    topicId: topicId!,
                    status: 'active'
                  };
                });

                const insertedQuestions = await tx.insert(questions).values(questionValues).returning();

                for (let i = 0; i < insertedQuestions.length; i++) {
                  const sourceQ = t.questions[i];
                  const insertedQ = insertedQuestions[i];

                  results.questionIds.push(insertedQ.id);

                  // Increment Stats
                  const diff = (insertedQ.difficulty || 'simple').toLowerCase();
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
                        const mType = sourceQ.mappingType?.toLowerCase() || 'conceptual';
                        const finalMappingType = validMappingTypes.includes(mType) ? mType : 'conceptual';

                        const [newSkill] = await tx.insert(skills).values({
                          name: skillName,
                          category: 'technical',
                          mappingType: finalMappingType
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
                topicResult.questions += t.questions.length;
              }

              subjectResult.topics.push(topicResult);
            }
          }
          results.subjects.push(subjectResult);
        }
      }

      return results;
    });
  }
}
