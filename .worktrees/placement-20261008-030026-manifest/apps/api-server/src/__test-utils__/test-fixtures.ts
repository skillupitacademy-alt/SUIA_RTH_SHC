export const TEST_USER = {
  id: 'user-123',
  email: 'test@example.com',
  name: 'Test User',
};

export const TEST_DOMAIN = {
  id: 'domain-123',
  name: 'Cloud Computing',
  category: 'technical',
};

export const TEST_SUBJECT = {
  id: 'subject-123',
  domainId: 'domain-123',
  name: 'AWS Solutions Architect',
};

export const TEST_TOPIC = {
  id: 'topic-123',
  subjectId: 'subject-123',
  name: 'IAM',
  detailedNotesPath: '/notes/aws-iam.md',
};

export const TEST_QUESTION = {
  id: 'q-123',
  topicId: 'topic-123',
  questionText: 'What is IAM?',
  difficulty: 'simple',
  type: 'mcq',
  options: { a: 'Identity Access Management', b: 'Wrong' },
  correctAnswer: 'a',
};
