import { db, domains, subjects, topics, subtopics, questions, questionSkills, skills } from '@quiz/db';
import { eq, sql, and } from 'drizzle-orm';

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
        questions?: (any & { skillNames?: string[]; mappingType?: string; skillWeight?: number })[];
      }[];
      questions?: (any & { skillNames?: string[]; mappingType?: string; skillWeight?: number })[];
    }[];
  }[];
  // --- BATCH HORIZONTAL OPERATIONS ---
  batchDomains?: { name: string; description?: string; category?: string }[];
  batchSkills?: { name: string; category?: string; mappingType?: string }[];
}

export class HierarchyFactory {
  /**
   * Performs an atomic upsert of a nested hierarchy.
   * If an ID is provided, it updates. If only a Name is provided, it tries to find by name 
   * within the parent context before creating.
   */
  static async atomicUpsert(payload: AtomicHierarchyPayload) {
    return await db.transaction(async (tx) => {
      const results = {
        domainId: null as string | null,
        subjects: [] as any[],
        questionIds: [] as string[],
        questionStats: {
          simple: 0,
          intermediate: 0,
          expert: 0,
          total: 0
        },
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

      // 1. Resolve Domain
      let domainId = payload.domainId;
      if (!domainId && payload.domainName) {
        const existing = await tx.query.domains.findFirst({
          where: eq(domains.name, payload.domainName),
        });
        if (existing) {
          domainId = existing.id;
          results.stats.domains.skipped++;
          // Support updating description/category if provided
          if (payload.description || payload.category) {
            await tx.update(domains).set({
                description: payload.description || existing.description,
                category: payload.category || existing.category
            }).where(eq(domains.id, domainId));
          }
        } else {
          const [newDomain] = await tx.insert(domains).values({
            name: payload.domainName,
            description: payload.description,
            category: payload.category
          }).returning();
          domainId = newDomain.id;
          results.stats.domains.added++;
        }
      }
      results.domainId = domainId || null;

      if (!domainId && !payload.batchDomains && !payload.batchSkills) {
        throw new Error('Domain ID, Domain Name, batchDomains, or batchSkills required for atomic upsert.');
      }

      // 1.5 Handle Batch Domains
      if (payload.batchDomains) {
        for (const bd of payload.batchDomains) {
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

      // 1.6 Handle Batch Skills
      if (payload.batchSkills) {
        for (const bs of payload.batchSkills) {
            const existing = await tx.query.skills.findFirst({
                where: eq(skills.name, bs.name)
            });
            if (existing) {
                results.batchSkills.push(existing.id);
                results.stats.skills.skipped++;
            } else {
                const [newSkill] = await tx.insert(skills).values({
                    name: bs.name,
                    category: bs.category as any || 'technical',
                    mappingType: bs.mappingType as any || 'conceptual'
                }).returning();
                results.batchSkills.push(newSkill.id);
                results.stats.skills.added++;
            }
        }
      }

      // 2. Resolve Subjects
      if (payload.subjects) {
        if (!domainId) throw new Error('Domain context required for hierarchical operations.');
        for (const s of payload.subjects) {
          let subjectId = s.id;
          if (!subjectId) {
            const existing = await tx.query.subjects.findFirst({
              where: and(eq(subjects.domainId, domainId), eq(subjects.name, s.name)),
            });
            if (existing) {
              subjectId = existing.id;
              results.stats.subjects.skipped++;
            } else {
              const [newSub] = await tx.insert(subjects).values({
                domainId: domainId!,
                name: s.name,
              }).returning();
              subjectId = newSub.id;
              results.stats.subjects.added++;
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
                  results.stats.topics.skipped++;
                } else {
                  const [newTopic] = await tx.insert(topics).values({
                    subjectId: subjectId!,
                    name: t.name,
                  }).returning();
                  topicId = newTopic.id;
                  results.stats.topics.added++;
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
                      results.stats.subtopics.skipped++;
                    } else {
                      const [newSubtopic] = await tx.insert(subtopics).values({
                        topicId: topicId!,
                        name: st.name,
                      }).returning();
                      subtopicId = newSubtopic.id;
                      results.stats.subtopics.added++;
                    }
                  }

                  const subtopicResult = { id: subtopicId, name: st.name, questions: 0 };
                  // ... rest of question logic remains the same ...

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
