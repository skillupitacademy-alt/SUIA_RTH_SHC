'use client';

import React, { useState, useEffect } from 'react';
import { useBrand } from '@/share-branding/PostLandingPage/app/context/BrandContext';
import { getUserProfile, updateUserProfile, UserProfile } from '@/share-branding/services/userProfileClient';
import { Edit2, Save, X, Loader2, User, Mail, GraduationCap, Briefcase, Target, Code, BarChart3, Clock } from 'lucide-react';
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
      <div className="p-6 rounded-2xl bg-white border border-gray-200">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ 
              backgroundColor: brand.primaryColor,
              opacity: 0.15,
              position: 'absolute'
            }}
          />
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 relative z-10"
          >
            <Icon style={{ color: brand.primaryColor }} size={22} />
          </div>
          <div className="flex-1 w-full relative z-20">
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
      <div className="rounded-[2rem] p-8 bg-white border border-gray-200 shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 mb-2">Profile Settings</h1>
            <p className="text-gray-600">Manage your personal information and learning preferences</p>
          </div>
          
          {!isEditing ? (
            <button
              onClick={handleEdit}
              className="flex items-center gap-2 px-6 h-12 rounded-2xl font-semibold text-white shadow-md hover:-translate-y-0.5 transition-all"
              style={{ backgroundColor: brand.primaryColor }}
            >
              <Edit2 size={18} />
              Edit Profile
            </button>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={handleCancel}
                className="flex items-center gap-2 px-6 h-12 rounded-2xl font-semibold border-2 border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
              >
                <X size={18} />
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!isDirty || isSaving}
                className="flex items-center gap-2 px-6 h-12 rounded-2xl font-semibold text-white shadow-md hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
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

        {/* Profile Avatar */}
        <div className="flex items-center gap-6 p-6 rounded-2xl bg-gray-50 border border-gray-200">
          <div
            className="w-24 h-24 rounded-2xl flex items-center justify-center text-white text-3xl font-black"
            style={{ backgroundColor: brand.primaryColor }}
          >
            {editedProfile.fullName.split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().substring(0, 2) || 'U'}
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-900 mb-1">{editedProfile.fullName}</h2>
            <p className="text-gray-600">{editedProfile.email}</p>
            <p className="text-sm text-gray-500 mt-1">Member since {new Date(editedProfile.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Personal Information */}
      <div className="rounded-[2rem] p-8 bg-white border border-gray-200 shadow-sm">
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
      <div className="rounded-[2rem] p-8 bg-white border border-gray-200 shadow-sm">
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
    </div>
  );
}
