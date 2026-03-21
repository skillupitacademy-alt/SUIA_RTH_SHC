import { z } from 'zod';

export const PlatformEventTypes = {
  STUDENT_ENROLLED: 'student.enrolled',
  STUDENT_CREATED: 'student.created',
  EXAM_COMPLETED: 'exam.completed',
  PAYMENT_RECEIVED: 'payment.received',
  PAYMENT_OVERDUE: 'payment.overdue',
  TUTORIAL_SUBTOPIC_COMPLETED: 'tutorial.subtopic_completed',
  BATCH_SESSION_COMPLETED: 'batch.session_completed',
  BATCH_SUBTOPICS_COVERED: 'batch.subtopics_covered',
  ATTENDANCE_MARKED: 'attendance.marked',
  ADMISSION_COMPLETED: 'admission.completed',
  PROJECT_SUBMITTED: 'project.submitted',
  CERTIFICATE_ISSUED: 'certificate.issued',
  PLACEMENT_OFFER_ACCEPTED: 'placement.offer_accepted',
  CONTENT_GENERATION_REQUESTED: 'content.generation_requested',
  CONTENT_APPROVED_AND_PUBLISHED: 'content.approved_and_published',
} as const;

export type PlatformEventType = typeof PlatformEventTypes[keyof typeof PlatformEventTypes];

export interface EventEnvelope<TType extends PlatformEventType = PlatformEventType, TPayload = unknown> {
  id: string;
  type: TType;
  correlationId: string;
  source: string;
  occurredAt: string;
  version: number;
  data: TPayload;
}

const isoString = z.string().datetime({ offset: true });

const baseFields = {
  id: z.string().uuid(),
  correlationId: z.string().uuid(),
  source: z.string().min(1),
  occurredAt: isoString,
  version: z.number().int().positive(),
};

const idPayload = (extra: Record<string, z.ZodTypeAny>) => z.object(extra);

export const PlatformEventPayloadSchemas = {
  [PlatformEventTypes.STUDENT_ENROLLED]: idPayload({ userId: z.string().uuid(), batchId: z.string().uuid(), enrolledAt: isoString }),
  [PlatformEventTypes.STUDENT_CREATED]: idPayload({ userId: z.string().uuid(), createdBy: z.string().uuid(), createdAt: isoString }),
  [PlatformEventTypes.EXAM_COMPLETED]: idPayload({ userId: z.string().uuid(), examId: z.string().uuid(), score: z.number(), completedAt: isoString }),
  [PlatformEventTypes.PAYMENT_RECEIVED]: idPayload({ userId: z.string().uuid(), paymentId: z.string().uuid(), amount: z.number().nonnegative(), receivedAt: isoString }),
  [PlatformEventTypes.PAYMENT_OVERDUE]: idPayload({ userId: z.string().uuid(), installmentId: z.string().uuid(), overdueByDays: z.number().int().nonnegative(), detectedAt: isoString }),
  [PlatformEventTypes.TUTORIAL_SUBTOPIC_COMPLETED]: idPayload({ userId: z.string().uuid(), subtopicId: z.string().uuid(), completedAt: isoString }),
  [PlatformEventTypes.BATCH_SESSION_COMPLETED]: idPayload({ batchId: z.string().uuid(), sessionId: z.string().uuid(), completedAt: isoString }),
  [PlatformEventTypes.BATCH_SUBTOPICS_COVERED]: idPayload({ batchId: z.string().uuid(), subtopicIds: z.array(z.string().uuid()).min(1), coveredAt: isoString }),
  [PlatformEventTypes.ATTENDANCE_MARKED]: idPayload({ batchId: z.string().uuid(), userId: z.string().uuid(), sessionId: z.string().uuid(), markedAt: isoString, present: z.boolean() }),
  [PlatformEventTypes.ADMISSION_COMPLETED]: idPayload({ admissionId: z.string().uuid(), userId: z.string().uuid(), completedAt: isoString }),
  [PlatformEventTypes.PROJECT_SUBMITTED]: idPayload({ userId: z.string().uuid(), projectId: z.string().uuid(), submittedAt: isoString }),
  [PlatformEventTypes.CERTIFICATE_ISSUED]: idPayload({ certificateId: z.string().uuid(), userId: z.string().uuid(), issuedAt: isoString }),
  [PlatformEventTypes.PLACEMENT_OFFER_ACCEPTED]: idPayload({ userId: z.string().uuid(), offerId: z.string().uuid(), acceptedAt: isoString }),
  [PlatformEventTypes.CONTENT_GENERATION_REQUESTED]: idPayload({ subtopicId: z.string().uuid(), requestedBy: z.string().uuid(), requestedAt: isoString }),
  [PlatformEventTypes.CONTENT_APPROVED_AND_PUBLISHED]: idPayload({ subtopicId: z.string().uuid(), approvedBy: z.string().uuid(), publishedAt: isoString, version: z.number().int().positive() }),
} as const;

export type PlatformEventPayloadMap = {
  [K in PlatformEventType]: z.infer<(typeof PlatformEventPayloadSchemas)[K]>;
};

