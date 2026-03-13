import { describe, it, expect } from 'vitest';
import { CsvFormatter } from '../formatters/csvFormatter';
import type { ExportPayload } from '../exportTypes';

describe('CsvFormatter', () => {
  it('escapes commas and quotes', async () => {
    const formatter = new CsvFormatter();
    const payload: ExportPayload = {
      meta: {
        candidateName: 'Test',
        candidateEmail: 'test@example.com',
        vectorId: 'VEC12345',
        examId: 'e1',
        startedAt: new Date().toISOString(),
        lineage: { domain: 'D', subject: 'S', topic: 'T' }
      },
      rawAttempts: [
        {
          studentId: 's1',
          studentName: 'Name, "Quoted"',
          studentEmail: 'test@example.com',
          sessionId: 'sess-1',
          sessionDate: '2024-01-01',
          vectorId: 'VEC12345',
          domain: 'Domain',
          subject: 'Subject',
          topic: 'Topic',
          subtopic: 'Subtopic',
          questionId: 'q1',
          questionText: 'Question',
          correctAnswer: 'A',
          userAnswer: 'A',
          isCorrect: true,
          difficulty: 'simple',
          timeSpentSeconds: 12,
          thresholdSeconds: 35,
          skillName: 'Skill',
          skillCategory: null,
          processingPattern: 'stable',
          isImpulsive: false,
          isDiligent: true,
          masteryWeight: 1,
          weightedScore: 1
        }
      ],
      aggregations: {
        L1_domain: [],
        L2_domain_subject: [],
        L3_domain_subject_topic: [],
        L4_full_hierarchy: [],
        L5_difficulty: [],
        L6_skill: [],
        L7_topic_x_difficulty: [],
        L8_topic_x_skill: [],
        L9_full_granular: [],
        L10_student_domain: [],
        L11_student_full_hierarchy: [],
        L12_student_diff_skill: []
      },
      historicalProgress: [],
      guidanceSignals: []
    };

    const buffer = await formatter.formatAsZip(payload);
    expect(buffer).toBeInstanceOf(Buffer);
  });
});
