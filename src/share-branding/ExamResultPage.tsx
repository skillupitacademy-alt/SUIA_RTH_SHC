import ExamSummaryReport from './ExamSummaryReport';
import { BrandConfig } from './brandConfig';

interface ExamResultPageProps {
  brand: BrandConfig;
  examId?: string;
}

export default function ExamResultPage({ brand, examId }: ExamResultPageProps) {
  return <ExamSummaryReport brand={brand} examId={examId} />;
}
