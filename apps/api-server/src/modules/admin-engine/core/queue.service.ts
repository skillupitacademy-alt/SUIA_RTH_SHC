export const queueService = {
  // Minimal stub used by AdminQuestionEngine for semantic indexing enqueue
  async enqueue(type: string, payload: unknown) {
    // In tests we mock this; default implementation resolves immediately.
    return { success: true, type, payload };
  },
};
