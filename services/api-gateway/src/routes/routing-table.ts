import type { GatewayRoute } from '@/types';

export const ROUTING_TABLE: GatewayRoute[] = [
  { host: 'user.realtutorialhub.com', prefix: '/', upstreamKey: 'TUTORIAL_SERVICE_URL', public: true },
  { host: 'user.skillupitacademy.com', prefix: '/', upstreamKey: 'SKILLUP_WEB_URL', public: true },
  { host: 'admin.skillupitacademy.com', prefix: '/', upstreamKey: 'SKILLUP_ADMIN_URL', public: true },
  { host: 'faculty.skillupitacademy.com', prefix: '/', upstreamKey: 'FACULTY_URL', public: true },
  { host: 'quiz.skillhubcore.in', prefix: '/', upstreamKey: 'QUIZ_WEB_URL', public: true },
  { host: 'tutorial.skillhubcore.in', prefix: '/', upstreamKey: 'TUTORIAL_SERVICE_URL', public: true },
  { host: 'placement.skillhubcore.in', prefix: '/', upstreamKey: 'PLACEMENT_URL', public: true },
  { host: 'api.realtutorialhub.com', prefix: '/health/live', upstreamKey: 'EXAM_SERVICE_URL', public: true },
  { host: 'api.skillupitacademy.com', prefix: '/health/live', upstreamKey: 'EXAM_SERVICE_URL', public: true },
  { host: 'api.skillhubcore.in', prefix: '/healthz', upstreamKey: 'SKILLHUBCORE_URL', public: true },
  { host: 'api.skillhubcore.in', prefix: '/', upstreamKey: 'SKILLHUBCORE_URL', auth: true },
  { prefix: '/auth', upstreamKey: 'EXAM_SERVICE_URL', upstreamPathPrefix: '/api/auth', public: true },
  { prefix: '/students', upstreamKey: 'STUDENT_FACULTY_URL', auth: true },
  { prefix: '/faculty', upstreamKey: 'STUDENT_FACULTY_URL', auth: true },
  { prefix: '/batches', upstreamKey: 'STUDENT_FACULTY_URL', auth: true },
  { prefix: '/attendance', upstreamKey: 'STUDENT_FACULTY_URL', auth: true },
  { prefix: '/exam', upstreamKey: 'EXAM_SERVICE_URL', upstreamPathPrefix: '/api/exams', auth: true },
  { prefix: '/questions', upstreamKey: 'EXAM_SERVICE_URL', upstreamPathPrefix: '/api/quiz', auth: true },
  { prefix: '/dashboard', upstreamKey: 'EXAM_SERVICE_URL', upstreamPathPrefix: '/api/dashboard', auth: true },
  { prefix: '/analytics', upstreamKey: 'EXAM_SERVICE_URL', upstreamPathPrefix: '/api/analytics', auth: true },
  { prefix: '/reports', upstreamKey: 'EXAM_SERVICE_URL', upstreamPathPrefix: '/api/reports', auth: true },
  { prefix: '/telemetry', upstreamKey: 'EXAM_SERVICE_URL', upstreamPathPrefix: '/api/telemetry', public: true },
  { prefix: '/domains', upstreamKey: 'EXAM_SERVICE_URL', upstreamPathPrefix: '/api/domains', auth: true },
  { prefix: '/subjects', upstreamKey: 'EXAM_SERVICE_URL', upstreamPathPrefix: '/api/subjects', auth: true },
  { prefix: '/topics', upstreamKey: 'EXAM_SERVICE_URL', upstreamPathPrefix: '/api/topics', auth: true },
  { prefix: '/subtopics', upstreamKey: 'EXAM_SERVICE_URL', upstreamPathPrefix: '/api/subtopics', auth: true },
  { prefix: '/quiz', upstreamKey: 'EXAM_SERVICE_URL', upstreamPathPrefix: '/api/quiz', auth: true },
  { prefix: '/recommendations', upstreamKey: 'EXAM_SERVICE_URL', upstreamPathPrefix: '/api/recommendations', auth: true },
  { prefix: '/tutor', upstreamKey: 'EXAM_SERVICE_URL', upstreamPathPrefix: '/api/tutor', auth: true },
  { prefix: '/exams', upstreamKey: 'EXAM_SERVICE_URL', upstreamPathPrefix: '/api/exams', auth: true },
  { prefix: '/export', upstreamKey: 'EXAM_SERVICE_URL', upstreamPathPrefix: '/api/export', auth: true },
  { prefix: '/report-status', upstreamKey: 'EXAM_SERVICE_URL', upstreamPathPrefix: '/api/report-status', auth: true },
  { prefix: '/queue-report', upstreamKey: 'EXAM_SERVICE_URL', upstreamPathPrefix: '/api/queue-report', auth: true },
  { prefix: '/search', upstreamKey: 'EXAM_SERVICE_URL', upstreamPathPrefix: '/api/search', public: true },
  { prefix: '/factory', upstreamKey: 'EXAM_SERVICE_URL', upstreamPathPrefix: '/api/factory', auth: true, requireRole: 'admin' },
  { prefix: '/system', upstreamKey: 'EXAM_SERVICE_URL', upstreamPathPrefix: '/api/system', auth: true, requireRole: 'admin' },
  { prefix: '/tutorial', upstreamKey: 'TUTORIAL_SERVICE_URL', auth: true },
  { prefix: '/ai-tutor', upstreamKey: 'TUTORIAL_SERVICE_URL', auth: true },
  { prefix: '/payments', upstreamKey: 'PAYMENT_SERVICE_URL', auth: true },
  { prefix: '/webhooks', upstreamKey: 'PAYMENT_SERVICE_URL', public: true },
  { prefix: '/crm', upstreamKey: 'CRM_SERVICE_URL', auth: true },
  { prefix: '/enquiries', upstreamKey: 'CRM_SERVICE_URL', public: true },
  { prefix: '/notifications', upstreamKey: 'NOTIFICATION_URL', upstreamPathPrefix: '/api/notifications', auth: true },
  { prefix: '/placement', upstreamKey: 'PLACEMENT_URL', auth: true },
  { prefix: '/jobs', upstreamKey: 'PLACEMENT_URL', public: true },
  { prefix: '/admin', upstreamKey: 'EXAM_SERVICE_URL', upstreamPathPrefix: '/api/admin', auth: true, requireRole: 'admin' },
];

function matchesPrefix(pathname: string, prefix: string): boolean {
  if (prefix === '/') {
    return true;
  }

  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function resolveGatewayRoute(hostname: string, pathname: string): GatewayRoute | undefined {
  // The FetchClient sends requests with /api prefix (e.g. /api/auth/me, /api/dashboard).
  // Strip it so routes defined as /auth, /dashboard, etc. still match.
  const normalizedPath = pathname.startsWith('/api/') ? pathname.slice(4) : pathname;

  return ROUTING_TABLE
    .filter((route) => (route.host === undefined || route.host === hostname) && matchesPrefix(normalizedPath, route.prefix))
    .sort((left, right) => {
      const leftHostScore = left.host === hostname ? 1 : 0;
      const rightHostScore = right.host === hostname ? 1 : 0;

      if (leftHostScore !== rightHostScore) {
        return rightHostScore - leftHostScore;
      }

      return right.prefix.length - left.prefix.length;
    })[0];
}
