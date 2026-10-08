import { rthConfig } from '../../../../../src/share-branding/brandConfig';
import { ExamEngine } from '../../../../../src/share-branding/ExamEngine/components/ExamEngine';
import { loadExamSessionData } from '../../../../../src/share-branding/ExamEngine/components/examSessionLoader';

interface ExamPageProps {
  searchParams?: Promise<{ examId?: string }>;
}

export default async function ExamPage({ searchParams }: ExamPageProps) {
  const resolvedSearchParams = await searchParams;
  const session = await loadExamSessionData(resolvedSearchParams?.examId);
  return <ExamEngine brand={rthConfig} session={session} />;
}
