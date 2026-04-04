import { TokenService } from '@quiz/auth';
import { TutorialContentRepository } from '@quiz/db-tutorial';
import type {
  TutorialContentJSON,
  TutorialContentRecord,
  TutorialContentUpsertInput,
  TutorialDifficulty,
} from '@quiz/types';
import { TutorialContentSchema } from '@quiz/types';
import type { NextRequest } from 'next/server';
import pino from 'pino';
import { z } from 'zod';

const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

export const logger = pino({
  level: logLevel,
  serializers: pino.stdSerializers,
  formatters: {
    level: (label) => ({ level: label }),
  },
});

export const tutorialContentRepository = new TutorialContentRepository();
const tokenService = new TokenService();
const ADMIN_ROLE_NAMES = new Set(['admin', 'super_admin', 'infrastructure']);

const optionalNullableString = z.union([z.string(), z.null()]).optional();

export const tutorialContentWriteSchema = z.object({
  subtopicId: z.string().uuid(),
  difficulty: z.enum(['simple', 'mixed', 'intermediate', 'expert']),
  content: TutorialContentSchema,
  language: z.string().min(1).optional(),
  isPublished: z.boolean().optional(),
  generatedByAi: z.boolean().optional(),
  aiModelUsed: optionalNullableString,
  generationJobId: optionalNullableString,
  adminApprovedBy: optionalNullableString,
  adminApprovedAt: z.union([z.string(), z.date(), z.null()]).optional(),
  qualityScore: z.record(z.unknown()).nullable().optional(),
});

export type TutorialContentApiDTO = {
  id: string;
  subtopicId: string;
  difficulty: TutorialDifficulty;
  contentType: string;
  content: TutorialContentJSON;
  version: number;
  language: string;
  isPublished: boolean;
  generatedByAi: boolean;
  aiModelUsed: string | null;
  generationJobId: string | null;
  adminApprovedBy: string | null;
  adminApprovedAt: string | null;
  qualityScore: Record<string, unknown> | null;
  regenerationCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type TutorialContentWritePayload = z.infer<typeof tutorialContentWriteSchema>;

export class TutorialAuthError extends Error {
  constructor(message: string, public readonly statusCode: 401 | 403) {
    super(message);
    this.name = 'TutorialAuthError';
  }
}

export function isTutorialAuthError(error: unknown): error is TutorialAuthError {
  return error instanceof TutorialAuthError;
}

export function normalizeTutorialWritePayload(
  payload: TutorialContentWritePayload
): TutorialContentUpsertInput {
  return {
    subtopicId: payload.subtopicId,
    difficulty: payload.difficulty,
    content: payload.content,
    language: payload.language,
    isPublished: payload.isPublished,
    generatedByAi: payload.generatedByAi,
    aiModelUsed: payload.aiModelUsed ?? null,
    generationJobId: payload.generationJobId ?? null,
    adminApprovedBy: payload.adminApprovedBy ?? null,
    adminApprovedAt:
      payload.adminApprovedAt == null
        ? null
        : payload.adminApprovedAt instanceof Date
          ? payload.adminApprovedAt
          : new Date(payload.adminApprovedAt),
    qualityScore: payload.qualityScore ?? null,
  };
}

export function toTutorialContentDTO(record: TutorialContentRecord): TutorialContentApiDTO {
  return {
    id: record.id,
    subtopicId: record.subtopicId,
    difficulty: record.difficulty,
    contentType: record.contentType,
    content: record.content,
    version: record.version,
    language: record.language,
    isPublished: record.isPublished,
    generatedByAi: record.generatedByAi,
    aiModelUsed: record.aiModelUsed,
    generationJobId: record.generationJobId,
    adminApprovedBy: record.adminApprovedBy,
    adminApprovedAt: record.adminApprovedAt ? record.adminApprovedAt.toISOString() : null,
    qualityScore: record.qualityScore,
    regenerationCount: record.regenerationCount,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    deletedAt: record.deletedAt ? record.deletedAt.toISOString() : null,
  };
}

export async function requireAdmin(req: NextRequest) {
  const token = tokenService.getAccessToken(req, { scope: 'admin' });
  if (token == null || token.trim() === '') {
    throw new TutorialAuthError('Unauthorized', 401);
  }

  let payload: Awaited<ReturnType<typeof tokenService.verifyAdminAccessToken>>;
  try {
    payload = await tokenService.verifyAdminAccessToken(token);
  } catch {
    throw new TutorialAuthError('Unauthorized', 401);
  }

  const roles = Array.isArray(payload.roles) ? payload.roles : [];
  const hasAdminRole = roles.some((role) => ADMIN_ROLE_NAMES.has(role));
  if (payload.isAdmin !== true || hasAdminRole === false) {
    throw new TutorialAuthError('Forbidden', 403);
  }

  return payload;
}

export function logRouteError(message: string, error: unknown, extra: Record<string, unknown> = {}) {
  logger.error(
    {
      err: error instanceof Error ? { message: error.message, name: error.name, stack: error.stack } : error,
      ...extra,
    },
    message
  );
}
