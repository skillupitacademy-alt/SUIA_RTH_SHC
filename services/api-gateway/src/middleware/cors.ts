import { cors } from 'hono/cors';
import type { MiddlewareHandler } from 'hono';

export const ALLOWED_ORIGINS = [
  'https://realtutorialhub.com',
  'https://notes.realtutorialhub.com',
  'https://quiz.realtutorialhub.com',
  'https://skillupitacademy.com',
  'https://admin.skillupitacademy.com',
  'https://faculty.skillupitacademy.com',
  'https://api.skillhubcore.in',
  'https://admin.skillhubcore.in',
  'https://admin.realtutorialhub.com',
  'http://localhost:3000',
];

export function createCorsMiddleware(): MiddlewareHandler {
  return cors({
    origin: ALLOWED_ORIGINS,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Gateway-Secret', 'X-User-ID'],
    exposeHeaders: ['X-Request-ID', 'X-RateLimit-Remaining'],
    credentials: true,
  });
}
