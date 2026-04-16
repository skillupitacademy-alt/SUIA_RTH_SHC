/**
 * Session & Device Tracking Types
 */

export interface Session {
  id: string;
  user_id: string;
  device: string;
  ip_address: string;
  user_agent: string;
  refresh_token: string;
  created_at: Date;
  expires_at: Date;
  last_activity: Date;
  revoked: boolean;
  brand: string;
}

export interface CreateSessionInput {
  userId: string;
  device: string;
  ipAddress: string;
  userAgent: string;
  refreshToken: string;
  brand: string;
  expiresIn?: number; // seconds, default 30 days
}

export interface SessionInfo {
  id: string;
  device: string;
  ipAddress: string;
  createdAt: Date;
  lastActivity: Date;
  isCurrent: boolean;
}

export interface DeviceInfo {
  browser?: string;
  os?: string;
  device?: string;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export class SessionExpiredError extends Error {
  constructor() {
    super('Session has expired');
    this.name = 'SessionExpiredError';
  }
}

export class SessionRevokedError extends Error {
  constructor() {
    super('Session has been revoked');
    this.name = 'SessionRevokedError';
  }
}

export class InvalidSessionError extends Error {
  constructor() {
    super('Invalid session');
    this.name = 'InvalidSessionError';
  }
}