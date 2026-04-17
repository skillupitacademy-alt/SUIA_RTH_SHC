/**
 * 🔐 PRODUCTION USER PROFILE SERVICE
 * 
 * Real API integration for user profile management.
 * Pattern: UI → BFF (/api/profile) → API Server (/api/auth/profile) → DB
 */

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
 * Map API response to UI format
 */
function mapProfileFromApi(apiData: ApiProfileResponse, userEmail: string): UserProfile {
  return {
    id: apiData.id,
    fullName: apiData.name || 'User',
    email: userEmail,
    educationLevel: apiData.educationLevel || 'Not specified',
    status: apiData.professionalStatus || 'Student',
    primaryGoal: apiData.primaryGoal || 'Learning',
    domain: apiData.domain || 'General',
    subDomain: apiData.subDomain || 'Foundations',
    skillLevel: apiData.adaptiveLevel || 'beginner',
    timeCommitment: apiData.timeCommitment || 'Flexible',
    createdAt: apiData.createdAt,
  };
}

/**
 * Map UI format to API request
 */
function mapProfileToApi(uiData: Partial<UserProfile>): Partial<ApiProfileResponse> {
  const apiData: Partial<ApiProfileResponse> = {};
  
  if (uiData.fullName !== undefined) apiData.name = uiData.fullName;
  if (uiData.educationLevel !== undefined) apiData.educationLevel = uiData.educationLevel;
  if (uiData.status !== undefined) apiData.professionalStatus = uiData.status;
  if (uiData.primaryGoal !== undefined) apiData.primaryGoal = uiData.primaryGoal;
  if (uiData.domain !== undefined) apiData.domain = uiData.domain;
  if (uiData.subDomain !== undefined) apiData.subDomain = uiData.subDomain;
  if (uiData.skillLevel !== undefined) {
    apiData.adaptiveLevel = uiData.skillLevel as 'beginner' | 'intermediate' | 'advanced';
  }
  if (uiData.timeCommitment !== undefined) apiData.timeCommitment = uiData.timeCommitment;
  
  return apiData;
}

/**
 * Fetch user profile from backend
 */
export async function getUserProfile(): Promise<UserProfile> {
  const res = await fetch('/api/profile', {
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
    throw new Error(error.message || 'Failed to fetch profile');
  }

  const data = await res.json();
  
  // Handle both direct profile response and wrapped response
  const profileData = data.data || data;
  const userEmail = profileData.email || profileData.user?.email || 'user@example.com';
  
  return mapProfileFromApi(profileData, userEmail);
}

/**
 * Update user profile
 */
export async function updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
  const apiUpdates = mapProfileToApi(updates);
  
  const res = await fetch('/api/profile', {
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
