'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Shield, 
  Settings, 
  Edit3, 
  Save, 
  X,
  Loader2,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { BrandConfig } from './brandConfig';
import { BrandProvider } from './PostLandingPage/app/context/BrandContext';
import { AuthRefreshProvider } from './auth/AuthRefreshProvider';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { DeviceSessions } from './ui/device-sessions';
import { cn } from './ui/utils';

interface ProfileData {
  id: string;
  email: string;
  name: string;
  educationLevel?: string;
  professionalStatus?: string;
  ageGroup?: string;
  experienceYears?: number;
  domainInterest?: string[];
  adaptiveLevel?: 'beginner' | 'intermediate' | 'advanced';
  primaryGoal?: string;
  domain?: string;
  subDomain?: string;
  timeCommitment?: string;
  journeyStatus?: string;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProfilePageProps {
  config: BrandConfig;
  initialData?: ProfileData;
}

function ProfileContent({ config }: { config: BrandConfig }) {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<ProfileData>>({});

  // Fetch profile data
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await unifiedFetch('/api/profile', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'x-portal-identity': 'user',
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const data = await response.json();
      const profileData = data.data || data;
      
      setProfile(profileData);
      setEditForm(profileData);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  // Save profile changes
  const saveProfile = async () => {
    try {
      setSaving(true);
      setError(null);
      
      const response = await unifiedFetch('/api/profile', {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-portal-identity': 'user'
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        throw new Error(`Failed to save profile: ${response.status}`);
      }

      const data = await response.json();
      const updatedProfile = data.data || data;
      
      setProfile(updatedProfile);
      setEditing(false);
      setSuccess('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      console.error('Failed to save profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to save profile');
    } finally {
      setSaving(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (field: keyof ProfileData, value: any) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditForm(profile || {});
    setEditing(false);
    setError(null);
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading profile...</span>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-semibold mb-2">Profile Not Found</h3>
        <p className="text-muted-foreground mb-4">
          Please complete your onboarding to create your profile.
        </p>
        <Button onClick={() => window.location.href = '/onboarding'}>
          Complete Onboarding
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-900">
                Profile Settings
              </h1>
              <p className="text-slate-500 font-bold mt-1">
                Manage your account and security settings
              </p>
            </div>
            
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <Badge 
                variant={profile.onboardingCompleted ? "default" : "secondary"}
                className="px-3 py-1"
              >
                {profile.onboardingCompleted ? "Onboarded" : "Pending"}
              </Badge>
              
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                style={{ backgroundColor: config.primaryColor }}
              >
                {profile.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Status Messages */}
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert className="mb-6 border-green-200 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">{success}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Personal Information
                    </CardTitle>
                    <CardDescription>
                      Update your personal details and preferences
                    </CardDescription>
                  </div>
                  
                  {!editing ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditing(true)}
                      className="flex w-full items-center justify-center gap-2 sm:w-auto"
                    >
                      <Edit3 className="h-4 w-4" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelEdit}
                        disabled={saving}
                        className="w-full sm:w-auto"
                      >
                        <X className="h-4 w-4" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={saveProfile}
                        disabled={saving}
                        className="flex w-full items-center justify-center gap-2 sm:w-auto"
                        style={{ backgroundColor: config.primaryColor }}
                      >
                        {saving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Save
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    {editing ? (
                      <Input
                        id="name"
                        value={editForm.name || ''}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        placeholder="Enter your full name"
                      />
                    ) : (
                      <p className="text-sm font-medium py-2">{profile.name || 'Not provided'}</p>
                    )}
                  </div>

                  {/* Email (read-only) */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="email"
                        value={profile.email}
                        disabled
                        className="bg-muted"
                      />
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>

                  {/* Education Level */}
                  <div className="space-y-2">
                    <Label htmlFor="education">Education Level</Label>
                    {editing ? (
                      <Input
                        id="education"
                        value={editForm.educationLevel || ''}
                        onChange={(e) => handleInputChange('educationLevel', e.target.value)}
                        placeholder="e.g., Bachelor's Degree"
                      />
                    ) : (
                      <p className="text-sm font-medium py-2">{profile.educationLevel || 'Not provided'}</p>
                    )}
                  </div>

                  {/* Professional Status */}
                  <div className="space-y-2">
                    <Label htmlFor="status">Professional Status</Label>
                    {editing ? (
                      <Input
                        id="status"
                        value={editForm.professionalStatus || ''}
                        onChange={(e) => handleInputChange('professionalStatus', e.target.value)}
                        placeholder="e.g., Software Developer"
                      />
                    ) : (
                      <p className="text-sm font-medium py-2">{profile.professionalStatus || 'Not provided'}</p>
                    )}
                  </div>

                  {/* Domain */}
                  <div className="space-y-2">
                    <Label htmlFor="domain">Domain</Label>
                    {editing ? (
                      <Input
                        id="domain"
                        value={editForm.domain || ''}
                        onChange={(e) => handleInputChange('domain', e.target.value)}
                        placeholder="e.g., Technology"
                      />
                    ) : (
                      <p className="text-sm font-medium py-2">{profile.domain || 'Not provided'}</p>
                    )}
                  </div>

                  {/* Sub Domain */}
                  <div className="space-y-2">
                    <Label htmlFor="subdomain">Specialization</Label>
                    {editing ? (
                      <Input
                        id="subdomain"
                        value={editForm.subDomain || ''}
                        onChange={(e) => handleInputChange('subDomain', e.target.value)}
                        placeholder="e.g., Web Development"
                      />
                    ) : (
                      <p className="text-sm font-medium py-2">{profile.subDomain || 'Not provided'}</p>
                    )}
                  </div>
                </div>

                {/* Learning Preferences */}
                <div className="pt-6 border-t">
                  <h4 className="font-semibold mb-4">Learning Preferences</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Primary Goal</Label>
                      <p className="text-sm font-medium py-2">{profile.primaryGoal || 'Not set'}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Time Commitment</Label>
                      <p className="text-sm font-medium py-2">{profile.timeCommitment || 'Not set'}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Adaptive Level</Label>
                      <Badge variant="secondary" className="w-fit">
                        {profile.adaptiveLevel || 'Not set'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <DeviceSessions 
              onSessionRevoked={(sessionId) => {
                console.log('Session revoked:', sessionId);
              }}
              onGlobalLogout={() => {
                console.log('Global logout initiated');
              }}
            />
            
            {/* Additional Security Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Additional security options for your account
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex flex-col items-stretch gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold">Password</h4>
                    <p className="break-words text-sm text-muted-foreground">
                      Last updated: {new Date(profile.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full justify-center whitespace-normal sm:w-auto">
                    Change Password
                  </Button>
                </div>
                
                <div className="flex flex-col items-stretch gap-4 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold">Two-Factor Authentication</h4>
                    <p className="break-words text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="w-full justify-center whitespace-normal sm:w-auto">
                    Enable 2FA
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function ProfilePage({ config, initialData }: ProfilePageProps) {
  return (
    <BrandProvider brand={config}>
      <AuthRefreshProvider>
        <ProfileContent config={config} />
      </AuthRefreshProvider>
    </BrandProvider>
  );
}
