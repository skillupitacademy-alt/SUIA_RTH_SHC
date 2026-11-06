import { TutorialProgressRepository } from '@quiz/db-tutorial';

export async function markAiTutorBlockComplete(
  userId: string,
  subtopicId: string,
  tenantId: 'realtutorialhub' | 'skillup' = 'realtutorialhub'
) {
  const repository = new TutorialProgressRepository();
  return repository.markBlockComplete(userId, subtopicId, 'ai_tutor', tenantId);
}
