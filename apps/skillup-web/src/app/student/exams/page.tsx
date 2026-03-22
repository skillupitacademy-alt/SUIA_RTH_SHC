import { redirect } from 'next/navigation';

export default function ExamsRedirectPage() {
  redirect(process.env.NEXT_PUBLIC_QUIZ_URL ?? 'https://quiz.realtutorialhub.com');
}
