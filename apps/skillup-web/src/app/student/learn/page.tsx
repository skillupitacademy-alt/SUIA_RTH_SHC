import { redirect } from 'next/navigation';

export default function LearnRedirectPage() {
  redirect(process.env.NEXT_PUBLIC_NOTES_URL ?? 'https://notes.realtutorialhub.com');
}
