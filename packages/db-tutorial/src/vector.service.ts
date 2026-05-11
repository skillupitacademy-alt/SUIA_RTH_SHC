import pino from 'pino';
import { Index, type QueryResult } from '@upstash/vector';

import { STANDARD_QUERY_TIMEOUT, withTimeout } from '@quiz/db';
import type { TutorialContentJSON, TutorialDifficulty } from '@quiz/types';

export type AiTutorBlockType = 
  | 'notes' 
  | 'layman' 
  | 'real_life' 
  | 'technical' 
  | 'code'
  | 'quiz'
  | 'practice'
  | 'assignment'
  | 'project'
  | 'visual';

export type AiTutorVectorMetadata = Record<string, unknown> & {
  subtopicId: string;
  difficulty: TutorialDifficulty;
  blockType: AiTutorBlockType;
};

export interface AiTutorVectorChunk {
  id: string;
  data: string;
  metadata: AiTutorVectorMetadata;
}

export type AiTutorVectorResult = QueryResult<AiTutorVectorMetadata>;

const level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

export const logger = pino({
  level,
  serializers: pino.stdSerializers,
  formatters: {
    level: (label) => ({ level: label }),
  },
});

export function createAiTutorVectorIndex() {
  const url = process.env.UPSTASH_VECTOR_REST_URL;
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN;

  if (url === undefined || url.trim().length === 0 || token === undefined || token.trim().length === 0) {
    throw new Error('UPSTASH_VECTOR_REST_URL and UPSTASH_VECTOR_REST_TOKEN are required');
  }

  return new Index<AiTutorVectorMetadata>({
    url,
    token,
  });
}

function extractNotesText(notes: any): string {
  if (notes.coreDefinition) {
    return `${notes.coreDefinition.badge || ''}: ${notes.coreDefinition.headline || ''}\n${notes.coreDefinition.definition || ''}\n${notes.coreDefinition.simpleExplanation || ''}\n${notes.coreDefinition.whyItMatters || ''}\n${notes.conceptExplanation?.mainConcept || ''}`;
  }
  return (notes as any).markdown || '';
}

function extractLaymanText(layman: any): string {
  if (layman.everydayAnalogy || layman.simpleOverview) {
    return `${layman.simpleOverview || ''}\n${layman.everydayAnalogy || ''}\n${layman.whyItExists || ''}\n${layman.beginnerBreakdown || ''}`;
  }
  return `${(layman as any).simpleExplanation || ''}\n\n${(layman as any).analogyOrStory || ''}`;
}

function extractRealLifeText(reallife: any): string {
  if (reallife.conceptMapping || reallife.industryScenario) {
    return `${reallife.industryScenario?.headline || ''}\n${reallife.industryScenario?.context || ''}\n${reallife.conceptMapping?.analogy || ''}\n${reallife.proExecutionTips?.strategy || ''}`;
  }
  return `${(reallife as any).title || ''}\n\n${(reallife as any).scenario || ''}\n\n${((reallife as any).bullets || []).map((item: any) => `${item.label}: ${item.detail}`).join('\n')}\n\n${(reallife as any).tip || ''}`;
}

function extractTechnicalText(technical: any): string {
  if (technical.coreTechnicalDefinition || technical.expertIntroPanel) {
    return `${technical.coreTechnicalDefinition?.headline || technical.expertIntroPanel?.headline || ''}\n${technical.coreTechnicalDefinition?.technicalDefinition || technical.expertIntroPanel?.advanced_definition || ''}\n${technical.mechanismBreakdown?.logicFlow || ''}\n${technical.performanceTradeoffs?.analysis || ''}`;
  }
  return `${(technical as any).markdown || ''}\n\n${((technical as any).bullets || []).map((item: any) => `${item.term}: ${item.detail}`).join('\n')}\n\n${(technical as any).tip || ''}`;
}

function extractCodeText(code: any): string {
  if (code.problemContext || code.basicCodeExample) {
    return `${code.problemContext?.title || ''}\n${code.problemContext?.scenario || ''}\n${code.basicCodeExample?.code || ''}\n${(code.codeSummary?.keyTakeaways || []).join('\n')}`;
  }
  return `${(code as any).intro || ''}\n\n${(code as any).code || ''}\n\n${((code as any).steps || []).join('\n')}`;
}

function extractVisualText(visual: any): string {
  if (!visual) return '';
  return `${visual.visualOverview?.title || visual.visual_intro_card?.headline || ''}\n${visual.visualOverview?.description || visual.visual_intro_card?.visual_definition || ''}\n${visual.conceptDiagram?.title || visual.diagram_panel?.diagram_title || ''}`;
}

