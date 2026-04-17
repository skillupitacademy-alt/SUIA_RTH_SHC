// Mock user profile service (To be replaced with real BFF service layer later)
import { fetchCurrentUserState } from '../auth/authLoader';

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

const mockProfile: UserProfile = {
  id: '1',
  fullName: 'User Learner',
  email: 'learner@example.com',
  educationLevel: 'Bachelor\'s Degree',
  status: 'Professional',
  primaryGoal: 'Career Advancement',
  domain: 'Software Development',
  subDomain: 'Frontend Development',
  skillLevel: 'Intermediate',
  timeCommitment: '10-15 hours/week',
  createdAt: new Date().toISOString(),
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function getUserProfile(): Promise<UserProfile> {
  await delay(500);
  
  // Try to pull some truth from current state
  try {
    const authState = await fetchCurrentUserState();
    // This is purely for demonstration of integration, the actual DB user fetches
    // will happen via proper server requests later.
  } catch (e) {
    // ignore
  }

  return { ...mockProfile };
}

export async function updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
  await delay(800);
  Object.assign(mockProfile, updates);
  return { ...mockProfile };
}
