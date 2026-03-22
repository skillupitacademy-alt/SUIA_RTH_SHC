import { logger } from '@/lib/logger';
import type { CreateSubtopicInput, HierarchyDomainDTO, HierarchySubjectDTO, HierarchyTopicDTO, HierarchySubtopicDTO } from './hierarchy.types';
import { HierarchyPublisher } from './hierarchy.publisher';
import { HierarchyRepository } from './hierarchy.repository';

export class HierarchyService {
  constructor(
    private readonly repo = new HierarchyRepository(),
    private readonly publisher = new HierarchyPublisher()
  ) {}

  getDomains(): Promise<HierarchyDomainDTO[]> {
    return this.repo.getDomains();
  }

  getSubjects(domainId: string): Promise<HierarchySubjectDTO[]> {
    return this.repo.getSubjects(domainId);
  }

  getTopics(subjectId: string): Promise<HierarchyTopicDTO[]> {
    return this.repo.getTopics(subjectId);
  }

  getSubtopics(topicId: string): Promise<HierarchySubtopicDTO[]> {
    return this.repo.getSubtopics(topicId);
  }

  async createSubtopic(input: CreateSubtopicInput): Promise<HierarchySubtopicDTO> {
    const subtopic = await this.repo.createSubtopic(input);
    await this.publisher.publishSubtopicAdded({
      subtopicId: subtopic.id,
      topicId: input.topicId,
      subjectId: input.subjectId,
      domainId: input.domainId,
      name: input.name,
      slug: input.slug,
      difficultyLevels: input.difficultyLevels,
    });
    logger.info({ action: 'hierarchy.subtopic_added', subtopicId: subtopic.id }, 'subtopic added');
    return subtopic;
  }
}
