import { describe, it, expect } from 'vitest';
import { toUserSummaryDTO, toLoginResponseDTO } from '../dtos/auth.dto';
import { toQuestionDTO, toExamResultDTO, toExamStartDTO } from '../dtos/exam.dto';
import { toAdminQuestionDTO, toAdminUserDTO } from '../dtos/admin.dto';
import { getDisplayType, normalizeQuestionOptions, normalizeQuestionType, parseAnswer } from '../modules/question/question-contract';

describe('Layer 66: DTO Pattern Verification', () => {
  describe('Auth DTOs', () => {
    const mockUser = {
      id: 'usr123',
      email: 'test@example.com',
      passwordHash: 'SUPER_SECRET_HASH',
      emailVerified: true,
      createdAt: new Date(),
      isOnboarded: true, // Add the database field that the DTO now uses
      profile: {
        name: 'Test User',
        professionalStatus: 'Employed',
        educationLevel: 'Bachelors',
        onboardingCompleted: true,
      }
    };

    it('toUserSummaryDTO should map basic fields and strip sensitive ones', () => {
      const dto = toUserSummaryDTO(mockUser);
      expect(dto).toHaveProperty('id', 'usr123');
      expect(dto).toHaveProperty('email', 'test@example.com');
      expect(dto).toHaveProperty('name', 'Test User');
      expect(dto).toHaveProperty('onboarded', true);
      expect((dto as any).passwordHash).toBeUndefined();
    });

    it('toLoginResponseDTO should assemble the full response structure', () => {
      const dto = toLoginResponseDTO(mockUser, { expiresIn: 3600 });
      expect(dto.expiresIn).toBe(3600);
      expect(dto.user.email).toBe('test@example.com');
    });

    it('toUserSummaryDTO should map admin role and fallback values', () => {
      const dto = toUserSummaryDTO(
        {
          id: 'a1',
          email: 'admin@example.com',
          profile: { professionalStatus: '', educationLevel: null, onboardingCompleted: false },
          emailVerified: false,
          createdAt: new Date(),
        },
        true
      );

      expect(dto.name).toBe('Unknown');
      expect(dto.onboarded).toBe(false);
      expect(dto.role).toBe('admin');
      expect(dto.isAdmin).toBe(true);
    });
  });

  describe('Exam DTOs', () => {
    const mockQuestion = {
      id: 'q1',
      text: 'What is 2+2?',
      type: 'mcq',
      difficulty: 'simple',
      correctAnswer: '4', // This MUST be stripped!
      options: [
        { id: 'o1', text: '3', label: 'A' },
        { id: 'o2', text: '4', label: 'B' }
      ]
    };

    it('CRITICAL: toQuestionDTO NEVER leaks correct answers', () => {
      const dto = toQuestionDTO(mockQuestion);
      expect(dto).toHaveProperty('id', 'q1');
      expect(dto).toHaveProperty('text', 'What is 2+2?');
      expect((dto as any).correctAnswer).toBeUndefined();
    });

    it('toQuestionDTO handles null input and missing options', () => {
      expect(toQuestionDTO(null as any)).toBeNull();

      const dto = toQuestionDTO({
        id: 'q2',
        text: 'Fallback text',
        type: 'mcq',
        difficulty: 'simple',
      } as any);
      expect(dto.text).toBe('Fallback text');
      expect(dto.options).toEqual([]);
    });

    it('toQuestionDTO maps string options and object option fallbacks', () => {
      const dto = toQuestionDTO({
        id: 'q3',
        questionText: 'String options',
        type: 'mcq',
        options: ['yes', { text: 'no' }],
      } as any);

      expect(dto?.options[0]).toEqual({ id: '1', text: 'yes', label: 'A' });
      expect(dto?.options[1]).toEqual({ id: '2', text: 'no', label: 'B' });
      expect(dto?.difficulty).toBe('intermediate');
    });

    it('toQuestionDTO uses empty fallbacks for missing text values', () => {
      const dto = toQuestionDTO({
        id: 'q4',
        type: 'mcq',
        options: [{}],
      } as any);

      expect(dto?.text).toBe('');
      expect(dto?.options[0]).toEqual({ id: '1', label: 'A' });
    });

    it('toQuestionDTO preserves multi_select and derives mixed display type', () => {
      const dto = toQuestionDTO({
        id: 'q5',
        questionText: 'Choose all valid snippets',
        type: 'multi_select',
        codeSnippet: 'const x = 1;',
        options: [{ id: 'o1', code: 'console.log(x)', label: 'A' }],
      } as any);

      expect(dto?.type).toBe('multi_select');
      expect(dto?.questionType).toBe('multi_select');
      expect(dto?.displayType).toBe('mixed');
      expect(dto?.codeSnippet).toBe('const x = 1;');
      expect(dto?.options[0]).toEqual({ id: 'o1', code: 'console.log(x)', label: 'A' });
    });

    it('toExamResultDTO handles numeric score fallback and non-finite time', () => {
      const dto = toExamResultDTO({
        id: 'fallback-id',
        score: 77,
        timeTaken: Number.NaN as any,
        completedAt: null,
      } as any);

      expect(dto.examId).toBe('fallback-id');
      expect(dto.overallScore).toBe(77);
      expect(dto.timeTaken).toBe(0);
      expect(Array.isArray(dto.dimensions)).toBe(true);
    });

    it('toExamResultDTO handles percentage fallback with mapped dimensions', () => {
      const dto = toExamResultDTO({
        examId: 'e-perc',
        percentage: 42,
        score: {
          dimensions: [
            { type: 'topic', name: 'T', score: 2, total: 4 },
            { type: 'skill', name: 'S', score: 1, total: 2, percentage: 50 },
          ],
        },
      } as any);

      expect(dto.overallScore).toBe(42);
      expect(dto.dimensions[0].percentage).toBe(0);
      expect(dto.dimensions[1].percentage).toBe(50);
      expect(dto.completedAt).toBeInstanceOf(Date);
    });

    it('toExamResultDTO formats scoring appropriately', () => {
      const data = {
        examId: 'e1',
        score: {
          overallScore: 85,
          timeTaken: 120,
          dimensions: [{ type: 'concept', name: 'Math', score: 10, total: 10, accuracy: 100 }],
          completedAt: new Date()
        }
      };
      
      const dto = toExamResultDTO(data);
      expect(dto.examId).toBe('e1');
      expect(dto.overallScore).toBe(85);
      expect(dto.dimensions[0].percentage).toBe(100);
    });

    it('toExamStartDTO maps firstQuestion to null when absent', () => {
      const dto = toExamStartDTO({
        examId: 'e-start',
        status: 'started',
        totalQuestions: 10,
        durationSeconds: 600,
        remainingSeconds: 600,
        firstQuestion: null,
      });

      expect(dto.examId).toBe('e-start');
      expect(dto.firstQuestion).toBeNull();
    });

    it('toExamStartDTO maps firstQuestion when present', () => {
      const dto = toExamStartDTO({
        examId: 'e-start-2',
        status: 'started',
        totalQuestions: 1,
        durationSeconds: 60,
        remainingSeconds: 55,
        firstQuestion: {
          id: 'qx',
          questionText: 'QX',
          type: 'mcq',
          difficulty: 'simple',
          options: [{ id: 'o1', text: 'A', label: 'A' }],
        },
      });
      expect(dto.firstQuestion?.id).toBe('qx');
    });

    it('toExamResultDTO supports percentage fallback and default completedAt', () => {
      const nowBefore = Date.now();
      const dto = toExamResultDTO({
        examId: 'e2',
        score: {
          dimensions: [{ type: 'topic', name: 'T1', score: 1, total: 2, percentage: 50 }],
        },
      });
      expect(dto.dimensions[0].percentage).toBe(50);
      expect(dto.completedAt.getTime()).toBeGreaterThanOrEqual(nowBefore);
    });

    it('toExamResultDTO falls back to an empty examId when both ids are absent', () => {
      const dto = toExamResultDTO({
        score: {
          overallScore: 10,
          timeTaken: 1,
          dimensions: [],
          completedAt: new Date('2025-01-01T00:00:00.000Z'),
        },
      } as any);

      expect(dto.examId).toBe('');
    });
  });

  describe('Question contract helpers', () => {
    it('normalizes question type and answer parsing for multi-select payloads', () => {
      expect(normalizeQuestionType('multi_select')).toBe('multi_select');
      expect(normalizeQuestionType('unknown')).toBe('mcq');
      expect(parseAnswer('A, B ,C')).toEqual(['A', 'B', 'C']);
    });

    it('normalizes option payloads and derives display type', () => {
      expect(normalizeQuestionOptions(['yes', { id: 'o2', code: 'return true;', label: 'B' }])).toEqual([
        { id: '1', text: 'yes', label: 'A' },
        { id: 'o2', code: 'return true;', label: 'B', isCorrect: undefined },
      ]);

      expect(getDisplayType({ questionText: 'Question', codeSnippet: 'const x = 1;' })).toBe('mixed');
      expect(getDisplayType({ questionText: '', codeSnippet: 'const x = 1;' })).toBe('code');
      expect(getDisplayType({ questionText: 'Question', codeSnippet: null })).toBe('text');
    });
  });

  describe('Admin DTOs', () => {
    it('toAdminQuestionDTO formats comprehensive admin question views', () => {
      const q = {
        id: 'q1',
        text: 'Test',
        type: 'mcq',
        difficulty: 'simple',
        topic: { name: 'Programming' },
        questionSkills: [{ skill: { name: 'Logic' } }],
        createdAt: new Date(),
        examQuestions: [1, 2, 3] // Mocked usage count
      };

      const dto = toAdminQuestionDTO(q);
      expect(dto.topic).toBe('Programming');
      expect(dto.skills).toContain('Logic');
      expect(dto.usageCount).toBe(3);
    });

    it('toAdminUserDTO applies safe fallbacks', () => {
      const now = new Date();
      const dto = toAdminUserDTO({
        id: 'u-admin',
        email: 'u@example.com',
        profile: undefined,
        userRoles: undefined,
        emailVerified: false,
        createdAt: now,
        lastActiveAt: null,
        exams: undefined,
      });

      expect(dto.name).toBe('Unknown');
      expect(dto.roles).toEqual([]);
      expect(dto.examCount).toBe(0);
      expect(dto.lastLoginAt).toBeNull();
    });

    it('toAdminUserDTO maps roles when present', () => {
      const dto = toAdminUserDTO({
        id: 'u2',
        email: 'u2@example.com',
        profile: { name: 'User Two' },
        userRoles: [{ role: { name: 'ADMIN' } }, { role: { name: 'EDITOR' } }],
        emailVerified: true,
        createdAt: new Date(),
        lastActiveAt: new Date(),
        exams: [1],
      });
      expect(dto.roles).toEqual(['ADMIN', 'EDITOR']);
    });

    it('toAdminUserDTO and toAdminQuestionDTO use default createdAt values', () => {
      const u = toAdminUserDTO({
        id: 'u-default-created',
        email: 'u-default@example.com',
      } as any);

      const q = toAdminQuestionDTO({
        id: 'q-default-created',
        questionText: 'Q text',
        type: 'mcq',
      } as any);

      expect(u.createdAt.toISOString()).toBe(new Date(0).toISOString());
      expect(q.createdAt.toISOString()).toBe(new Date(0).toISOString());
      expect(q.text).toBe('Q text');
      expect(q.difficulty).toBe('intermediate');
    });

    it('toAdminQuestionDTO applies safe fallbacks for optional fields', () => {
      const dto = toAdminQuestionDTO({
        id: 'q-fallback',
        text: 'Fallback',
        type: 'mcq',
        difficulty: 'simple',
        topic: undefined,
        questionSkills: undefined,
        createdAt: new Date(),
        examQuestions: undefined,
      });

      expect(dto.topic).toBeUndefined();
      expect(dto.skills).toEqual([]);
      expect(dto.usageCount).toBe(0);
    });

    it('toAdminQuestionDTO falls back to empty text when both text fields are missing', () => {
      const dto = toAdminQuestionDTO({
        id: 'q-empty-text',
        type: 'mcq',
      } as any);

      expect(dto.text).toBe('');
    });
  });
});
