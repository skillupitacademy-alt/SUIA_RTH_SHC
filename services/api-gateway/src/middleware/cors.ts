import { cors } from 'hono/cors';
import type { MiddlewareHandler } from 'hono';

export const ALLOWED_ORIGINS = [
  'https://realtutorialhub.com',
  'https://user.realtutorialhub.com',
  'https://skillupitacademy.com',
  'https://user.skillupitacademy.com',
  'https://admin.skillupitacademy.com',
  'https://faculty.skillupitacademy.com',
  'https://api.skillhubcore.in',
  'https://admin.skillhubcore.in',
  'https://admin.realtutorialhub.com',
  'https://quiz.skillhubcore.in',
  'https://tutorial.skillhubcore.in',
  'https://placement.skillhubcore.in',
  'http://localhost:3000',
];

export function createCorsMiddleware(): MiddlewareHandler {
  return cors({
    origin: ALLOWED_ORIGINS,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: [
      'Content-Type',
      'Authorization',
      'Accept-Version',
      'X-Brand',
      'X-Portal-Identity',
      'X-Request-ID',
      'X-Gateway-Secret',
      'X-User-ID',
      'X-CSRF-Token',
    ],
    exposeHeaders: ['X-Request-ID', 'X-RateLimit-Remaining'],
    credentials: true,
  });
}
