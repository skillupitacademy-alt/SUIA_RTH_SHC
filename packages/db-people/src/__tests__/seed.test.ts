import { describe, expect, it } from 'vitest';

import { hierarchySeed } from '../seed';

describe('hierarchy seed', () => {
  it('includes the required starter hierarchy', () => {
    expect(hierarchySeed.domain.slug).toBe('full-stack');
    expect(hierarchySeed.subject.name).toBe('JavaScript');
    expect(hierarchySeed.topic.slug).toBe('asynchronous-programming');
    expect(hierarchySeed.subtopic.name).toBe('JavaScript Promises');
  });
});
