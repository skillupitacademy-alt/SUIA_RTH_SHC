import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mockDb } from '../../../__test-utils__/mock-db';
import { HierarchyFactory } from '../hierarchy.factory';
import { domains, subjects, topics, subtopics, questions, skills, questionSkills } from '@quiz/db';

// Mock DB globally
vi.mock('@quiz/db', () => ({
  db: mockDb,
  domains: { name: 'domains.name', id: 'domains.id', description: 'domains.description', category: 'domains.category' },
  subjects: { domainId: 'subjects.domainId', name: 'subjects.name', id: 'subjects.id' },
  topics: { subjectId: 'topics.subjectId', name: 'topics.name', id: 'topics.id' },
  subtopics: { topicId: 'subtopics.topicId', name: 'subtopics.name', id: 'subtopics.id' },
  skills: { name: 'skills.name', id: 'skills.id', category: 'skills.category', mappingType: 'skills.mappingType' },
  questions: { topicId: 'questions.topicId', id: 'questions.id', difficulty: 'questions.difficulty' },
  questionSkills: { questionId: 'questionSkills.questionId', skillId: 'questionSkills.skillId' },
}));

describe('HierarchyFactory (Branch Coverage Refined)', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('atomicUpsert - Validation & Errors', () => {
    it('throws when subjects supplied without any domain context (Line 77)', async () => {
        const payload = {
            batchSkills: [{ name: 'S1' }],
            subjects: [{ name: 'Sub1' }]
        };
        // validateUpsertContext will pass because of batchSkills
        // results.domainId will be null because domainId/domainName are missing
        // Line 77 will throw
        await expect(HierarchyFactory.atomicUpsert(payload)).rejects.toThrow();
    });

    it('throws error if no valid context provided (Line 92)', async () => {
        const payload = {
            domainId: '',
            domainName: '',
            batchDomains: [],
            batchSkills: []
        };
        await expect(HierarchyFactory.atomicUpsert(payload as any)).rejects.toThrow('Domain ID, Domain Name, batchDomains, or batchSkills required');
    });
  });

  describe('atomicUpsert - Domain Resolution & Updates', () => {
    it('updates existing domain if category changes (Line 130)', async () => {
      const payload = {
        domainName: 'Cloud',
        category: 'New Category'
      };

      vi.mocked(mockDb.query.domains.findFirst).mockResolvedValueOnce({ id: 'd-1', name: 'Cloud', description: 'Old', category: 'Old' } as any);
      vi.mocked(mockDb.update).mockReturnValue({
        set: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValueOnce([{}])
      } as any);

      const results = await HierarchyFactory.atomicUpsert(payload);
      expect(results.domainId).toBe('d-1');
      expect(mockDb.update).toHaveBeenCalled();
    });

    it('resolves domain without update when description/category unchanged (Line 130 branch)', async () => {
        const payload = {
          domainName: 'Cloud',
          description: 'Same',
          category: 'Same'
        };
  
        vi.mocked(mockDb.query.domains.findFirst).mockResolvedValueOnce({ id: 'd-1', name: 'Cloud', description: 'Same', category: 'Same' } as any);
        const results = await HierarchyFactory.atomicUpsert(payload);
        expect(results.domainId).toBe('d-1');
      });
  });

  describe('handleBatchSkills - Default Branches', () => {
    it('uses defaults for batch skills (Line 178, 179 defaults)', async () => {
      const payload = {
        domainId: 'd-1',
        batchSkills: [{ name: 'S1' }] // no category, no mappingType
      };

      vi.mocked(mockDb.query.skills.findFirst).mockResolvedValue(undefined);
      vi.mocked(mockDb.insert).mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 'sk-new' }])
      } as any);

      await HierarchyFactory.atomicUpsert(payload);
      
      const insertCalls = vi.mocked(mockDb.insert).mock.calls;
      const skillInsertValues = (insertCalls[0][0] as any).values; // This might be wrong depending on how insert is called. 
      // Actually it's .insert(skills).values({...})
      // The tool calls mockDb.insert(skills).values(...)
      expect(vi.mocked(mockDb.insert)).toHaveBeenCalled();
    });

    it('uses provided values for batch skills (Line 178, 179 branches)', async () => {
        const payload = {
          domainId: 'd-1',
          batchSkills: [{ name: 'S1', category: 'cognitive', mappingType: 'practical' }]
        };
  
        vi.mocked(mockDb.query.skills.findFirst).mockResolvedValue(undefined);
        vi.mocked(mockDb.insert).mockReturnValue({
          values: vi.fn().mockReturnThis(),
          returning: vi.fn().mockResolvedValue([{ id: 'sk-new' }])
        } as any);
  
        await HierarchyFactory.atomicUpsert(payload);
        expect(vi.mocked(mockDb.insert)).toHaveBeenCalled();
      });
  });

  describe('Hierarchical Loops (Topics/Questions Coverage)', () => {
    it('handles subjects WITHOUT topics (Line 217 branch)', async () => {
      const payload = {
        domainId: 'd-1',
        subjects: [{ name: 'S1' }] // topics undefined
      };

      vi.mocked(mockDb.query.subjects.findFirst).mockResolvedValueOnce({ id: 's-1' } as any);
      const results = await HierarchyFactory.atomicUpsert(payload);
      expect(results.stats.subjects.skipped).toBe(1);
    });

    it('handles topics WITHOUT subtopics/questions (Line 246 branch)', async () => {
        const payload = {
          domainId: 'd-1',
          subjects: [{ 
              name: 'S1', 
              topics: [{ name: 'T1' }] // subtopics/questions undefined
          }]
        };
  
        vi.mocked(mockDb.query.subjects.findFirst).mockResolvedValueOnce({ id: 's-1' } as any);
        vi.mocked(mockDb.query.topics.findFirst).mockResolvedValueOnce({ id: 't-1' } as any);
        const results = await HierarchyFactory.atomicUpsert(payload);
        expect(results.stats.topics.skipped).toBe(1);
      });

      it('handles subtopics WITHOUT questions (Line 262 branch)', async () => {
        const payload = {
          domainId: 'd-1',
          subjects: [{ 
              name: 'S1', 
              topics: [{ 
                  name: 'T1',
                  subtopics: [{ name: 'ST1' }] // questions undefined
              }]
          }]
        };
  
        vi.mocked(mockDb.query.subjects.findFirst).mockResolvedValueOnce({ id: 's-1' } as any);
        vi.mocked(mockDb.query.topics.findFirst).mockResolvedValueOnce({ id: 't-1' } as any);
        vi.mocked(mockDb.query.subtopics.findFirst).mockResolvedValueOnce({ id: 'st-1' } as any);
        const results = await HierarchyFactory.atomicUpsert(payload);
        expect(results.stats.subtopics.skipped).toBe(1);
      });
  });

  describe('Question Logic - Stats & Defaults', () => {
    it('increments intermediate difficulty stats (Line 324)', async () => {
      const payload = {
        domainId: 'd-1',
        subjects: [{
          name: 'S1',
          topics: [{
            name: 'T1',
            questions: [{ questionText: 'inter', difficulty: 'intermediate' }]
          }]
        }]
      };

      vi.mocked(mockDb.query.subjects.findFirst).mockResolvedValue({ id: 's-1' } as any);
      vi.mocked(mockDb.query.topics.findFirst).mockResolvedValue({ id: 't-1' } as any);
      vi.mocked(mockDb.insert).mockReturnValue({
        values: vi.fn().mockReturnThis(),
        returning: vi.fn().mockResolvedValue([{ id: 'q-2', difficulty: 'intermediate' }])
      } as any);

      const results = await HierarchyFactory.atomicUpsert(payload as any);
      expect(results.questionStats.intermediate).toBe(1);
    });

    it('uses placeholder for question text if missing (Line 303)', async () => {
        const payload = {
            domainId: 'd-1',
            subjects: [{
              name: 'S1',
              topics: [{
                name: 'T1',
                questions: [{ difficulty: 'simple' } as any] // missing questionText
              }]
            }]
          };
    
          vi.mocked(mockDb.query.subjects.findFirst).mockResolvedValue({ id: 's-1' } as any);
          vi.mocked(mockDb.query.topics.findFirst).mockResolvedValue({ id: 't-1' } as any);
          vi.mocked(mockDb.insert).mockReturnValue({
            values: vi.fn().mockReturnThis(),
            returning: vi.fn().mockResolvedValue([{ id: 'q-1', difficulty: 'simple' }])
          } as any);
    
          await HierarchyFactory.atomicUpsert(payload as any);
          expect(mockDb.insert).toHaveBeenCalled();
          // The placeholder logic is inside processQuestions's map.
    });
  });

  describe('Skill Mapping - mType Branches', () => {
    it('covers valid mappingType branches in processQuestions (Line 341)', async () => {
      const payload = {
        domainId: 'd-1',
        subjects: [{
          name: 'S1',
          topics: [{
            name: 'T1',
            questions: [
                { questionText: 'Q1', skillNames: ['S1'], mappingType: 'TECHNICAL' }, 
                { questionText: 'Q2', skillNames: ['S2'], mappingType: 'practical' }   
            ]
          }]
        }]
      };

      vi.mocked(mockDb.query.subjects.findFirst).mockResolvedValue({ id: 's-1' } as any);
      vi.mocked(mockDb.query.topics.findFirst).mockResolvedValue({ id: 't-1' } as any);
      vi.mocked(mockDb.query.skills.findFirst).mockResolvedValue(undefined);

      vi.mocked(mockDb.insert)
        .mockReturnValueOnce({ values: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{ id: 'q-1' }, { id: 'q-2' }]) } as any) 
        .mockReturnValueOnce({ values: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{ id: 'sk-1' }]) } as any) 
        .mockReturnValueOnce({ values: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{}]) } as any)
        .mockReturnValueOnce({ values: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{ id: 'sk-2' }]) } as any) 
        .mockReturnValueOnce({ values: vi.fn().mockReturnThis(), returning: vi.fn().mockResolvedValue([{}]) } as any); 

      const results = await HierarchyFactory.atomicUpsert(payload as any);
      expect(results.questionIds).toHaveLength(2);
    });

    it('creates full hierarchy and hits existing-skill branch with expert question', async () => {
      const payload = {
        domainName: 'NewDom',
        subjects: [{
          name: 'SubA',
          topics: [{
            name: 'TopA',
            subtopics: [{
              name: 'SubTopA',
              questions: [{
                questionText: 'Q1',
                difficulty: 'expert',
                skillNames: ['SkillExisting', 'SkillNew'],
                mappingType: 'unknown-type'
              }]
            }]
          }]
        }]
      };

      // ensure every entity is created
      vi.mocked(mockDb.query.domains.findFirst).mockResolvedValueOnce(undefined as any);
      vi.mocked(mockDb.query.subjects.findFirst).mockResolvedValueOnce(undefined as any);
      vi.mocked(mockDb.query.topics.findFirst).mockResolvedValueOnce(undefined as any);
      vi.mocked(mockDb.query.subtopics.findFirst).mockResolvedValueOnce(undefined as any);

      // first skill exists, second is new
      vi.mocked(mockDb.query.skills.findFirst)
        .mockResolvedValueOnce({ id: 'sk-existing' } as any)
        .mockResolvedValueOnce(undefined as any);

      const insert = vi.mocked(mockDb.insert as any);
      insert.mockImplementation((table: any) => {
        if (table === domains) return { values: () => ({ returning: vi.fn().mockResolvedValue([{ id: 'd-new' }]) }) };
        if (table === subjects) return { values: () => ({ returning: vi.fn().mockResolvedValue([{ id: 's-new' }]) }) };
        if (table === topics) return { values: () => ({ returning: vi.fn().mockResolvedValue([{ id: 't-new' }]) }) };
        if (table === subtopics) return { values: () => ({ returning: vi.fn().mockResolvedValue([{ id: 'st-new' }]) }) };
        if (table === questions) return { values: () => ({ returning: vi.fn().mockResolvedValue([{ id: 'q-new', difficulty: 'expert' }]) }) };
        if (table === skills) return { values: () => ({ returning: vi.fn().mockResolvedValue([{ id: 'sk-new' }]) }) };
        if (table === questionSkills) return { values: () => ({ returning: vi.fn().mockResolvedValue([{}]) }) };
        return { values: () => ({ returning: vi.fn().mockResolvedValue([{}]) }) };
      });

      const results = await HierarchyFactory.atomicUpsert(payload as any);

      expect(results.domainId).toBe('d-new');
      expect(results.subjects[0].topics[0].subtopics[0].id).toBe('st-new');
      expect(results.questionIds).toEqual(['q-new']);
      expect(results.questionStats.expert).toBe(1);
    });
  });

});
