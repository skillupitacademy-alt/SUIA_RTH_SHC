import type {
  IDimensionCalculator,
  QuestionDimension,
  ScoringDimension,
  SkillDimension,
  TopicDimension,
  TopicSkill,
} from './calculator.interface';

export class HierarchyCalculator implements IDimensionCalculator {
  calculate(context: { question: QuestionDimension; topic: TopicDimension | null }): ScoringDimension[] {
    const { question: q, topic: t } = context;
    if (!t) return [];

    // Derive average weight from skills (matching legacy logic)
    const skillsFromTopic = t.topicSkills?.map((ts: TopicSkill) => ts.skill) ?? [];
    const skillsFromQuestion = q.questionSkills?.map(qs => qs.skill) ?? [];
    
    const skillMap = new Map<string, SkillDimension>();
    [...skillsFromTopic, ...skillsFromQuestion].forEach(s => {
        if (s !== undefined && s !== null) skillMap.set(s.id, s);
    });
    
    const questionSkillsList = Array.from(skillMap.values());
    const avgWeight = questionSkillsList.length > 0 
      ? Math.round(
          questionSkillsList.reduce(
            (sum, s) => sum + (typeof s.weight === 'number' ? s.weight : 1),
            0
          ) / questionSkillsList.length
        )
      : 1;

    const dimensions: ScoringDimension[] = [
      { type: 'domain', id: t.subject.domain.id, name: t.subject.domain.name, weight: avgWeight },
      { type: 'subject', id: t.subject.id, name: t.subject.name, weight: avgWeight },
      { type: 'topic', id: t.id, name: t.name, weight: avgWeight },
    ];

    if (q.subtopicId !== undefined && q.subtopicId !== null) {
      const st = t.subtopics.find(s => s.id === q.subtopicId);
      if (st) {
        dimensions.push({ type: 'subtopic', id: st.id, name: st.name, weight: avgWeight });
      }
    }

    return dimensions;
  }
}
