import { skillUpConfig } from '../../../../../src/share-branding/brandConfig';
import { ExamEngine } from '../../../../../src/share-branding/ExamEngine/components/ExamEngine';
import { loadExamSessionData } from '../../../../../src/share-branding/ExamEngine/components/examSessionLoader';

export default async function ExamPage() {
  const session = await loadExamSessionData();
  return <ExamEngine brand={skillUpConfig} session={session} />;
}
