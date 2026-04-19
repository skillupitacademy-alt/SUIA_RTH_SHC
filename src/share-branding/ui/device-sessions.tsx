'use client';

import React, { useState, useEffect } from 'react';
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  MapPin, 
  Calendar, 
  Shield, 
  Trash2, 
  AlertTriangle,
  CheckCircle2,
  Loader2,
  LogOut,
  Chrome,
  Globe
} from 'lucide-react';
import { Button } from './button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './card';
import { Badge } from './badge';
import { Alert, AlertDescription } from './alert';
import { cn } from './utils';

interface DeviceSession {
  id: string;
  deviceId: string | null;
  deviceName: string | null;
  ipAddress: string | null;
  userAgent: string | null;
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
function getDeviceIcon(userAgent: string | null) {
  if (!userAgent) return Monitor;
  
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return Smartphone;
  }
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return Tablet;
  }
  return Monitor;
}

function getDeviceType(userAgent: string | null, deviceName: string | null): string {
  // Prefer deviceName if available
  if (deviceName && deviceName.trim().length > 0) {
    return deviceName;
  }
  
  // Fallback to parsing userAgent
  if (!userAgent) return 'Unknown Device';
  
  const ua = userAgent.toLowerCase();
  
  // Browser detection
  if (ua.includes('chrome') && !ua.includes('edge')) return 'Chrome Browser';
  if (ua.includes('firefox')) return 'Firefox Browser';
  if (ua.includes('safari') && !ua.includes('chrome')) return 'Safari Browser';
  if (ua.includes('edge') || ua.includes('edg/')) return 'Edge Browser';
  if (ua.includes('opera') || ua.includes('opr/')) return 'Opera Browser';
  
  // Device detection
  if (ua.includes('iphone')) return 'iPhone';
  if (ua.includes('ipad')) return 'iPad';
  if (ua.includes('android')) return 'Android Device';
  if (ua.includes('windows')) return 'Windows PC';
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
  if (diffMins === 1) return '1 min ago';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours === 1) return '1 hour ago';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  
  return date.toLocaleDateString();
}

function getLocationFromIP(ip: string | null): string {
  if (!ip) return 'Unknown location';
  
  // In a real implementation, you'd use a geolocation service
  // For now, return a placeholder based on IP patterns
  if (ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    return 'Local Network';
  }
  if (ip.startsWith('203.')) return 'Asia Pacific';
  if (ip.startsWith('185.')) return 'Europe';
  if (ip.startsWith('104.')) return 'North America';
  
  return 'Unknown location';
}

export function DeviceSessions({ className, onSessionRevoked, onGlobalLogout }: DeviceSessionsProps) {
  const [sessions, setSessions] = useState<DeviceSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [globalLoggingOut, setGlobalLoggingOut] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [suspiciousActivity, setSuspiciousActivity] = useState<boolean>(false);

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
      
      // Mark current session and filter out sessions without device info
      const currentDeviceId = localStorage.getItem('deviceId') || 'unknown';
      const validSessions = (data.sessions || [])
        .filter((session: DeviceSession) => {
          // ✅ CHECK 3: Handle NULL device fields gracefully
          // Keep sessions that have at least some device information
          return session.deviceId || session.userAgent || session.ipAddress;
        })
        .map((session: DeviceSession) => ({
          ...session,
          isCurrent: session.deviceId === currentDeviceId
        }));
      
      setSessions(validSessions);
      
      // Check for suspicious activity (multiple locations)
      const uniqueLocations = [...new Set(validSessions
        .filter((s: DeviceSession) => s.ipAddress)
        .map((s: DeviceSession) => getLocationFromIP(s.ipAddress)))];
      setSuspiciousActivity(uniqueLocations.length > 2);
      
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
      setShowLogoutConfirm(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  if (loading) {
    return (
      <Card className="w-full">
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
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-600">Loading sessions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentDevice = sessions.find(s => s.isCurrent);
  const otherDevices = sessions.filter(s => !s.isCurrent);

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Active Sessions
                {sessions.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {sessions.length}
                  </Badge>
                )}
              </CardTitle>
              <CardDescription>
                {sessions.length === 0 
                  ? "No active sessions found" 
                  : sessions.length === 1 
                    ? "You're signed in on this device only" 
                    : `You're signed in on ${sessions.length} devices`}
              </CardDescription>
            </div>
            
            {sessions.length > 1 && !globalLoggingOut && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-2"
              >
                <LogOut className="h-4 w-4" />
                Log out all devices
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

          {suspiciousActivity && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Suspicious Activity Detected</strong>
                <br />
                Your account is signed in from multiple locations. If this wasn't you, please log out all devices and change your password.
              </AlertDescription>
            </Alert>
          )}

          {globalLoggingOut && (
            <Alert>
              <CheckCircle2 className="h-4 w-4" />
              <AlertDescription>
                Logging out from all devices... You will be redirected to login.
              </AlertDescription>
            </Alert>
          )}

          {sessions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="font-medium">No active sessions found</p>
              <p className="text-sm mt-1">Please log in to create a session</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Current Device - Hero Section */}
              {currentDevice && (
                <div className="p-4 rounded-lg border-2 border-green-200 bg-green-50/50">
                  <div className="flex items-start gap-4">
                    <div className="p-2.5 rounded-lg bg-green-100">
                      {React.createElement(getDeviceIcon(currentDevice.userAgent), {
                        className: "h-5 w-5 text-green-700"
                      })}
                    </div>
                    
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-gray-900">
                          {getDeviceType(currentDevice.userAgent, currentDevice.deviceName)}
                        </h4>
                        <Badge className="bg-green-600 hover:bg-green-700 text-white text-xs">
                          This Device
                        </Badge>
                        <Badge variant="outline" className="text-xs border-green-600 text-green-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Secure
                        </Badge>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="font-medium">{getLocationFromIP(currentDevice.ipAddress)}</span>
                        </div>
                        {currentDevice.ipAddress && (
                          <div className="flex items-center gap-1.5">
                            <Globe className="h-3.5 w-3.5" />
                            <span className="text-gray-500">{currentDevice.ipAddress}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span className="font-medium text-green-700">Active now</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Other Devices */}
              {otherDevices.map((session) => {
                const DeviceIcon = getDeviceIcon(session.userAgent);
                const deviceType = getDeviceType(session.userAgent, session.deviceName);
                const location = getLocationFromIP(session.ipAddress);
                
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-2.5 rounded-lg bg-gray-100">
                        <DeviceIcon className="h-5 w-5 text-gray-600" />
                      </div>
                      
                      <div className="space-y-1.5 flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm">
                          {deviceType}
                        </h4>
                        
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{location}</span>
                          </div>
                          {session.ipAddress && (
                            <div className="flex items-center gap-1">
                              <Globe className="h-3 w-3" />
                              <span>{session.ipAddress}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>Last active: {formatLastUsed(session.lastUsedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => revokeSession(session.id)}
                      disabled={revoking === session.id}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 ml-4"
                    >
                      {revoking === session.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Sessions expire automatically after 7 days of inactivity</span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={fetchSessions}
                disabled={loading}
                className="text-xs"
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Global Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                Log out from all devices?
              </CardTitle>
              <CardDescription>
                This will end all active sessions across devices. You'll need to log in again on each device.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowLogoutConfirm(false)}
                disabled={globalLoggingOut}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleGlobalLogout}
                disabled={globalLoggingOut}
                className="flex items-center gap-2"
              >
                {globalLoggingOut ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Logging out...
                  </>
                ) : (
                  <>
                    <LogOut className="h-4 w-4" />
                    Confirm Logout
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}
