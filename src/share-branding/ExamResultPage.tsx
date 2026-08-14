import ExamResultSummaryPage from './ExamResultSummaryPage';
import { BrandConfig } from './brandConfig';

interface ExamResultPageProps {
  brand: BrandConfig;
  examId?: string;
}

export default function ExamResultPage({ brand, examId }: ExamResultPageProps) {
  return <ExamResultSummaryPage brand={brand} examId={examId} />;
}
