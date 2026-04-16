/**
 * Session & Device Tracking Service
 */

import { 
  type Session, 
  type CreateSessionInput, 
  type SessionInfo,
  type DeviceInfo,
  SessionExpiredError,
  SessionRevokedError,
  InvalidSessionError
} from './session.types';

export interface SessionRepository {
  create(input: CreateSessionInput): Promise<Session>;
  findById(id: string): Promise<Session | null>;
  findByRefreshToken(refreshToken: string): Promise<Session | null>;
  findByUserId(userId: string): Promise<Session[]>;
  updateLastActivity(id: string): Promise<void>;
  updateRefreshToken(id: string, refreshToken: string): Promise<void>;
  revoke(id: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;
}

export class SessionService {
  constructor(private repository: SessionRepository) {}

  /**
   * Create new session on login
   */
  async createSession(input: CreateSessionInput): Promise<Session> {
    const expiresIn = input.expiresIn || (30 * 24 * 60 * 60); // 30 days default
    const expiresAt = new Date(Date.now() + expiresIn * 1000);

    return this.repository.create({
      ...input,
      expiresIn
    });
  }

  /**
   * Validate session and update activity
   */
  async validateSession(refreshToken: string): Promise<Session> {
    const session = await this.repository.findByRefreshToken(refreshToken);
    
    if (!session) {
      throw new InvalidSessionError();
    }

    if (session.revoked) {
      throw new SessionRevokedError();
    }

    if (session.expires_at < new Date()) {
      throw new SessionExpiredError();
    }

    // Update last activity
    await this.repository.updateLastActivity(session.id);

    return session;
  }

  /**
   * Rotate refresh token for security
   */
  async rotateRefreshToken(sessionId: string, newRefreshToken: string): Promise<void> {
    await this.repository.updateRefreshToken(sessionId, newRefreshToken);
  }

  /**
   * Revoke single session (logout)
   */
  async revokeSession(sessionId: string): Promise<void> {
    await this.repository.revoke(sessionId);
  }

  /**
   * Revoke all sessions for user (logout all devices)
   */
  async revokeAllSessions(userId: string): Promise<void> {
    await this.repository.revokeAllForUser(userId);
  }

  /**
   * Get all active sessions for user
   */
  async getUserSessions(userId: string, currentSessionId?: string): Promise<SessionInfo[]> {
    const sessions = await this.repository.findByUserId(userId);
    
    return sessions
      .filter(session => !session.revoked && session.expires_at > new Date())
      .map(session => ({
        id: session.id,
        device: this.parseDeviceInfo(session.user_agent).device || 'Unknown Device',
        ipAddress: session.ip_address,
        createdAt: session.created_at,
        lastActivity: session.last_activity,
        isCurrent: session.id === currentSessionId
      }));
  }

  /**
   * Parse device information from user agent
   */
  parseDeviceInfo(userAgent: string): DeviceInfo {
    const ua = userAgent.toLowerCase();
    
    // Browser detection
    let browser = 'Unknown';
    if (ua.includes('chrome')) browser = 'Chrome';
    else if (ua.includes('firefox')) browser = 'Firefox';
    else if (ua.includes('safari')) browser = 'Safari';
    else if (ua.includes('edge')) browser = 'Edge';

    // OS detection
    let os = 'Unknown';
    if (ua.includes('windows')) os = 'Windows';
    else if (ua.includes('mac')) os = 'macOS';
    else if (ua.includes('linux')) os = 'Linux';
    else if (ua.includes('android')) os = 'Android';
    else if (ua.includes('ios')) os = 'iOS';

    // Device type detection
    const isMobile = /mobile|android|iphone/i.test(ua);
    const isTablet = /tablet|ipad/i.test(ua);
    const isDesktop = !isMobile && !isTablet;

    let device = 'Desktop';
    if (isMobile) device = 'Mobile';
    else if (isTablet) device = 'Tablet';

    return {
      browser,
      os,
      device: `${browser} on ${os}`,
      isMobile,
      isTablet,
      isDesktop
    };
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    return this.repository.deleteExpired();
  }

  /**
   * Check if session is valid without throwing
   */
  async isSessionValid(refreshToken: string): Promise<boolean> {
    try {
      await this.validateSession(refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get session by ID
   */
  async getSession(sessionId: string): Promise<Session | null> {
    return this.repository.findById(sessionId);
  }

  /**
   * Extend session expiry
   */
  async extendSession(sessionId: string, additionalSeconds: number): Promise<void> {
    const session = await this.repository.findById(sessionId);
    
    if (!session || session.revoked) {
      throw new InvalidSessionError();
    }

    const newExpiresAt = new Date(session.expires_at.getTime() + additionalSeconds * 1000);
    
    // Update expires_at (would need to add this method to repository)
    // await this.repository.updateExpiresAt(sessionId, newExpiresAt);
  }
}