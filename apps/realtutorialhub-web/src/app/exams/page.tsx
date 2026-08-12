import { redirect } from 'next/navigation';

interface ExamsPageProps {
  searchParams?: Promise<{ examId?: string }>;
}

export default async function ExamsPage({ searchParams }: ExamsPageProps) {
  const resolvedSearchParams = await searchParams;
  const examId = resolvedSearchParams?.examId?.trim();

  if (examId) {
    redirect(`/exam?examId=${encodeURIComponent(examId)}`);
  }

  redirect('/launch-exam');
}
