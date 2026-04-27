/**
 * 🔐 PRODUCTION USER PROFILE SERVICE
 * 
 * Real API integration for user profile management.
 * Pattern: UI → BFF (/api/profile) → API Server (/api/auth/profile) → DB
 */

import { unifiedFetch } from '../lib/unifiedFetch';
import {
  mapEducationLevelToUI,
  mapEducationLevelToDB,
  mapStatusToUI,
  mapStatusToDB,
  mapGoalToUI,
  mapGoalToDB,
  mapDomainToUI,
  mapDomainToDB,
  mapSkillLevelToUI,
  mapSkillLevelToDB,
  mapTimeCommitmentToUI,
  mapTimeCommitmentToDB
} from '../constants/fieldMappings';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  educationLevel: string;
  status: string;
  primaryGoal: string;
  domain: string;
  subDomain: string;
  skillLevel: string;
  timeCommitment: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * API Response from backend (field names match database schema)
 */
interface ApiProfileResponse {
  id: string;
  userId: string;
  name: string;
  educationLevel: string | null;
  professionalStatus: string | null;
  primaryGoal: string | null;
  domain: string | null;
  subDomain: string | null;
  adaptiveLevel: 'beginner' | 'intermediate' | 'advanced';
  timeCommitment: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Map API response to UI format with proper field mappings
 */
function mapProfileFromApi(apiData: ApiProfileResponse, userEmail: string): UserProfile {
  return {
    id: apiData.id,
    fullName: apiData.name || 'User',
    email: userEmail,
    educationLevel: mapEducationLevelToUI(apiData.educationLevel),
    status: mapStatusToUI(apiData.professionalStatus),
    primaryGoal: mapGoalToUI(apiData.primaryGoal),
    domain: mapDomainToUI(apiData.domain),
    subDomain: apiData.subDomain || 'Foundations',
    skillLevel: mapSkillLevelToUI(apiData.adaptiveLevel),
    timeCommitment: mapTimeCommitmentToUI(apiData.timeCommitment),
    createdAt: apiData.createdAt,
    updatedAt: apiData.updatedAt,
  };
}

/**
 * Map UI format to API request with proper field mappings
 */
function mapProfileToApi(uiData: Partial<UserProfile>): Partial<ApiProfileResponse> {
  const apiData: Partial<ApiProfileResponse> = {};
  
  if (uiData.fullName !== undefined) apiData.name = uiData.fullName;
  if (uiData.educationLevel !== undefined) apiData.educationLevel = mapEducationLevelToDB(uiData.educationLevel);
  if (uiData.status !== undefined) apiData.professionalStatus = mapStatusToDB(uiData.status);
  if (uiData.primaryGoal !== undefined) apiData.primaryGoal = mapGoalToDB(uiData.primaryGoal);
  if (uiData.domain !== undefined) apiData.domain = mapDomainToDB(uiData.domain);
  if (uiData.subDomain !== undefined) apiData.subDomain = uiData.subDomain;
  if (uiData.skillLevel !== undefined) {
    apiData.adaptiveLevel = mapSkillLevelToDB(uiData.skillLevel) as 'beginner' | 'intermediate' | 'advanced';
  }
  if (uiData.timeCommitment !== undefined) apiData.timeCommitment = mapTimeCommitmentToDB(uiData.timeCommitment);
  
  return apiData;
}

/**
 * Normalize profile data with graceful degradation
 * Never throws - always returns usable data
 */
function normalizeProfileData(data: any): any {
  if (!data || typeof data !== 'object') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[getUserProfile] Invalid data type, using fallback');
    }
    return null;
  }

  // Handle wrapped response
  const profileData = data.data || data;

  if (!profileData || typeof profileData !== 'object') {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[getUserProfile] Invalid profile structure, using fallback');
    }
    return null;
  }

  // Gracefully handle missing or misnamed fields
  const normalized = {
    ...profileData,
    id: profileData.id || profileData.userId || 'unknown',
    email: profileData.email || profileData.user?.email || 'user@example.com',
    name: profileData.name || profileData.fullName || 'User',
  };

  // Only fail if we truly have no usable data
  if (!normalized.id || normalized.id === 'unknown') {
    console.error('[getUserProfile] No valid user identifier found');
    return null;
  }

  return normalized;
}

/**
 * Fetch user profile from backend
 */
export async function getUserProfile(): Promise<UserProfile> {
  try {
    const res = await unifiedFetch('/api/profile', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Failed to fetch profile' }));
      console.error('[getUserProfile] API error:', res.status, error);
      throw new Error(error.message || `Failed to fetch profile (${res.status})`);
    }

    const data = await res.json();
    
    // Normalize data with graceful degradation
    const profileData = normalizeProfileData(data);
    
    if (!profileData) {
      throw new Error('Unable to process profile data from server');
    }
    
    const userEmail = profileData.email || 'user@example.com';
    
    return mapProfileFromApi(profileData, userEmail);
  } catch (error) {
    console.error('[getUserProfile] Exception:', error);
    throw error;
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
  const apiUpdates = mapProfileToApi(updates);
  
  const res = await unifiedFetch('/api/profile', {
    method: 'PATCH',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(apiUpdates),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Failed to update profile' }));
    throw new Error(error.message || 'Failed to update profile');
  }

  const data = await res.json();
  const profileData = data.data || data;
  const userEmail = updates.email || profileData.email || 'user@example.com';
  
  return mapProfileFromApi(profileData, userEmail);
}
