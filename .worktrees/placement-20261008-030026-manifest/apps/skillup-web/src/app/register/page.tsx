import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Register',
  description: 'Create a SkillUp IT Academy student profile.',
};

export default function RegisterPage() {
  redirect('/signup');
}
