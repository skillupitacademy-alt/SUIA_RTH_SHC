import { describe, expect, it } from 'vitest';

import { HierarchyCalculator } from '../hierarchy.calculator';
import { SkillCalculator } from '../skill.calculator';

describe('Scoring calculators branch coverage', () => {
  it('HierarchyCalculator returns empty for missing topic', () => {
    const calc = new HierarchyCalculator();
    expect(calc.calculate({ question: {} as any, topic: null })).toEqual([]);
  });

  it('HierarchyCalculator handles subtopic found/missing and null skills', () => {
    const calc = new HierarchyCalculator();
    const topic = {
      id: 't1',
      name: 'Topic',
      subject: { id: 's1', name: 'Subject', domain: { id: 'd1', name: 'Domain' } },
      subtopics: [{ id: 'st1', name: 'Subtopic 1' }],
      topicSkills: [{ skill: null }, { skill: { id: 'sk1', name: 'Skill 1', weight: undefined } }],
    } as any;

    const withSubtopic = calc.calculate({
      question: { subtopicId: 'st1', questionSkills: [{ skill: undefined }] } as any,
      topic,
    });
    expect(withSubtopic.some((d) => d.type === 'subtopic')).toBe(true);
    expect(withSubtopic[0].weight).toBe(1);

    const withoutSubtopic = calc.calculate({
      question: { subtopicId: 'missing', questionSkills: [] } as any,
      topic,
    });
    expect(withoutSubtopic.some((d) => d.type === 'subtopic')).toBe(false);
  });

  it('SkillCalculator handles category/mapping guards and null skills', () => {
    const calc = new SkillCalculator();
    const topic = {
      topicSkills: [{ skill: null }, { skill: { id: 's1', name: 'Skill', weight: undefined, category: ' ', mappingType: '' } }],
    } as any;

    const dims = calc.calculate({
      question: { questionSkills: [{ skill: undefined }] } as any,
      topic,
    });

    expect(dims).toEqual([{ type: 'skill', id: 's1', name: 'Skill', weight: 1 }]);
  });

  it('falls back to empty skill arrays when topicSkills/questionSkills are absent', () => {
    const hierarchy = new HierarchyCalculator();
    const skill = new SkillCalculator();

    const topic = {
      id: 't1',
      name: 'T',
      subject: { id: 's1', name: 'S', domain: { id: 'd1', name: 'D' } },
      subtopics: [],
      topicSkills: undefined,
    } as any;

    const hierarchyDims = hierarchy.calculate({ question: { questionSkills: undefined } as any, topic });
    const skillDims = skill.calculate({ question: { questionSkills: undefined } as any, topic });

    expect(hierarchyDims[0].weight).toBe(1);
    expect(skillDims).toEqual([]);
  });
});
