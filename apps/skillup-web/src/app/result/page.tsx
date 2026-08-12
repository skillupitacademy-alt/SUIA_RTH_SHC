import ExamResultPage from '../../../../../src/share-branding/ExamResultPage';
import { skillUpConfig } from '../../../../../src/share-branding/brandConfig';

interface ResultPageProps {
  searchParams?: Promise<{ examId?: string }>;
}

export default async function ResultPage({ searchParams }: ResultPageProps) {
  const resolvedSearchParams = await searchParams;
  return <ExamResultPage brand={skillUpConfig} examId={resolvedSearchParams?.examId} />;
}
