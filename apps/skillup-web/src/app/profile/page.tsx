import { redirect } from 'next/navigation';

/**
 * Standalone /profile route - DEPRECATED
 * Redirects to unified dashboard profile
 * Pattern: One user → One profile → One control center
 */
export default function SkillUpProfilePage() {
  redirect('/dashboard/profile');
}

export const metadata = {
  title: 'Profile Settings - SkillUp IT Academy',
  description: 'Manage your profile and security settings',
};
