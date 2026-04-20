'use client';

import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Tablet, LogOut, Loader2, Shield } from 'lucide-react';
import { useBrand } from '@/share-branding/PostLandingPage/app/context/BrandContext';

interface DeviceSession {
  id: string;
  deviceId: string;
  deviceName: string;
  ipAddress: string | null;
  userAgent: string;
  lastUsedAt: string;
  createdAt: string;
  expiresAt: string;
  isCurrent?: boolean;
}

interface DeviceSessionsProps {
  className?: string;
  onSessionRevoked?: (sessionId: string) => void;
  onGlobalLogout?: () => void;
}

// Utility functions
function getDeviceIcon(userAgent: string) {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return Smartphone;
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return Tablet;
  }
  return Monitor;
}

function getDeviceType(userAgent: string | null): string {
  if (!userAgent) return 'Unknown Device';
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('chrome')) return 'Chrome Browser';
  if (ua.includes('firefox')) return 'Firefox Browser';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari Browser';
  if (ua.includes('edge')) return 'Edge Browser';
  if (ua.includes('android')) return 'Android Device';
  if (ua.includes('iphone')) return 'iPhone';
  if (ua.includes('ipad')) return 'iPad';
  
  return 'Unknown Device';
}

function formatLastUsed(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString();
}

function getLocationFromIP(ip: string | null): string {
  if (!ip) return 'Unknown location';
  
  if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return 'Local Network';
  }
  if (ip.startsWith('203.')) return 'Asia Pacific';
  if (ip.startsWith('185.')) return 'Europe';
  if (ip.startsWith('104.')) return 'North America';
  
  return 'Unknown location';
}

