import type {
  IDimensionCalculator,
  QuestionDimension,
  ScoringDimension,
  SkillDimension,
  TopicDimension,
  TopicSkill,
} from './calculator.interface';

export class SkillCalculator implements IDimensionCalculator {
  calculate(context: { question: QuestionDimension; topic: TopicDimension | null }): ScoringDimension[] {
    const { question: q, topic: t } = context;
    
    const skillsFromTopic = t?.topicSkills?.map((ts: TopicSkill) => ts.skill) ?? [];
    const skillsFromQuestion = q.questionSkills?.map(qs => qs.skill) ?? [];
    
    const skillMap = new Map<string, SkillDimension>();
    [...skillsFromTopic, ...skillsFromQuestion].forEach(s => {
        if (s !== undefined && s !== null) skillMap.set(s.id, s);
    });

    const dimensions: ScoringDimension[] = [];
    skillMap.forEach(skill => {
      const weight = typeof skill.weight === 'number' ? skill.weight : 1;
      
      dimensions.push({ type: 'skill', id: skill.id, name: skill.name, weight });

      if (typeof skill.category === 'string' && skill.category.trim() !== '') {
        dimensions.push({ type: 'category', id: skill.category, name: skill.category.toUpperCase(), weight });
      }

      if (typeof skill.mappingType === 'string' && skill.mappingType.trim() !== '') {
        dimensions.push({ type: 'mapping_type', id: skill.mappingType, name: skill.mappingType.toUpperCase(), weight });
      }
    });

    return dimensions;
  }
}
