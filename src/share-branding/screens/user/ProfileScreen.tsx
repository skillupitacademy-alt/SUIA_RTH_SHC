'use client';

import React, { useState, useEffect } from 'react';
import { useBrand } from '@/share-branding/PostLandingPage/app/context/BrandContext';
import { getUserProfile, updateUserProfile, UserProfile } from '@/share-branding/services/userProfileClient';
import { Edit2, Save, X, Loader2, User, Mail, GraduationCap, Briefcase, Target, Code, BarChart3, Clock, Shield, Settings, CheckCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/share-branding/ui/tabs';
import { DeviceSessions } from '@/share-branding/ui/device-sessions';
import { Button } from '@/share-branding/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/share-branding/ui/card';
import {
  EDUCATION_LEVEL_OPTIONS,
  STATUS_OPTIONS,
  GOAL_OPTIONS,
  DOMAIN_OPTIONS,
  SUB_DOMAIN_MAPPINGS,
  SKILL_LEVEL_OPTIONS,
  TIME_COMMITMENT_OPTIONS
} from '@/share-branding/constants/fieldMappings';

export function ProfileScreen() {
  const brand = useBrand();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [editedProfile, setEditedProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getUserProfile();
      setProfile(data);
      setEditedProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError(null);
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!editedProfile) return;
    
    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateUserProfile(editedProfile);
      setProfile(updated);
      setEditedProfile(updated);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (field: keyof UserProfile, value: string) => {
    if (!editedProfile) return;
    setEditedProfile({ ...editedProfile, [field]: value });
  };

  const isDirty = JSON.stringify(profile) !== JSON.stringify(editedProfile);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="animate-spin text-gray-400 mx-auto mb-4" size={48} />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error && !profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <X className="text-red-600" size={32} />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Failed to Load Profile</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={loadProfile}
            className="px-6 py-3 rounded-xl font-semibold text-white"
            style={{ backgroundColor: brand.primaryColor }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!profile || !editedProfile) {
    return null;
  }

  const InfoField = ({ icon: Icon, label, value, field, options, isSelect = false }: any) => {
    const isEditable = field && isEditing;
    
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center">
            <div
              className="absolute inset-0 rounded-xl"
              style={{
                backgroundColor: brand.primaryColor,
                opacity: 0.15,
              }}
            />
            <Icon className="relative z-10" style={{ color: brand.primaryColor }} size={22} />
          </div>
          <div className="relative z-20 w-full flex-1">
            <label className="text-sm font-semibold text-gray-500 mb-2 block">{label}</label>
            {isEditable && isSelect ? (
              <select
                value={value}
                onChange={(e) => handleChange(field, e.target.value)}
                className="w-full px-4 py-2 rounded-xl border-2 transition-all focus:outline-none bg-white text-gray-900 font-semibold"
                style={{
                  borderColor: '#e5e7eb', // gray-200 fallback
                }}
                onFocus={(e) => (e.target as HTMLSelectElement).style.borderColor = brand.secondaryColor}
                onBlur={(e) => (e.target as HTMLSelectElement).style.borderColor = '#e5e7eb'}
              >
                {options?.map((opt: string) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            ) : isEditable ? (
              <input
                type="text"
                value={value}
                onChange={(e) => handleChange(field, e.target.value)}
                className="w-full px-4 py-2 rounded-xl border-2 transition-all focus:outline-none bg-white text-gray-900 font-semibold"
                style={{
                  borderColor: '#e5e7eb',
                }}
                onFocus={(e) => (e.target as HTMLInputElement).style.borderColor = brand.secondaryColor}
                onBlur={(e) => (e.target as HTMLInputElement).style.borderColor = '#e5e7eb'}
              />
            ) : (
              <p className="text-lg font-semibold text-gray-900">{value}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const availableSubDomains = SUB_DOMAIN_MAPPINGS[editedProfile.domain] || ['Foundations'];

  return (
    <div className="space-y-6">
      {/* Error Banner */}
      {error && (
        <div className="rounded-2xl p-4 bg-red-50 border border-red-200 flex items-start gap-3">
          <X className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
          <div className="flex-1">
            <p className="font-semibold text-red-900">Error</p>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            <X size={20} />
          </button>
        </div>
      )}

      {/* Header Card */}
      <div className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="mb-2 text-3xl font-black text-gray-900 sm:text-4xl">Profile Settings</h1>
            <p className="text-gray-600">Manage your personal information, learning preferences, and security settings</p>
          </div>
        </div>

        {/* Profile Avatar */}
        <div className="flex flex-col items-start gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-5 sm:flex-row sm:items-center sm:gap-6 sm:p-6">
          <div
            className="flex h-20 w-20 items-center justify-center rounded-2xl text-3xl font-black text-white sm:h-24 sm:w-24"
            style={{ backgroundColor: brand.primaryColor }}
          >
            {editedProfile.fullName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U'}
          </div>
          <div className="min-w-0">
            <h2 className="mb-1 text-2xl font-black text-gray-900">{editedProfile.fullName}</h2>
            <p className="break-all text-gray-600 sm:break-normal">{editedProfile.email}</p>
            <p className="text-sm text-gray-500 mt-1">Member since {new Date(editedProfile.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
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
          <div className="flex justify-end">
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-6 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 sm:w-auto"
                style={{ backgroundColor: brand.primaryColor }}
              >
                <Edit2 size={18} />
                Edit Profile
              </button>
            ) : (
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                <button
                  onClick={handleCancel}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border-2 border-gray-300 px-6 font-semibold text-gray-700 transition-all hover:bg-gray-50 sm:w-auto"
                >
                  <X size={18} />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={!isDirty || isSaving}
                  className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl px-6 font-semibold text-white shadow-md transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none sm:w-auto"
                  style={{ backgroundColor: brand.primaryColor }}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Personal Information */}
          <div className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
            <h2 className="text-2xl font-black text-gray-900 mb-6">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField
                icon={User}
                label="Full Name"
                value={editedProfile.fullName}
                field="fullName"
              />
              <InfoField
                icon={Mail}
                label="Email Address"
                value={editedProfile.email}
                field={null}
              />
              <InfoField
                icon={GraduationCap}
                label="Education Level"
                value={editedProfile.educationLevel}
                field="educationLevel"
                options={EDUCATION_LEVEL_OPTIONS}
                isSelect={true}
              />
              <InfoField
                icon={Briefcase}
                label="Current Status"
                value={editedProfile.status}
                field="status"
                options={STATUS_OPTIONS}
                isSelect={true}
              />
            </div>
          </div>

          {/* Learning Preferences */}
          <div className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm sm:p-8">
            <h2 className="text-2xl font-black text-gray-900 mb-6">Learning Preferences</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InfoField
                icon={Target}
                label="Primary Goal"
                value={editedProfile.primaryGoal}
                field="primaryGoal"
                options={GOAL_OPTIONS}
                isSelect={true}
              />
              <InfoField
                icon={Code}
                label="Domain"
                value={editedProfile.domain}
                field="domain"
                options={DOMAIN_OPTIONS}
                isSelect={true}
              />
              <InfoField
                icon={Code}
                label="Sub-Domain"
                value={editedProfile.subDomain}
                field="subDomain"
                options={availableSubDomains.length > 0 ? availableSubDomains : ['Foundations']}
                isSelect={true}
              />
              <InfoField
                icon={BarChart3}
                label="Skill Level"
                value={editedProfile.skillLevel}
                field="skillLevel"
                options={SKILL_LEVEL_OPTIONS}
                isSelect={true}
              />
              <InfoField
                icon={Clock}
                label="Time Commitment"
                value={editedProfile.timeCommitment}
                field="timeCommitment"
                options={TIME_COMMITMENT_OPTIONS}
                isSelect={true}
              />
            </div>
          </div>
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
          
          {/* Security Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Security Settings
              </CardTitle>
              <CardDescription>
                Manage your account security and authentication
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Change Password */}
              <div className="flex flex-col items-stretch gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="rounded-full bg-blue-100 p-2">
                    <Shield className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold">Change Password</h4>
                    <p className="break-words text-sm text-muted-foreground">
                      Last updated: {new Date(editedProfile.updatedAt || editedProfile.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full justify-center whitespace-normal sm:w-auto">
                  Change Password
                </Button>
              </div>
              
              {/* Two-Factor Authentication */}
              <div className="flex flex-col items-stretch gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="rounded-full bg-green-100 p-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold">Two-Factor Authentication</h4>
                    <p className="break-words text-sm text-muted-foreground">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full justify-center whitespace-normal sm:w-auto">
                  Enable 2FA
                </Button>
              </div>

              {/* Login Notifications */}
              <div className="flex flex-col items-stretch gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="rounded-full bg-purple-100 p-2">
                    <Mail className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold">Login Notifications</h4>
                    <p className="break-words text-sm text-muted-foreground">
                      Get notified when someone signs into your account
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full justify-center whitespace-normal sm:w-auto">
                  Configure
                </Button>
              </div>

              {/* Account Recovery */}
              <div className="flex flex-col items-stretch gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3">
                  <div className="rounded-full bg-orange-100 p-2">
                    <User className="h-4 w-4 text-orange-600" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-semibold">Account Recovery</h4>
                    <p className="break-words text-sm text-muted-foreground">
                      Manage backup email and recovery options
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full justify-center whitespace-normal sm:w-auto">
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Security Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Recent Security Activity
              </CardTitle>
              <CardDescription>
                Monitor recent security events on your account
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-green-900">Successful login</p>
                    <p className="text-xs text-green-700">Today at {new Date().toLocaleTimeString()} • This device</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <Shield className="h-4 w-4 text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">Password last changed</p>
                    <p className="text-xs text-blue-700">{new Date(editedProfile.updatedAt || editedProfile.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                
                <div className="text-center py-4">
                  <Button variant="ghost" size="sm">
                    View All Activity
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
