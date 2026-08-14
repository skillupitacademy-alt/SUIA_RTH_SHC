import DetailedExamSummaryPage from './DetailedExamSummaryPage';
import { BrandConfig } from './brandConfig';

interface ExamResultPageProps {
  brand: BrandConfig;
  examId?: string;
}

export default function ExamResultPage({ brand, examId }: ExamResultPageProps) {
  return <DetailedExamSummaryPage brand={brand} examId={examId} />;
}
