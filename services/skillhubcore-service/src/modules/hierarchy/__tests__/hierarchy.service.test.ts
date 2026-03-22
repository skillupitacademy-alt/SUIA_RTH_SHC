import { randomUUID } from 'crypto';

import { describe, expect, it, vi } from 'vitest';

import { HierarchyService } from '../hierarchy.service';

class FakeHierarchyRepo {
  readonly domains = [{ id: randomUUID(), name: 'Full Stack', slug: 'full-stack', description: 'desc' }];
  readonly subjects = [{ id: randomUUID(), domainId: 'domain-1', name: 'JavaScript', slug: 'javascript', description: 'desc' }];
  readonly topics = [{ id: randomUUID(), subjectId: 'subject-1', name: 'Async', slug: 'async', description: 'desc' }];
  readonly subtopics: Array<any> = [];

  async getDomains() {
    return this.domains;
  }

  async getSubjects() {
    return this.subjects;
  }

  async getTopics() {
    return this.topics;
  }

  async getSubtopics() {
    return this.subtopics;
  }

  async createSubtopic(input: any) {
    const subtopic = { id: randomUUID(), ...input };
    this.subtopics.push(subtopic);
    return subtopic;
  }
}

describe('HierarchyService', () => {
  it('publishes hierarchy.subtopic_added after creating a subtopic', async () => {
    const repo = new FakeHierarchyRepo();
    const publisher = { publishSubtopicAdded: vi.fn(async () => undefined) };
    const service = new HierarchyService(repo as any, publisher as any);

    const subtopic = await service.createSubtopic({
      topicId: 'topic-1',
      subjectId: 'subject-1',
      domainId: 'domain-1',
      name: 'JavaScript Promises',
      slug: 'javascript-promises',
      description: 'desc',
      difficultyLevels: ['beginner', 'intermediate'],
    });

    expect(subtopic.name).toBe('JavaScript Promises');
    expect(publisher.publishSubtopicAdded).toHaveBeenCalledTimes(1);
  });
});