export function DeviceSessions({ className, onSessionRevoked, onGlobalLogout }: DeviceSessionsProps) {
  const brand = useBrand();
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [globalLoggingOut, setGlobalLoggingOut] = useState(false);

  // Fetch active sessions
  const fetchSessions = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/auth/sessions', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'x-portal-identity': 'user',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        console.error('Failed to fetch sessions:', response.status);
        setSessions([]);
        return;
      }

      const data = await response.json();
      
      // Mark current session
      const currentDeviceId = localStorage.getItem('deviceId') || 'unknown';
      const sessionsWithCurrent = (data.sessions || []).map((session: DeviceSession) => ({
        ...session,
        isCurrent: session.deviceId === currentDeviceId
      }));
      
      setSessions(sessionsWithCurrent);
      
    } catch (err) {
      console.error('Failed to fetch sessions:', err);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  // Revoke specific session
  const revokeSession = async (sessionId: string) => {
    try {
      setRevoking(sessionId);
      
      const response = await fetch(`/api/auth/sessions/${sessionId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'x-portal-identity': 'user'
        }
      });

      if (!response.ok) {
        console.error('Failed to revoke session:', response.status);
        return;
      }

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      onSessionRevoked?.(sessionId);
      
    } catch (err) {
      console.error('Failed to revoke session:', err);
    } finally {
      setRevoking(null);
    }
  };

  // Global logout (all devices)
  const handleGlobalLogout = async () => {
    if (!confirm('Log out from all devices? You will need to sign in again.')) {
      return;
    }

    try {
      setGlobalLoggingOut(true);
      
      const response = await fetch('/api/auth/sessions', {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'x-portal-identity': 'user'
        }
      });

      if (!response.ok) {
        console.error('Global logout failed:', response.status);
        return;
      }

      setSessions([]);
      onGlobalLogout?.();
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      
    } catch (err) {
      console.error('Global logout failed:', err);
    } finally {
      setGlobalLoggingOut(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  if (loading) {
    return (
      <div className={`rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm sm:p-8 ${className || ''}`}>
        <div className="mb-6 flex items-center gap-3">
          <div className="relative flex h-12 w-12 items-center justify-center">
            <div
              className="absolute inset-0 rounded-xl"
              style={{ backgroundColor: brand.primaryColor, opacity: 0.15 }}
            />
            <Shield size={22} style={{ color: brand.primaryColor }} />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-black text-gray-900">Device Sessions</h2>
            <p className="text-gray-600">Manage your active login sessions</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-gray-400" size={32} />
          <span className="ml-3 text-gray-600">Loading sessions...</span>
        </div>
      </div>
    );
  }

  const currentSession = sessions.find(s => s.isCurrent);
  const otherSessions = sessions.filter(s => !s.isCurrent);

  return (
    <div className={`rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm sm:p-8 ${className || ''}`}>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center">
            <div
              className="absolute inset-0 rounded-xl"
              style={{ backgroundColor: brand.primaryColor, opacity: 0.15 }}
            />
            <Shield size={22} style={{ color: brand.primaryColor }} />
          </div>
          <div className="min-w-0">
            <h2 className="text-2xl font-black text-gray-900">Device Sessions</h2>
            <p className="text-gray-600">
              {sessions.length === 1 
                ? "You're signed in on this device only" 
                : `You're signed in on ${sessions.length} devices`}
            </p>
          </div>
        </div>
        
        {sessions.length > 1 && (
          <button
            onClick={handleGlobalLogout}
            disabled={globalLoggingOut}
            className="flex h-10 w-full items-center justify-center gap-2 rounded-xl px-4 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none sm:w-auto"
            style={{ backgroundColor: '#dc2626' }}
          >
            {globalLoggingOut ? (
              <>
                <Loader2 className="animate-spin" size={16} />
                Logging out...
              </>
            ) : (
              <>
                <LogOut size={16} />
                Logout All
              </>
            )}
          </button>
        )}
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {sessions.length === 0 ? (
          <div className="text-center py-12">
            <Shield className="mx-auto mb-4 opacity-30" size={48} style={{ color: brand.primaryColor }} />
            <p className="text-gray-600 mb-4">No active sessions found</p>
            <button
              onClick={fetchSessions}
              className="px-6 h-10 rounded-xl font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
            >
              Refresh
            </button>
          </div>
        ) : (
          <>
            {/* Current Device */}
            {currentSession && (
              <div className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center">
                    <div
                      className="absolute inset-0 rounded-xl"
                      style={{ backgroundColor: brand.primaryColor, opacity: 0.15 }}
                    />
                    {React.createElement(getDeviceIcon(currentSession.userAgent), {
                      size: 22,
                      style: { color: brand.primaryColor }
                    })}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                      <p className="text-lg font-semibold text-gray-900">
                        {currentSession.deviceName || getDeviceType(currentSession.userAgent)}
                      </p>
                      <span
                        className="px-3 py-1 rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: brand.primaryColor }}
                      >
                        This device
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {getLocationFromIP(currentSession.ipAddress)} • {formatLastUsed(currentSession.lastUsedAt)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Other Devices */}
            {otherSessions.map((session) => (
              <div
                key={session.id}
                className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6"
              >
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
                    {React.createElement(getDeviceIcon(session.userAgent), {
                      size: 22,
                      className: "text-gray-400"
                    })}
                  </div>
                  
                  <div className="min-w-0 flex-1">
                    <p className="text-lg font-semibold text-gray-900 mb-1">
                      {session.deviceName || getDeviceType(session.userAgent)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {getLocationFromIP(session.ipAddress)} • {formatLastUsed(session.lastUsedAt)}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => revokeSession(session.id)}
                    disabled={revoking === session.id}
                    className="h-10 w-full rounded-xl border-2 border-gray-300 px-4 font-semibold text-gray-700 transition-all hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {revoking === session.id ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      'Log out'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </>
        )}
        
        {/* Footer */}
        {sessions.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-gray-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-gray-500">Sessions expire after 7 days of inactivity</p>
            <button
              onClick={fetchSessions}
              disabled={loading}
              className="text-sm font-semibold hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ color: brand.primaryColor }}
            >
              Refresh
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
