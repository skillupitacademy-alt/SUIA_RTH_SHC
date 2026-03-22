import { TutorialProgressRepository } from '@quiz/db-tutorial';

export async function markAiTutorBlockComplete(userId: string, subtopicId: string) {
  const repository = new TutorialProgressRepository();
  return repository.markBlockComplete(userId, subtopicId, 'ai_tutor');
}
