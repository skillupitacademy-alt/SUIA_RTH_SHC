'use client';

import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  Globe, 
  MapPin, 
  Calendar, 
  Shield, 
  Trash2, 
  AlertTriangle,
  CheckCircle,
  Loader2,
  LogOut
} from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Alert, AlertDescription } from './alert';
import { cn } from './utils';

interface DeviceSession {
  id: string;
  deviceId: string;
  deviceName: string;
  ipAddress: string;
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

function getDeviceType(userAgent: string): string {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('chrome')) return 'Chrome';
  if (ua.includes('firefox')) return 'Firefox';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari';
  if (ua.includes('edge')) return 'Edge';
  if (ua.includes('opera')) return 'Opera';
  
  if (ua.includes('android')) return 'Android';
  if (ua.includes('iphone') || ua.includes('ios')) return 'iPhone';
  if (ua.includes('ipad')) return 'iPad';
  if (ua.includes('windows')) return 'Windows';
  if (ua.includes('mac')) return 'Mac';
  if (ua.includes('linux')) return 'Linux';
  
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
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString();
}

function getLocationFromIP(ip: string): string {
  // In a real implementation, you'd use a geolocation service
  // For now, return a placeholder based on IP patterns
  if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return 'Local Network';
  }
  if (ip.startsWith('203.')) return 'Asia Pacific';
  if (ip.startsWith('185.')) return 'Europe';
  if (ip.startsWith('104.')) return 'North America';
  
  return 'Unknown Location';
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

      // Remove session from list
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

      // Clear all sessions
      setSessions([]);
      onGlobalLogout?.();
      
      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      
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
      <Card className={cn("w-full", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Manage your active login sessions across all devices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading sessions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Active Sessions
              <Badge variant="secondary" className="ml-2">
                {sessions.length}
              </Badge>
            </CardTitle>
            <CardDescription>
              Manage your active login sessions across all devices
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
              Logout All Devices
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {globalLoggingOut && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Logging out from all devices... You will be redirected to login.
            </AlertDescription>
          </Alert>
        )}

        {sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
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
          <div className="space-y-3">
            {sessions.map((session) => {
              const DeviceIcon = getDeviceIcon(session.userAgent);
              const deviceType = getDeviceType(session.userAgent);
              const location = getLocationFromIP(session.ipAddress);
              
              return (
                <div
                  key={session.id}
                  className={cn(
                    "flex items-center justify-between p-4 rounded-lg border transition-colors",
                    session.isCurrent 
                      ? "bg-primary/5 border-primary/20" 
                      : "bg-muted/30 hover:bg-muted/50"
                  )}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "p-2 rounded-full",
                      session.isCurrent ? "bg-primary/10" : "bg-muted"
                    )}>
                      <DeviceIcon className={cn(
                        "h-5 w-5",
                        session.isCurrent ? "text-primary" : "text-muted-foreground"
                      )} />
                    </div>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">
                          {session.deviceName || deviceType}
                        </h4>
                        {session.isCurrent && (
                          <Badge variant="default" className="text-xs">
                            Current Device
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {location}
                        </div>
                        <div className="flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {session.ipAddress}
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatLastUsed(session.lastUsedAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {!session.isCurrent && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeSession(session.id)}
                      disabled={revoking === session.id}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      {revoking === session.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Sessions expire automatically after 7 days of inactivity</span>
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