'use client';

import React, { useState, useEffect } from 'react';
import { Monitor, Smartphone, Tablet, LogOut, Loader2, AlertTriangle, Shield } from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';

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
  
  if (ua.includes('chrome')) return 'Chrome on Windows';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('edge')) return 'Edge';
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
  if (!ip) return 'Unknown';
  
  if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return 'Local Network';
  }
  if (ip.startsWith('203.')) return 'Asia Pacific';
  if (ip.startsWith('185.')) return 'Europe';
  if (ip.startsWith('104.')) return 'North America';
  
  return 'Unknown';
}

export function DeviceSessions({ className, onSessionRevoked, onGlobalLogout }: DeviceSessionsProps) {
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [globalLoggingOut, setGlobalLoggingOut] = useState(false);

  // Fetch active sessions
  const fetchSessions = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/auth/sessions', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'x-portal-identity': 'user',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch sessions: ${response.status}`);
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
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
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
        throw new Error(`Failed to revoke session: ${response.status}`);
      }

      setSessions(prev => prev.filter(s => s.id !== sessionId));
      onSessionRevoked?.(sessionId);
      
    } catch (err) {
      console.error('Failed to revoke session:', err);
      setError(err instanceof Error ? err.message : 'Failed to revoke session');
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
        throw new Error(`Global logout failed: ${response.status}`);
      }

      setSessions([]);
      onGlobalLogout?.();
      
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);
      
    } catch (err) {
      console.error('Global logout failed:', err);
      setError(err instanceof Error ? err.message : 'Global logout failed');
    } finally {
      setGlobalLoggingOut(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Device Sessions
          </CardTitle>
          <CardDescription>
            Manage your active login sessions across all devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading sessions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentSession = sessions.find(s => s.isCurrent);
  const otherSessions = sessions.filter(s => !s.isCurrent);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Device Sessions
            </CardTitle>
            <CardDescription>
              {sessions.length === 1 
                ? "You're signed in on this device only" 
                : `You're signed in on ${sessions.length} devices`}
            </CardDescription>
          </div>
          
          {sessions.length > 1 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleGlobalLogout}
              disabled={globalLoggingOut}
              className="flex items-center gap-2"
            >
              {globalLoggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Logout All
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg p-4 bg-red-50 border border-red-200 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-red-900">Error</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No active sessions found</p>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchSessions}
              className="mt-2"
            >
              Refresh
            </Button>
          </div>
        ) : (
          <>
            {/* Current Device */}
            {currentSession && (
              <div className="p-4 rounded-lg border-2 border-green-200 bg-green-50">
                <div className="flex items-center gap-4">
                  {React.createElement(getDeviceIcon(currentSession.userAgent), {
                    className: "h-5 w-5 text-green-600 flex-shrink-0"
                  })}
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-gray-900">
                        {currentSession.deviceName || getDeviceType(currentSession.userAgent)}
                      </p>
                      <Badge variant="secondary" className="text-xs bg-green-600 text-white">
                        This device
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-600">
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
                className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {React.createElement(getDeviceIcon(session.userAgent), {
                    className: "h-5 w-5 text-gray-400 flex-shrink-0"
                  })}
                  
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                      {session.deviceName || getDeviceType(session.userAgent)}
                    </p>
                    <p className="text-xs text-gray-600">
                      {getLocationFromIP(session.ipAddress)} • {formatLastUsed(session.lastUsedAt)}
                    </p>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => revokeSession(session.id)}
                    disabled={revoking === session.id}
                  >
                    {revoking === session.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Log out'
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </>
        )}
        
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Sessions expire after 7 days of inactivity</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={fetchSessions}
              disabled={loading}
            >
              Refresh
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
