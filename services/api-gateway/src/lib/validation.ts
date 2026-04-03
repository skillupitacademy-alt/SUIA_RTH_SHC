import { ROUTING_TABLE } from '@/routes/routing-table';
import type { GatewayBindings, GatewayRoute } from '@/types';

export interface RouteSnapshotEntry extends GatewayRoute {
  bindingStatus: 'configured' | 'missing';
  upstreamUrl?: string;
}

export interface GatewayHealthSnapshot {
  status: 'ok';
  timestamp: string;
  lastValidationTimestamp: string | null;
  services: Record<string, { status: 'configured' | 'missing'; url?: string }>;
  routes: RouteSnapshotEntry[];
}

function summarizeBinding(url: string | undefined): { status: 'configured' | 'missing'; url?: string } {
  if (typeof url !== 'string' || url.trim().length === 0) {
    return { status: 'missing' };
  }

  return { status: 'configured', url };
}

export function buildGatewayHealthSnapshot(env: Partial<GatewayBindings>): GatewayHealthSnapshot {
  const services = Object.fromEntries(
    Object.entries({
      SKILLHUBCORE_URL: env.SKILLHUBCORE_URL,
      QUIZ_WEB_URL: env.QUIZ_WEB_URL,
      SKILLUP_WEB_URL: env.SKILLUP_WEB_URL,
      RTH_ADMIN_URL: env.RTH_ADMIN_URL,
      SKILLUP_ADMIN_URL: env.SKILLUP_ADMIN_URL,
      FACULTY_URL: env.FACULTY_URL,
      STUDENT_FACULTY_URL: env.STUDENT_FACULTY_URL,
      EXAM_SERVICE_URL: env.EXAM_SERVICE_URL,
      TUTORIAL_SERVICE_URL: env.TUTORIAL_SERVICE_URL,
      PAYMENT_SERVICE_URL: env.PAYMENT_SERVICE_URL,
      CRM_SERVICE_URL: env.CRM_SERVICE_URL,
      NOTIFICATION_URL: env.NOTIFICATION_URL,
      PLACEMENT_URL: env.PLACEMENT_URL,
    }).map(([key, value]) => [key, summarizeBinding(value)]),
  ) as GatewayHealthSnapshot['services'];

  const routes = ROUTING_TABLE.map((route) => ({
    ...route,
    bindingStatus: services[route.upstreamKey].status,
    upstreamUrl: services[route.upstreamKey].url,
  }));

  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    lastValidationTimestamp: env.LAST_VALIDATION_TIMESTAMP ?? null,
    services,
    routes,
  };
}