function extractQuizText(quiz: any): string {
  if (!quiz) return '';
  const questionsText = (quiz.questions || []).map((q: any) => `${q.question || ''}\n${q.explanation || ''}`).join('\n\n');
  return `${quiz.quizOverview?.title || quiz.title || ''}\n${quiz.quizOverview?.description || quiz.description || ''}\n\n${questionsText}`;
}

function extractAssignmentText(assignment: any): string {
  if (!assignment) return '';
  return `${assignment.assignmentOverview?.title || assignment.title || ''}\n${assignment.assignmentOverview?.description || assignment.description || ''}\n${(assignment.taskRequirements?.requirements || []).map((r: any) => r.requirement || '').join('\n')}`;
}

function extractProjectText(project: any): string {
  if (!project) return '';
  return `${project.projectOverview?.title || project.title || ''}\n${project.projectOverview?.description || project.description || ''}\n${project.projectGoals?.mainGoal || ''}`;
}

export function buildAiTutorVectorChunks(
  content: TutorialContentJSON,
  subtopicId: string,
  difficulty: TutorialDifficulty
): AiTutorVectorChunk[] {
  const chunks: Array<[AiTutorBlockType, string]> = [];

  if (content.notes) chunks.push(['notes', extractNotesText(content.notes)]);
  if (content.layman) chunks.push(['layman', extractLaymanText(content.layman)]);
  if (content.real_life) chunks.push(['real_life', extractRealLifeText(content.real_life)]);
  if (content.technical) chunks.push(['technical', extractTechnicalText(content.technical)]);
  if (content.code) chunks.push(['code', extractCodeText(content.code)]);
  if (content.visual) chunks.push(['visual', extractVisualText(content.visual)]);
  if (content.quiz) chunks.push(['quiz', extractQuizText(content.quiz)]);
  if (content.practice) chunks.push(['practice', extractQuizText(content.practice)]);
  if (content.assignment) chunks.push(['assignment', extractAssignmentText(content.assignment)]);
  if (content.project) chunks.push(['project', extractProjectText(content.project)]);

  return chunks.map(([blockType, data]) => ({
    id: `${subtopicId}:${difficulty}:${blockType}`,
    data,
    metadata: {
      subtopicId,
      difficulty,
      blockType,
    },
  }));
}

const buildFilter = (subtopicId: string, difficulty?: TutorialDifficulty) => {
  const filterParts = [`subtopicId = '${subtopicId}'`];
  if (difficulty !== undefined) {
    filterParts.push(`difficulty = '${difficulty}'`);
  }
  return filterParts.join(' and ');
};

export async function queryAiTutorVector(
  question: string,
  options: {
    subtopicId: string;
    difficulty?: TutorialDifficulty;
    topK?: number;
  }
): Promise<AiTutorVectorResult[]> {
  const index = createAiTutorVectorIndex();
  return withTimeout(
    index.query<AiTutorVectorMetadata>({
      data: question,
      topK: options.topK ?? 3,
      includeData: true,
      includeMetadata: true,
      filter: buildFilter(options.subtopicId, options.difficulty),
    }),
    STANDARD_QUERY_TIMEOUT,
    'ai-tutor.vector.query'
  );
}

export async function querySubtopicContent(
  subtopicId: string,
  query: string,
  topK = 3,
  difficulty?: TutorialDifficulty
): Promise<Array<{ blockType: AiTutorBlockType; content: string; score: number }>> {
  const results = await queryAiTutorVector(query, { subtopicId, difficulty, topK });
  return results.slice(0, topK).map((result) => ({
    blockType: (result.metadata?.blockType ?? 'notes') as AiTutorBlockType,
    content: result.data ?? '',
    score: result.score,
  }));
}

export async function indexSubtopicContent(
  subtopicId: string,
  difficulty: TutorialDifficulty,
  content: TutorialContentJSON
) {
  const index = createAiTutorVectorIndex();
  const chunks = buildAiTutorVectorChunks(content, subtopicId, difficulty);

  await withTimeout(
    index.upsert(
      chunks.map((chunk) => ({
        id: chunk.id,
        data: chunk.data,
        metadata: chunk.metadata,
      }))
    ),
    STANDARD_QUERY_TIMEOUT,
    'ai-tutor.vector.upsert'
  );

  logger.info({
    event: 'content.indexed',
    subtopicId,
    difficulty,
    chunkCount: chunks.length,
  });

  return chunks;
}

export async function deleteSubtopicContent(subtopicId: string, difficulty: TutorialDifficulty) {
  const index = createAiTutorVectorIndex();
  await withTimeout(
    index.delete({
      filter: buildFilter(subtopicId, difficulty),
    }),
    STANDARD_QUERY_TIMEOUT,
    'ai-tutor.vector.delete'
  );

  logger.info({
    event: 'content.deleted',
    subtopicId,
    difficulty,
  });
}
