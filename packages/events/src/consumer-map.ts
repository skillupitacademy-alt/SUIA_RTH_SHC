import { PlatformEventTypes, type PlatformEventType } from './types';

const TUTORIAL_SERVICE_URL = process.env.TUTORIAL_SERVICE_URL ?? 'https://tutorial-service.invalid';

export const EVENT_CONSUMER_MAP: Record<PlatformEventType, string[]> = {
  [PlatformEventTypes.STUDENT_ENROLLED]: [`${TUTORIAL_SERVICE_URL}/api/workers/student-enrolled`],
  [PlatformEventTypes.STUDENT_CREATED]: ['https://placeholder.invalid/consumers/student-created'],
  [PlatformEventTypes.EXAM_COMPLETED]: ['https://placeholder.invalid/consumers/exam-completed'],
  [PlatformEventTypes.PAYMENT_RECEIVED]: ['https://placeholder.invalid/consumers/payment-received'],
  [PlatformEventTypes.PAYMENT_OVERDUE]: ['https://placeholder.invalid/consumers/payment-overdue'],
  [PlatformEventTypes.TUTORIAL_SUBTOPIC_COMPLETED]: ['https://placeholder.invalid/consumers/tutorial-subtopic-completed'],
  [PlatformEventTypes.BATCH_SESSION_COMPLETED]: ['https://placeholder.invalid/consumers/batch-session-completed'],
  [PlatformEventTypes.BATCH_SUBTOPICS_COVERED]: ['https://placeholder.invalid/consumers/batch-subtopics-covered'],
  [PlatformEventTypes.ATTENDANCE_MARKED]: ['https://placeholder.invalid/consumers/attendance-marked'],
  [PlatformEventTypes.ADMISSION_COMPLETED]: ['https://placeholder.invalid/consumers/admission-completed'],
  [PlatformEventTypes.PROJECT_SUBMITTED]: ['https://placeholder.invalid/consumers/project-submitted'],
  [PlatformEventTypes.CERTIFICATE_ISSUED]: ['https://placeholder.invalid/consumers/certificate-issued'],
  [PlatformEventTypes.PLACEMENT_OFFER_ACCEPTED]: ['https://placeholder.invalid/consumers/placement-offer-accepted'],
  [PlatformEventTypes.CONTENT_GENERATION_REQUESTED]: ['https://placeholder.invalid/consumers/content-generation-requested'],
  [PlatformEventTypes.CONTENT_APPROVED_AND_PUBLISHED]: ['https://placeholder.invalid/consumers/content-approved-and-published'],
};
