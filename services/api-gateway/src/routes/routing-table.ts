import type { GatewayRoute } from '@/types';

export const ROUTING_TABLE: GatewayRoute[] = [
  { prefix: '/auth', upstreamKey: 'SKILLHUBCORE_URL', public: true },
  { prefix: '/students', upstreamKey: 'STUDENT_FACULTY_URL', auth: true },
  { prefix: '/faculty', upstreamKey: 'STUDENT_FACULTY_URL', auth: true },
  { prefix: '/batches', upstreamKey: 'STUDENT_FACULTY_URL', auth: true },
  { prefix: '/attendance', upstreamKey: 'STUDENT_FACULTY_URL', auth: true },
  { prefix: '/exam', upstreamKey: 'EXAM_SERVICE_URL', auth: true },
  { prefix: '/questions', upstreamKey: 'EXAM_SERVICE_URL', auth: true },
  { prefix: '/tutorial', upstreamKey: 'TUTORIAL_SERVICE_URL', auth: true },
  { prefix: '/ai-tutor', upstreamKey: 'TUTORIAL_SERVICE_URL', auth: true },
  { prefix: '/payments', upstreamKey: 'PAYMENT_SERVICE_URL', auth: true },
  { prefix: '/webhooks', upstreamKey: 'PAYMENT_SERVICE_URL', public: true },
  { prefix: '/crm', upstreamKey: 'CRM_SERVICE_URL', auth: true },
  { prefix: '/enquiries', upstreamKey: 'CRM_SERVICE_URL', public: true },
  { prefix: '/notifications', upstreamKey: 'NOTIFICATION_URL', auth: true },
  { prefix: '/placement', upstreamKey: 'PLACEMENT_URL', auth: true },
  { prefix: '/jobs', upstreamKey: 'PLACEMENT_URL', public: true },
  { prefix: '/admin', upstreamKey: 'ADMIN_URL', auth: true, requireRole: 'admin' },
];
