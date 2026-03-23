export interface SkillHubCoreTokenPayload {
  sub: string;
  roles: string[];
  subscriptions: string[];
  iss: 'skillhubcore.in';
  exp?: number;
}

export interface GatewayBindings {
  ENVIRONMENT?: string;
  JWT_SECRET: string;
  INTERNAL_GATEWAY_SECRET: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  SKILLHUBCORE_URL: string;
  SKILLUP_WEB_URL: string;
  SKILLUP_ADMIN_URL: string;
  FACULTY_URL: string;
  STUDENT_FACULTY_URL: string;
  EXAM_SERVICE_URL: string;
  TUTORIAL_SERVICE_URL: string;
  PAYMENT_SERVICE_URL: string;
  CRM_SERVICE_URL: string;
  NOTIFICATION_URL: string;
  PLACEMENT_URL: string;
  ADMIN_URL: string;
}

export interface GatewayVariables {
  requestId: string;
  user?: SkillHubCoreTokenPayload;
}

export type GatewayRoute = {
  host?: string;
  prefix: string;
  upstreamKey: keyof Pick<
    GatewayBindings,
    | 'SKILLHUBCORE_URL'
    | 'SKILLUP_WEB_URL'
    | 'SKILLUP_ADMIN_URL'
    | 'FACULTY_URL'
    | 'STUDENT_FACULTY_URL'
    | 'EXAM_SERVICE_URL'
    | 'TUTORIAL_SERVICE_URL'
    | 'PAYMENT_SERVICE_URL'
    | 'CRM_SERVICE_URL'
    | 'NOTIFICATION_URL'
    | 'PLACEMENT_URL'
    | 'ADMIN_URL'
  >;
  public?: boolean;
  auth?: boolean;
  requireRole?: 'admin';
};