export const PlatformEventEnvelopeSchemas = {
  [PlatformEventTypes.STUDENT_ENROLLED]: z.object({ ...baseFields, type: z.literal(PlatformEventTypes.STUDENT_ENROLLED), data: PlatformEventPayloadSchemas[PlatformEventTypes.STUDENT_ENROLLED] }),
  [PlatformEventTypes.STUDENT_CREATED]: z.object({ ...baseFields, type: z.literal(PlatformEventTypes.STUDENT_CREATED), data: PlatformEventPayloadSchemas[PlatformEventTypes.STUDENT_CREATED] }),
  [PlatformEventTypes.EXAM_COMPLETED]: z.object({ ...baseFields, type: z.literal(PlatformEventTypes.EXAM_COMPLETED), data: PlatformEventPayloadSchemas[PlatformEventTypes.EXAM_COMPLETED] }),
  [PlatformEventTypes.PAYMENT_RECEIVED]: z.object({ ...baseFields, type: z.literal(PlatformEventTypes.PAYMENT_RECEIVED), data: PlatformEventPayloadSchemas[PlatformEventTypes.PAYMENT_RECEIVED] }),
  [PlatformEventTypes.PAYMENT_OVERDUE]: z.object({ ...baseFields, type: z.literal(PlatformEventTypes.PAYMENT_OVERDUE), data: PlatformEventPayloadSchemas[PlatformEventTypes.PAYMENT_OVERDUE] }),
  [PlatformEventTypes.TUTORIAL_SUBTOPIC_COMPLETED]: z.object({ ...baseFields, type: z.literal(PlatformEventTypes.TUTORIAL_SUBTOPIC_COMPLETED), data: PlatformEventPayloadSchemas[PlatformEventTypes.TUTORIAL_SUBTOPIC_COMPLETED] }),
  [PlatformEventTypes.BATCH_SESSION_COMPLETED]: z.object({ ...baseFields, type: z.literal(PlatformEventTypes.BATCH_SESSION_COMPLETED), data: PlatformEventPayloadSchemas[PlatformEventTypes.BATCH_SESSION_COMPLETED] }),
  [PlatformEventTypes.BATCH_SUBTOPICS_COVERED]: z.object({ ...baseFields, type: z.literal(PlatformEventTypes.BATCH_SUBTOPICS_COVERED), data: PlatformEventPayloadSchemas[PlatformEventTypes.BATCH_SUBTOPICS_COVERED] }),
  [PlatformEventTypes.ATTENDANCE_MARKED]: z.object({ ...baseFields, type: z.literal(PlatformEventTypes.ATTENDANCE_MARKED), data: PlatformEventPayloadSchemas[PlatformEventTypes.ATTENDANCE_MARKED] }),
  [PlatformEventTypes.ADMISSION_COMPLETED]: z.object({ ...baseFields, type: z.literal(PlatformEventTypes.ADMISSION_COMPLETED), data: PlatformEventPayloadSchemas[PlatformEventTypes.ADMISSION_COMPLETED] }),
  [PlatformEventTypes.PROJECT_SUBMITTED]: z.object({ ...baseFields, type: z.literal(PlatformEventTypes.PROJECT_SUBMITTED), data: PlatformEventPayloadSchemas[PlatformEventTypes.PROJECT_SUBMITTED] }),
  [PlatformEventTypes.CERTIFICATE_ISSUED]: z.object({ ...baseFields, type: z.literal(PlatformEventTypes.CERTIFICATE_ISSUED), data: PlatformEventPayloadSchemas[PlatformEventTypes.CERTIFICATE_ISSUED] }),
  [PlatformEventTypes.PLACEMENT_OFFER_ACCEPTED]: z.object({ ...baseFields, type: z.literal(PlatformEventTypes.PLACEMENT_OFFER_ACCEPTED), data: PlatformEventPayloadSchemas[PlatformEventTypes.PLACEMENT_OFFER_ACCEPTED] }),
  [PlatformEventTypes.CONTENT_GENERATION_REQUESTED]: z.object({ ...baseFields, type: z.literal(PlatformEventTypes.CONTENT_GENERATION_REQUESTED), data: PlatformEventPayloadSchemas[PlatformEventTypes.CONTENT_GENERATION_REQUESTED] }),
  [PlatformEventTypes.CONTENT_APPROVED_AND_PUBLISHED]: z.object({ ...baseFields, type: z.literal(PlatformEventTypes.CONTENT_APPROVED_AND_PUBLISHED), data: PlatformEventPayloadSchemas[PlatformEventTypes.CONTENT_APPROVED_AND_PUBLISHED] }),
} as const;

export type PlatformEventEnvelopeMap = {
  [K in PlatformEventType]: z.infer<(typeof PlatformEventEnvelopeSchemas)[K]>;
};

export function getPlatformEventSchema(type: PlatformEventType) {
  return PlatformEventPayloadSchemas[type];
}

export function createEventEnvelope<TType extends PlatformEventType>(
  type: TType,
  data: PlatformEventPayloadMap[TType],
  input: Pick<EventEnvelope<TType, PlatformEventPayloadMap[TType]>, 'correlationId' | 'source' | 'occurredAt' | 'version' | 'id'>
): EventEnvelope<TType, PlatformEventPayloadMap[TType]> {
  return {
    id: input.id,
    type,
    correlationId: input.correlationId,
    source: input.source,
    occurredAt: input.occurredAt,
    version: input.version,
    data,
  };
}
