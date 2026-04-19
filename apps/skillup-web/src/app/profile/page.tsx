import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import ProfilePage from '@/share-branding/ProfilePage';
import { skillUpConfig } from '@/share-branding/brandConfig';

function ProfileLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <Loader2 className="h-8 w-8 animate-spin" />
      <span className="ml-2">Loading profile...</span>
    </div>
  );
}

export default function SkillUpProfilePage() {
  return (
    <Suspense fallback={<ProfileLoading />}>
      <ProfilePage config={skillUpConfig} />
    </Suspense>
  );
}

export const metadata = {
  title: 'Profile Settings - SkillUp IT Academy',
  description: 'Manage your profile and security settings',
};