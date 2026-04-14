import { ExamEngine } from '../../../../../../../src/share-branding/ExamEngine/components/ExamEngine';
import { loadExamSessionData } from '../../../../../../../src/share-branding/ExamEngine/components/examSessionLoader';
import { rthConfig } from '../../../../../../../src/share-branding/brandConfig';

export default async function ActiveExamPage() {
  const session = await loadExamSessionData();
  return <ExamEngine brand={rthConfig} session={session} />;
}
